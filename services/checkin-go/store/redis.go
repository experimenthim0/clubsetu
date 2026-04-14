package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/clubsetu/checkin-go/model"
	"github.com/redis/go-redis/v9"
)

// RedisStore manages real-time counters and pub/sub for live check-in events.
type RedisStore struct {
	client *redis.Client
}

// NewRedisStore connects to Redis and verifies connectivity.
func NewRedisStore(ctx context.Context, redisURL string) (*RedisStore, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis URL: %w", err)
	}

	client := redis.NewClient(opts)

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return &RedisStore{client: client}, nil
}

// Close shuts down the Redis connection.
func (s *RedisStore) Close() error {
	return s.client.Close()
}

// counterKey returns the Redis key for an event's check-in counter.
func counterKey(eventID string) string {
	return fmt.Sprintf("checkin:count:%s", eventID)
}

// channelKey returns the Redis pub/sub channel for an event.
func channelKey(eventID string) string {
	return fmt.Sprintf("checkin:%s", eventID)
}

// IncrementCount atomically increments the check-in count for an event
// and returns the new count.
func (s *RedisStore) IncrementCount(ctx context.Context, eventID string) (int, error) {
	val, err := s.client.Incr(ctx, counterKey(eventID)).Result()
	if err != nil {
		return 0, err
	}
	return int(val), nil
}

// DecrementCount atomically decrements the check-in count for an event
// and returns the new count. Will not go below 0.
func (s *RedisStore) DecrementCount(ctx context.Context, eventID string) (int, error) {
	val, err := s.client.Decr(ctx, counterKey(eventID)).Result()
	if err != nil {
		return 0, err
	}
	if val < 0 {
		s.client.Set(ctx, counterKey(eventID), 0, 0)
		return 0, nil
	}
	return int(val), nil
}

// GetCount returns the current check-in count for an event.
func (s *RedisStore) GetCount(ctx context.Context, eventID string) (int, error) {
	val, err := s.client.Get(ctx, counterKey(eventID)).Result()
	if err == redis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	count, err := strconv.Atoi(val)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// SetCount sets the check-in count for an event (used for syncing with DB).
func (s *RedisStore) SetCount(ctx context.Context, eventID string, count int) error {
	return s.client.Set(ctx, counterKey(eventID), count, 0).Err()
}

// PublishLiveEvent publishes a check-in event to the Redis pub/sub channel
// for real-time WebSocket fan-out.
func (s *RedisStore) PublishLiveEvent(ctx context.Context, event *model.LiveEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return s.client.Publish(ctx, channelKey(event.EventID), string(data)).Err()
}

// Subscribe returns a Redis pub/sub subscription for an event's check-in channel.
func (s *RedisStore) Subscribe(ctx context.Context, eventID string) *redis.PubSub {
	return s.client.Subscribe(ctx, channelKey(eventID))
}
