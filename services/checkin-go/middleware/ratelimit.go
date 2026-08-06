package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// RateLimitByIP returns a Chi-compatible middleware that limits requests
// per IP address. Configured at 100 requests/minute for check-in scanner traffic.
func RateLimitByIP() func(http.Handler) http.Handler {
	return httprate.LimitByIP(100, 1*time.Minute)
}
