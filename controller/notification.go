package controller

import (
	"net/http"
	"strconv"

	"leaveapp/model"
	httpResp "leaveapp/utils"

	"github.com/gorilla/mux"
)

// GetMyNotifications - GET /notifications
func GetMyNotifications(w http.ResponseWriter, r *http.Request) {
	// Get session
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	notifications, err := model.GetMyNotifications(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching notifications: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    notifications,
	})
}

// GetUnreadCount - GET /notifications/unread/count
func GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	// Get session
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	count, err := model.GetUnreadCount(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching unread count: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"unread":  count,
	})
}

// MarkAsRead - PUT /notifications/{id}/read
func MarkAsRead(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid notification ID")
		return
	}

	// Get session
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	if err := model.MarkAsRead(id, employeeID); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Notification marked as read",
	})
}

// MarkAllAsRead - PUT /notifications/read-all
func MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	// Get session
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	if err := model.MarkAllAsRead(employeeID); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error marking notifications as read: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "All notifications marked as read",
	})
}

// DeleteNotification - DELETE /notifications/{id}
func DeleteNotification(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid notification ID")
		return
	}

	// Get session
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	if err := model.DeleteNotification(id, employeeID); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Notification deleted successfully",
	})
}

// DeleteAllNotifications - DELETE /notifications/all
func DeleteAllNotifications(w http.ResponseWriter, r *http.Request) {
	// Get session
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	if err := model.DeleteAllNotifications(employeeID); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error deleting notifications: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "All notifications deleted successfully",
	})
}
