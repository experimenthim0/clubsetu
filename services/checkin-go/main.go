package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/clubsetu/checkin-go/config"
	"github.com/clubsetu/checkin-go/handler"
	mw "github.com/clubsetu/checkin-go/middleware"
	"github.com/clubsetu/checkin-go/store"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Initialize PostgreSQL connection pool
	log.Println("Connecting to PostgreSQL...")
	db, err := store.NewPostgresStore(ctx, cfg.DatabaseURL, cfg.DBMaxConns, cfg.DBMinConns)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()
	log.Println("PostgreSQL connected ✓")

	// Initialize Redis
	log.Println("Connecting to Redis...")
	cache, err := store.NewRedisStore(ctx, cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer cache.Close()
	log.Println("Redis connected ✓")

	// Initialize handlers
	checkinHandler := handler.NewCheckinHandler(db, cache)
	qrHandler := handler.NewQRHandler(db, cfg.JWTSecret)
	statsHandler := handler.NewStatsHandler(db, cache)
	bulkHandler := handler.NewBulkHandler(db, cache)

	// Build router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(30 * time.Second))
	r.Use(mw.CORS())
	r.Use(httprate.LimitByIP(100, 1*time.Minute))

	// Health check — no auth required
	r.Get("/api/checkin/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"checkin-go"}`))
	})

	// WebSocket live stream — auth is optional (handled via query param or header)
	r.Get("/api/checkin/live/{eventId}", statsHandler.LiveStream)

	// Authenticated routes
	r.Group(func(r chi.Router) {
		r.Use(mw.Auth(cfg.JWTSecret))

		// QR code generation — available to members (their own) and club/admin
		r.Get("/api/checkin/qr/{registrationId}", qrHandler.GenerateQR)

		// Check-in operations — club and admin only
		r.Group(func(r chi.Router) {
			r.Use(mw.RequireRoles("club", "facultyCoordinator", "admin"))

			r.Post("/api/checkin/check-in", checkinHandler.CheckIn)
			r.Delete("/api/checkin/undo", checkinHandler.Undo)
			r.Post("/api/checkin/bulk-check-in", bulkHandler.BulkCheckIn)
			r.Get("/api/checkin/stats/{eventId}", statsHandler.GetStats)
		})
	})

	// Start server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start listening in a goroutine
	go func() {
		log.Printf("Check-in service starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-ctx.Done()
	log.Println("Shutting down gracefully...")

	// Give active connections 10 seconds to finish
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced shutdown: %v", err)
	}

	log.Println("Server stopped ✓")
}
