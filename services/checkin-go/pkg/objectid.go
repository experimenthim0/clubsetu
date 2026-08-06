package pkg

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

// objectIDCounter is a thread-safe incrementing counter for unique ID generation.
var (
	objectIDCounter uint32
	counterMu       sync.Mutex
	machineID       []byte
)

func init() {
	// Generate a random 3-byte machine ID at startup
	machineID = make([]byte, 3)
	_, _ = rand.Read(machineID)
}

// NewObjectID generates a 24-character hex string compatible with the existing
// ClubSetu ID format (mimics MongoDB ObjectID structure).
func NewObjectID() string {
	counterMu.Lock()
	objectIDCounter++
	counter := objectIDCounter
	counterMu.Unlock()

	var buf [12]byte

	// 4 bytes: timestamp
	ts := uint32(time.Now().Unix())
	buf[0] = byte(ts >> 24)
	buf[1] = byte(ts >> 16)
	buf[2] = byte(ts >> 8)
	buf[3] = byte(ts)

	// 3 bytes: machine ID
	copy(buf[4:7], machineID)

	// 2 bytes: random
	randBytes := make([]byte, 2)
	_, _ = rand.Read(randBytes)
	copy(buf[7:9], randBytes)

	// 3 bytes: counter
	buf[9] = byte(counter >> 16)
	buf[10] = byte(counter >> 8)
	buf[11] = byte(counter)

	return hex.EncodeToString(buf[:])
}
