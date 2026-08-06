package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/clubsetu/checkin-go/middleware"
	"github.com/clubsetu/checkin-go/store"
	"github.com/go-chi/chi/v5"

	"nhooyr.io/websocket"
)

// StatsHandler provides check-in statistics and live WebSocket streaming.
type StatsHandler struct {
	db    *store.PostgresStore
	cache *store.RedisStore
}

// NewStatsHandler creates a new StatsHandler.
func NewStatsHandler(db *store.PostgresStore, cache *store.RedisStore) *StatsHandler {
	return &StatsHandler{
		db:    db,
		cache: cache,
	}
}

// GetStats handles GET /stats/:eventId
// Returns aggregated check-in statistics for an event.
func (h *StatsHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		return
	}

	eventID := chi.URLParam(r, "eventId")
	if eventID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "eventId is required"})
		return
	}

	ctx := r.Context()

	// Authorization: club users can only view stats for their own club's events
	if user.Role == "club" || user.Role == "facultyCoordinator" {
		clubID, err := h.db.GetEventClubID(ctx, eventID)
		if err != nil {
			log.Printf("[Stats] DB error: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
			return
		}
		if clubID != user.ClubID {
			writeJSON(w, http.StatusForbidden, map[string]string{"message": "Access denied"})
			return
		}
	}

	stats, err := h.db.GetEventStats(ctx, eventID)
	if err != nil {
		log.Printf("[Stats] DB error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Failed to fetch stats"})
		return
	}

	writeJSON(w, http.StatusOK, stats)
}

// LiveStream handles GET /live/:eventId
// Upgrades to WebSocket and streams real-time check-in events.
func (h *StatsHandler) LiveStream(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventId")
	if eventID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "eventId is required"})
		return
	}

	// Accept WebSocket connection
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{
			"clubsetu.vercel.app",
			"*.vercel.app",
			"clubsetu.nikhim.me",
			"*.nikhim.me",
			"localhost:*",
			"127.0.0.1:*",
		},
	})
	if err != nil {
		log.Printf("[LiveStream] WebSocket accept error: %v", err)
		return
	}
	defer conn.CloseNow()

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// Subscribe to Redis pub/sub channel for this event
	pubsub := h.cache.Subscribe(ctx, eventID)
	defer pubsub.Close()

	ch := pubsub.Channel()

	// Send initial count
	count, _ := h.cache.GetCount(ctx, eventID)
	initialMsg, _ := json.Marshal(map[string]interface{}{
		"type":  "init",
		"count": count,
	})
	if err := conn.Write(ctx, websocket.MessageText, initialMsg); err != nil {
		return
	}

	// Stream events from Redis pub/sub to WebSocket
	for {
		select {
		case <-ctx.Done():
			conn.Close(websocket.StatusNormalClosure, "connection closed")
			return
		case msg, ok := <-ch:
			if !ok {
				conn.Close(websocket.StatusNormalClosure, "channel closed")
				return
			}

			writeCtx, writeCancel := context.WithTimeout(ctx, 5*time.Second)
			err := conn.Write(writeCtx, websocket.MessageText, []byte(msg.Payload))
			writeCancel()

			if err != nil {
				log.Printf("[LiveStream] WebSocket write error: %v", err)
				return
			}
		}
	}
}
