package pkg

import "fmt"

// BuildQRContent creates the string content that gets encoded into the QR code.
// Format: "clubsetu://checkin?rid={registrationId}&token={signedJWT}"
// This URL-scheme format allows future mobile app deep-linking.
func BuildQRContent(registrationID, signedToken string) string {
	return fmt.Sprintf("clubsetu://checkin?rid=%s&token=%s", registrationID, signedToken)
}
