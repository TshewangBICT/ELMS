package utils

import (
	"encoding/json"
	"net/http"
)

// HashPassword - For plain text, just return the password as-is
func HashPassword(password string) (string, error) {
	// Don't hash, just return plain text
	return password, nil
}

// CheckPasswordHash - For plain text, compare directly
func CheckPasswordHash(password, hash string) bool {
	// Direct comparison for plain text
	return password == hash
}

// RespondWithJSON sends JSON response
func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// RespondWithError sends error response
func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, map[string]string{"error": message})
}
