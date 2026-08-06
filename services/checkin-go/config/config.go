package config

import (
	"fmt"
	"os"
)

// Config holds all configuration for the check-in service.
type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string

	// Connection pool tuning
	DBMaxConns int32
	DBMinConns int32
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		DBMaxConns:  50,
		DBMinConns:  10,
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
