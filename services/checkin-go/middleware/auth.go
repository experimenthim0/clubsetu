package middleware

import (
	"context"
	"net/http"
	"strings"

	"encoding/json"

	"github.com/golang-jwt/jwt/v5"
)

// contextKey is a private type to prevent collisions in context values.
type contextKey string

const (
	// UserContextKey stores the authenticated user claims in the request context.
	UserContextKey contextKey = "user"
)

// UserClaims represents the JWT payload structure from the Node.js auth system.
type UserClaims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	ClubID string `json:"clubId,omitempty"`
}

// jwtClaims wraps UserClaims with standard JWT registered claims.
type jwtClaims struct {
	UserClaims
	jwt.RegisteredClaims
}

// Auth returns middleware that validates JWT tokens using the shared secret.
// It extracts userId, role, email, and clubId from the token and injects them
// into the request context.
func Auth(jwtSecret string) func(http.Handler) http.Handler {
	secretBytes := []byte(jwtSecret)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractToken(r)
			if token == "" {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"message": "No token provided.",
				})
				return
			}

			parsed, err := jwt.ParseWithClaims(token, &jwtClaims{}, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return secretBytes, nil
			})
			if err != nil || !parsed.Valid {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"message": "Invalid or expired token.",
				})
				return
			}

			claims, ok := parsed.Claims.(*jwtClaims)
			if !ok {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"message": "Invalid token claims.",
				})
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, &claims.UserClaims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRoles returns middleware that restricts access to the given roles.
// Must be used after Auth middleware.
func RequireRoles(roles ...string) func(http.Handler) http.Handler {
	roleSet := make(map[string]bool, len(roles))
	for _, r := range roles {
		roleSet[r] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := GetUser(r.Context())
			if user == nil {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"message": "No token",
				})
				return
			}

			if !roleSet[user.Role] {
				writeJSON(w, http.StatusForbidden, map[string]string{
					"message": "Access denied",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUser extracts UserClaims from the request context. Returns nil if not authenticated.
func GetUser(ctx context.Context) *UserClaims {
	user, _ := ctx.Value(UserContextKey).(*UserClaims)
	return user
}

// extractToken pulls the JWT from the Authorization header.
func extractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}
	return authHeader
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
