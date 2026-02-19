package random

import (
	"crypto/rand"
	"encoding/binary"

	"github.com/rs/zerolog/log"
)

// Number generates a random float64 number using crypto/rand for better randomness.
func Number() float64 {
	var randomBytes [8]byte

	_, err := rand.Read(randomBytes[:])
	if err != nil {
		log.Error().Err(err).Msg("[util][random] failed to read random bytes")
	}

	return float64(binary.BigEndian.Uint64(randomBytes[:]))
}
