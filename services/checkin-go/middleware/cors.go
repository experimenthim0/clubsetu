package middleware

import "net/http"

// CORS returns middleware that sets Cross-Origin Resource Sharing headers.
// This mirrors the CORS policy from the Node.js server's corsConfig.js.
func CORS() func(http.Handler) http.Handler {
	allowedOrigins := map[string]bool{
		"https://clubsetu.vercel.app":     true,
		"https://www.clubsetu.vercel.app": true,
		"https://clubsetu.nikhim.me":      true,
		"https://www.clubsetu.nikhim.me":  true,
		"http://localhost:5173":            true,
		"http://localhost:5174":            true,
		"http://localhost:3000":            true,
		"http://127.0.0.1:5173":           true,
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			if origin != "" && isAllowedOrigin(origin, allowedOrigins) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			}

			// Handle preflight
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// isAllowedOrigin checks if the origin matches the whitelist or known patterns.
func isAllowedOrigin(origin string, allowed map[string]bool) bool {
	if allowed[origin] {
		return true
	}

	// Allow Vercel preview deployments and custom domains
	if matchesSuffix(origin, ".vercel.app") ||
		matchesSuffix(origin, ".nikhim.me") ||
		matchesSuffix(origin, ".outray.app") {
		return true
	}

	return false
}

func matchesSuffix(s, suffix string) bool {
	return len(s) > len(suffix) && s[len(s)-len(suffix):] == suffix
}
