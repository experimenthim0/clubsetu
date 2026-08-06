package store

import (
	"context"
	"fmt"
	"time"

	"github.com/clubsetu/checkin-go/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresStore manages all database operations for the check-in service.
type PostgresStore struct {
	pool *pgxpool.Pool
}

// NewPostgresStore creates a connection pool and ensures the checkins table exists.
func NewPostgresStore(ctx context.Context, databaseURL string, maxConns, minConns int32) (*PostgresStore, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database URL: %w", err)
	}

	config.MaxConns = maxConns
	config.MinConns = minConns
	config.HealthCheckPeriod = 30 * time.Second
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	store := &PostgresStore{pool: pool}

	if err := store.migrate(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("run migration: %w", err)
	}

	return store, nil
}

// migrate creates the checkins table if it doesn't exist.
func (s *PostgresStore) migrate(ctx context.Context) error {
	query := `
	CREATE TABLE IF NOT EXISTS checkins (
		id              VARCHAR(24) PRIMARY KEY,
		event_id        VARCHAR(24) NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
		user_id         VARCHAR(24) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
		registration_id VARCHAR(24) NOT NULL REFERENCES "Registration"(id) ON DELETE CASCADE,
		checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		checked_in_by   VARCHAR(24),
		gate            VARCHAR(50) DEFAULT 'main',
		method          VARCHAR(20) DEFAULT 'qr',
		UNIQUE(event_id, user_id)
	);
	CREATE INDEX IF NOT EXISTS idx_checkins_event ON checkins(event_id);
	CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id);
	CREATE INDEX IF NOT EXISTS idx_checkins_time ON checkins(checked_in_at);
	`
	_, err := s.pool.Exec(ctx, query)
	return err
}

// Close shuts down the connection pool.
func (s *PostgresStore) Close() {
	s.pool.Close()
}

// GetRegistration fetches a registration by ID, including the user's name.
func (s *PostgresStore) GetRegistration(ctx context.Context, registrationID string) (*model.Registration, error) {
	query := `
		SELECT r.id, r."eventId", r."userId", r.status, u.name
		FROM "Registration" r
		JOIN "User" u ON u.id = r."userId"
		WHERE r.id = $1
	`
	var reg model.Registration
	err := s.pool.QueryRow(ctx, query, registrationID).Scan(
		&reg.ID, &reg.EventID, &reg.UserID, &reg.Status, &reg.UserName,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &reg, nil
}

// GetEventClubID returns the clubId for a given event.
func (s *PostgresStore) GetEventClubID(ctx context.Context, eventID string) (string, error) {
	var clubID *string
	err := s.pool.QueryRow(ctx,
		`SELECT "clubId" FROM "Event" WHERE id = $1`, eventID,
	).Scan(&clubID)
	if err != nil {
		return "", err
	}
	if clubID == nil {
		return "", nil
	}
	return *clubID, nil
}

// InsertCheckin creates a new check-in record. Returns false if already checked in.
func (s *PostgresStore) InsertCheckin(ctx context.Context, checkin *model.Checkin) (bool, error) {
	query := `
		INSERT INTO checkins (id, event_id, user_id, registration_id, checked_in_at, checked_in_by, gate, method)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (event_id, user_id) DO NOTHING
	`
	tag, err := s.pool.Exec(ctx, query,
		checkin.ID,
		checkin.EventID,
		checkin.UserID,
		checkin.RegistrationID,
		checkin.CheckedInAt,
		checkin.CheckedInBy,
		checkin.Gate,
		checkin.Method,
	)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

// DeleteCheckin removes a check-in record. Returns true if a row was deleted.
func (s *PostgresStore) DeleteCheckin(ctx context.Context, registrationID string) (bool, error) {
	tag, err := s.pool.Exec(ctx,
		`DELETE FROM checkins WHERE registration_id = $1`, registrationID,
	)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

// IsCheckedIn checks if a user is already checked in for an event.
func (s *PostgresStore) IsCheckedIn(ctx context.Context, eventID, userID string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM checkins WHERE event_id = $1 AND user_id = $2)`,
		eventID, userID,
	).Scan(&exists)
	return exists, err
}

// GetCheckinByRegistration fetches the check-in record for a registration.
func (s *PostgresStore) GetCheckinByRegistration(ctx context.Context, registrationID string) (*model.Checkin, error) {
	query := `
		SELECT id, event_id, user_id, registration_id, checked_in_at, checked_in_by, gate, method
		FROM checkins WHERE registration_id = $1
	`
	var c model.Checkin
	err := s.pool.QueryRow(ctx, query, registrationID).Scan(
		&c.ID, &c.EventID, &c.UserID, &c.RegistrationID,
		&c.CheckedInAt, &c.CheckedInBy, &c.Gate, &c.Method,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

// GetEventStats returns aggregated check-in statistics for an event.
func (s *PostgresStore) GetEventStats(ctx context.Context, eventID string) (*model.EventStats, error) {
	stats := &model.EventStats{
		EventID: eventID,
		ByGate:  make(map[string]int),
	}

	// Total checked in
	err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM checkins WHERE event_id = $1`, eventID,
	).Scan(&stats.TotalCheckedIn)
	if err != nil {
		return nil, err
	}

	// Total registered
	err = s.pool.QueryRow(ctx,
		`SELECT COALESCE("registeredCount", 0) FROM "Event" WHERE id = $1`, eventID,
	).Scan(&stats.TotalRegistered)
	if err != nil {
		return nil, err
	}

	// By gate
	rows, err := s.pool.Query(ctx,
		`SELECT gate, COUNT(*) FROM checkins WHERE event_id = $1 GROUP BY gate`, eventID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var gate string
		var count int
		if err := rows.Scan(&gate, &count); err != nil {
			return nil, err
		}
		stats.ByGate[gate] = count
	}

	// Timeline (5-minute buckets)
	timelineRows, err := s.pool.Query(ctx, `
		SELECT date_trunc('minute', checked_in_at) - 
			   (EXTRACT(minute FROM checked_in_at)::int % 5) * INTERVAL '1 minute' AS bucket,
			   COUNT(*)
		FROM checkins
		WHERE event_id = $1
		GROUP BY bucket
		ORDER BY bucket
	`, eventID)
	if err != nil {
		return nil, err
	}
	defer timelineRows.Close()

	for timelineRows.Next() {
		var bucket model.TimelineBucket
		if err := timelineRows.Scan(&bucket.Timestamp, &bucket.Count); err != nil {
			return nil, err
		}
		stats.Timeline = append(stats.Timeline, bucket)
	}

	return stats, nil
}

// BulkInsertCheckins inserts multiple check-ins using a batch. Returns per-item results.
func (s *PostgresStore) BulkInsertCheckins(ctx context.Context, checkins []*model.Checkin) (succeeded int, errors []model.BulkItemError) {
	batch := &pgx.Batch{}

	query := `
		INSERT INTO checkins (id, event_id, user_id, registration_id, checked_in_at, checked_in_by, gate, method)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (event_id, user_id) DO NOTHING
	`

	for _, c := range checkins {
		batch.Queue(query, c.ID, c.EventID, c.UserID, c.RegistrationID,
			c.CheckedInAt, c.CheckedInBy, c.Gate, c.Method)
	}

	results := s.pool.SendBatch(ctx, batch)
	defer results.Close()

	for i, c := range checkins {
		tag, err := results.Exec()
		if err != nil {
			errors = append(errors, model.BulkItemError{
				RegistrationID: c.RegistrationID,
				Reason:         err.Error(),
			})
			continue
		}
		if tag.RowsAffected() == 0 {
			errors = append(errors, model.BulkItemError{
				RegistrationID: checkins[i].RegistrationID,
				Reason:         "already checked in",
			})
			continue
		}
		succeeded++
	}

	return succeeded, errors
}
