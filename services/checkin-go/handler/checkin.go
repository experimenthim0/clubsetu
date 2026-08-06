package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/clubsetu/checkin-go/middleware"
	"github.com/clubsetu/checkin-go/model"
	"github.com/clubsetu/checkin-go/pkg"
	"github.com/clubsetu/checkin-go/store"
)

// CheckinHandler handles single check-in and undo operations.
type CheckinHandler struct {
	db    *store.PostgresStore
	cache *store.RedisStore

	// inFlight prevents duplicate concurrent check-ins for the same registration.
	// Key: registrationID, Value: true while processing.
	inFlight sync.Map
}

// NewCheckinHandler creates a new CheckinHandler.
func NewCheckinHandler(db *store.PostgresStore, cache *store.RedisStore) *CheckinHandler {
	return &CheckinHandler{
		db:    db,
		cache: cache,
	}
}

// CheckIn handles POST /check-in
// Checks in a single attendee by registration ID.
func (h *CheckinHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		return
	}

	var req model.CheckinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid request body"})
		return
	}

	if req.RegistrationID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "registrationId is required"})
		return
	}

	// In-flight dedup: prevent concurrent check-ins for the same registration
	if _, loaded := h.inFlight.LoadOrStore(req.RegistrationID, true); loaded {
		writeJSON(w, http.StatusConflict, map[string]string{"message": "Check-in already in progress"})
		return
	}
	defer h.inFlight.Delete(req.RegistrationID)

	ctx := r.Context()

	// Fetch registration
	reg, err := h.db.GetRegistration(ctx, req.RegistrationID)
	if err != nil {
		log.Printf("[CheckIn] DB error fetching registration: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
		return
	}
	if reg == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "Registration not found"})
		return
	}

	if reg.Status != "CONFIRMED" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Registration is not confirmed"})
		return
	}

	// Authorization: club users can only check in for their own club's events
	if user.Role == "club" || user.Role == "facultyCoordinator" {
		clubID, err := h.db.GetEventClubID(ctx, reg.EventID)
		if err != nil {
			log.Printf("[CheckIn] DB error fetching event club: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
			return
		}
		if clubID != user.ClubID {
			writeJSON(w, http.StatusForbidden, map[string]string{"message": "Access denied. Not your club's event."})
			return
		}
	}

	// Set defaults
	gate := req.Gate
	if gate == "" {
		gate = "main"
	}
	method := req.Method
	if method == "" {
		method = "qr"
	}

	checkin := &model.Checkin{
		ID:             pkg.NewObjectID(),
		EventID:        reg.EventID,
		UserID:         reg.UserID,
		RegistrationID: req.RegistrationID,
		CheckedInAt:    time.Now(),
		CheckedInBy:    user.UserID,
		Gate:           gate,
		Method:         method,
	}

	// Insert into DB (unique constraint prevents duplicates)
	inserted, err := h.db.InsertCheckin(ctx, checkin)
	if err != nil {
		log.Printf("[CheckIn] DB error inserting check-in: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
		return
	}
	if !inserted {
		writeJSON(w, http.StatusConflict, map[string]string{"message": "Already checked in"})
		return
	}

	// Increment Redis counter and publish live event
	count, _ := h.cache.IncrementCount(ctx, reg.EventID)

	liveEvent := &model.LiveEvent{
		Type:      "checkin",
		EventID:   reg.EventID,
		UserID:    reg.UserID,
		UserName:  reg.UserName,
		Gate:      gate,
		Count:     count,
		Timestamp: time.Now().Unix(),
	}
	if err := h.cache.PublishLiveEvent(ctx, liveEvent); err != nil {
		log.Printf("[CheckIn] Redis publish error: %v", err)
		// Non-fatal: check-in succeeded even if broadcast fails
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":  "Check-in successful",
		"checkin":  checkin,
		"count":    count,
		"userName": reg.UserName,
	})
}

// Undo handles DELETE /undo
// Reverses a check-in (for mistake correction).
func (h *CheckinHandler) Undo(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		return
	}

	var req model.UndoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid request body"})
		return
	}

	if req.RegistrationID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "registrationId is required"})
		return
	}

	ctx := r.Context()

	// Fetch the existing check-in to get event info
	existing, err := h.db.GetCheckinByRegistration(ctx, req.RegistrationID)
	if err != nil {
		log.Printf("[Undo] DB error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
		return
	}
	if existing == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "Check-in not found"})
		return
	}

	// Authorization
	if user.Role == "club" || user.Role == "facultyCoordinator" {
		clubID, err := h.db.GetEventClubID(ctx, existing.EventID)
		if err != nil {
			log.Printf("[Undo] DB error: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
			return
		}
		if clubID != user.ClubID {
			writeJSON(w, http.StatusForbidden, map[string]string{"message": "Access denied"})
			return
		}
	}

	deleted, err := h.db.DeleteCheckin(ctx, req.RegistrationID)
	if err != nil {
		log.Printf("[Undo] DB error deleting: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
		return
	}
	if !deleted {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "Check-in not found"})
		return
	}

	// Decrement Redis counter and publish undo event
	count, _ := h.cache.DecrementCount(ctx, existing.EventID)

	liveEvent := &model.LiveEvent{
		Type:      "undo",
		EventID:   existing.EventID,
		UserID:    existing.UserID,
		Gate:      existing.Gate,
		Count:     count,
		Timestamp: time.Now().Unix(),
	}
	if err := h.cache.PublishLiveEvent(ctx, liveEvent); err != nil {
		log.Printf("[Undo] Redis publish error: %v", err)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Check-in undone",
		"count":   count,
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
