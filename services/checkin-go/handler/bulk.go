package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/clubsetu/checkin-go/middleware"
	"github.com/clubsetu/checkin-go/model"
	"github.com/clubsetu/checkin-go/pkg"
	"github.com/clubsetu/checkin-go/store"
)

// BulkHandler handles bulk check-in operations.
type BulkHandler struct {
	db    *store.PostgresStore
	cache *store.RedisStore
}

// NewBulkHandler creates a new BulkHandler.
func NewBulkHandler(db *store.PostgresStore, cache *store.RedisStore) *BulkHandler {
	return &BulkHandler{
		db:    db,
		cache: cache,
	}
}

// BulkCheckIn handles POST /bulk-check-in
// Checks in multiple attendees at once using batch DB operations.
func (h *BulkHandler) BulkCheckIn(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		return
	}

	var req model.BulkCheckinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid request body"})
		return
	}

	if len(req.RegistrationIDs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "registrationIds is required"})
		return
	}

	if len(req.RegistrationIDs) > 500 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Maximum 500 registrations per bulk operation"})
		return
	}

	gate := req.Gate
	if gate == "" {
		gate = "main"
	}

	ctx := r.Context()

	// Resolve all registrations and validate authorization
	var checkins []*model.Checkin
	var errors []model.BulkItemError
	var eventID string

	for _, regID := range req.RegistrationIDs {
		reg, err := h.db.GetRegistration(ctx, regID)
		if err != nil {
			errors = append(errors, model.BulkItemError{
				RegistrationID: regID,
				Reason:         "database error",
			})
			continue
		}
		if reg == nil {
			errors = append(errors, model.BulkItemError{
				RegistrationID: regID,
				Reason:         "registration not found",
			})
			continue
		}
		if reg.Status != "CONFIRMED" {
			errors = append(errors, model.BulkItemError{
				RegistrationID: regID,
				Reason:         "registration not confirmed",
			})
			continue
		}

		// Track the event ID for authorization check (all should be same event)
		if eventID == "" {
			eventID = reg.EventID

			// Authorization check once per event
			if user.Role == "club" || user.Role == "facultyCoordinator" {
				clubID, err := h.db.GetEventClubID(ctx, eventID)
				if err != nil {
					writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
					return
				}
				if clubID != user.ClubID {
					writeJSON(w, http.StatusForbidden, map[string]string{"message": "Access denied. Not your club's event."})
					return
				}
			}
		}

		checkins = append(checkins, &model.Checkin{
			ID:             pkg.NewObjectID(),
			EventID:        reg.EventID,
			UserID:         reg.UserID,
			RegistrationID: regID,
			CheckedInAt:    time.Now(),
			CheckedInBy:    user.UserID,
			Gate:           gate,
			Method:         "bulk",
		})
	}

	// Batch insert all valid check-ins
	var succeeded int
	var dbErrors []model.BulkItemError

	if len(checkins) > 0 {
		succeeded, dbErrors = h.db.BulkInsertCheckins(ctx, checkins)
		errors = append(errors, dbErrors...)
	}

	// Update Redis counter by the number of successful inserts
	if succeeded > 0 && eventID != "" {
		for i := 0; i < succeeded; i++ {
			h.cache.IncrementCount(ctx, eventID)
		}

		// Publish a summary live event
		count, _ := h.cache.GetCount(ctx, eventID)
		liveEvent := &model.LiveEvent{
			Type:      "checkin",
			EventID:   eventID,
			Gate:      gate,
			Count:     count,
			Timestamp: time.Now().Unix(),
		}
		if err := h.cache.PublishLiveEvent(ctx, liveEvent); err != nil {
			log.Printf("[BulkCheckIn] Redis publish error: %v", err)
		}
	}

	response := model.BulkCheckinResponse{
		Total:     len(req.RegistrationIDs),
		Succeeded: succeeded,
		Failed:    len(errors),
		Errors:    errors,
	}

	writeJSON(w, http.StatusOK, response)
}
