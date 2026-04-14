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
	"github.com/go-chi/chi/v5"

	goqrcode "github.com/skip2/go-qrcode"

	"github.com/golang-jwt/jwt/v5"
)

// QRHandler generates QR codes for event registrations.
type QRHandler struct {
	db        *store.PostgresStore
	jwtSecret []byte
}

// NewQRHandler creates a new QRHandler.
func NewQRHandler(db *store.PostgresStore, jwtSecret string) *QRHandler {
	return &QRHandler{
		db:        db,
		jwtSecret: []byte(jwtSecret),
	}
}

// GenerateQR handles GET /qr/:registrationId
// Generates a QR code PNG containing a signed JWT payload for the registration.
func (h *QRHandler) GenerateQR(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
		return
	}

	registrationID := chi.URLParam(r, "registrationId")
	if registrationID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "registrationId is required"})
		return
	}

	ctx := r.Context()

	// Fetch registration
	reg, err := h.db.GetRegistration(ctx, registrationID)
	if err != nil {
		log.Printf("[QR] DB error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Internal server error"})
		return
	}
	if reg == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "Registration not found"})
		return
	}

	// Authorization: members can only generate QR for their own registrations
	if user.Role == "member" && user.UserID != reg.UserID {
		writeJSON(w, http.StatusForbidden, map[string]string{"message": "Access denied"})
		return
	}

	// Create a signed QR payload
	payload := model.QRPayload{
		RegistrationID: reg.ID,
		EventID:        reg.EventID,
		UserID:         reg.UserID,
		Exp:            time.Now().Add(24 * time.Hour).Unix(),
	}

	payloadBytes, _ := json.Marshal(payload)

	// Sign the payload with JWT for tamper protection
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"data": string(payloadBytes),
		"exp":  payload.Exp,
	})
	signedToken, err := token.SignedString(h.jwtSecret)
	if err != nil {
		log.Printf("[QR] JWT sign error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Failed to generate QR"})
		return
	}

	// Encode into QR code as a URL-safe string
	qrContent := pkg.BuildQRContent(registrationID, signedToken)

	png, err := goqrcode.Encode(qrContent, goqrcode.Medium, 512)
	if err != nil {
		log.Printf("[QR] encode error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Failed to generate QR"})
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Set("Content-Disposition", "inline")
	w.WriteHeader(http.StatusOK)
	w.Write(png)
}
