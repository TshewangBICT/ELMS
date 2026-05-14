package middleware

import (
	"net/http"

	"leaveapp/utils"

	"github.com/gorilla/sessions"
)

var store = sessions.NewCookieStore([]byte("secret-key"))

// AuthMiddleware - Middleware to protect routes
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, "elms-session")

		if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
			utils.RespondWithError(w, http.StatusUnauthorized, "Please login first")
			return
		}

		next(w, r)
	}
}

// AdminMiddleware - Middleware to check if user is admin
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, "elms-session")

		role, ok := session.Values["role"].(string)
		if !ok || role != "admin" {
			utils.RespondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		next(w, r)
	}
}
