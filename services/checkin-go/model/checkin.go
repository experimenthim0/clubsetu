package model

import "time"

// Checkin represents a single attendee check-in record.
type Checkin struct {
	ID             string    `json:"id"`
	EventID        string    `json:"eventId"`
	UserID         string    `json:"userId"`
	RegistrationID string    `json:"registrationId"`
	CheckedInAt    time.Time `json:"checkedInAt"`
	CheckedInBy    string    `json:"checkedInBy,omitempty"`
	Gate           string    `json:"gate"`
	Method         string    `json:"method"`
}

// CheckinRequest is the payload for a single check-in.
type CheckinRequest struct {
	RegistrationID string `json:"registrationId"`
	Gate           string `json:"gate,omitempty"`
	Method         string `json:"method,omitempty"`
}

// BulkCheckinRequest is the payload for checking in multiple attendees at once.
type BulkCheckinRequest struct {
	RegistrationIDs []string `json:"registrationIds"`
	Gate            string   `json:"gate,omitempty"`
}

// BulkCheckinResponse reports partial success for bulk operations.
type BulkCheckinResponse struct {
	Total     int              `json:"total"`
	Succeeded int              `json:"succeeded"`
	Failed    int              `json:"failed"`
	Errors    []BulkItemError  `json:"errors,omitempty"`
}

// BulkItemError describes why a single item in a bulk operation failed.
type BulkItemError struct {
	RegistrationID string `json:"registrationId"`
	Reason         string `json:"reason"`
}

// UndoRequest is the payload for undoing a check-in.
type UndoRequest struct {
	RegistrationID string `json:"registrationId"`
}

// EventStats holds aggregated check-in statistics for an event.
type EventStats struct {
	EventID        string           `json:"eventId"`
	TotalCheckedIn int              `json:"totalCheckedIn"`
	TotalRegistered int             `json:"totalRegistered"`
	ByGate         map[string]int   `json:"byGate"`
	Timeline       []TimelineBucket `json:"timeline"`
}

// TimelineBucket is an aggregated count for a time window.
type TimelineBucket struct {
	Timestamp time.Time `json:"timestamp"`
	Count     int       `json:"count"`
}

// LiveEvent is broadcast over WebSocket when a check-in occurs.
type LiveEvent struct {
	Type      string `json:"type"` // "checkin" or "undo"
	EventID   string `json:"eventId"`
	UserID    string `json:"userId"`
	UserName  string `json:"userName,omitempty"`
	Gate      string `json:"gate"`
	Count     int    `json:"count"` // updated total
	Timestamp int64  `json:"timestamp"`
}

// QRPayload is the data encoded inside a check-in QR code.
type QRPayload struct {
	RegistrationID string `json:"rid"`
	EventID        string `json:"eid"`
	UserID         string `json:"uid"`
	Exp            int64  `json:"exp"`
}

// Registration is a partial view of the registration table used during check-in.
type Registration struct {
	ID       string `json:"id"`
	EventID  string `json:"eventId"`
	UserID   string `json:"userId"`
	Status   string `json:"status"`
	UserName string `json:"userName,omitempty"`
}
