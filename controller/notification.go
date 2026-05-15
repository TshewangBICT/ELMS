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

	userRole, _ := session.Values["role"].(string)

	var notifications []model.Notification
	var err error

	if userRole == "admin" {
		notifications, err = model.GetAllNotifications()
	} else {
		notifications, err = model.GetMyNotifications(employeeID)
	}

	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching notifications")
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    notifications,
	})
}

// GetUnreadCount - GET /notifications/unread/count
func GetUnreadCount(w http.ResponseWriter, r *http.Request) {
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

	userRole, _ := session.Values["role"].(string)

	var count int
	var err error

	if userRole == "admin" {
		count, err = model.GetAllUnreadCount()
	} else {
		count, err = model.GetUnreadCount(employeeID)
	}

	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching unread count")
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

	userRole, _ := session.Values["role"].(string)

	if userRole == "admin" {
		if err := model.MarkAsReadAdmin(id); err != nil {
			httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}
	} else {
		if err := model.MarkAsRead(id, employeeID); err != nil {
			httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Marked as read",
	})
}

// MarkAllAsRead - PUT /notifications/read-all
func MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
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

	userRole, _ := session.Values["role"].(string)

	var err error
	if userRole == "admin" {
		err = model.MarkAllAsReadAdmin()
	} else {
		err = model.MarkAllAsRead(employeeID)
	}

	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error marking all as read")
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "All marked as read",
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

	userRole, _ := session.Values["role"].(string)

	if userRole == "admin" {
		if err := model.DeleteNotificationAdmin(id); err != nil {
			httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}
	} else {
		if err := model.DeleteNotification(id, employeeID); err != nil {
			httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Deleted",
	})
}

// DeleteAllNotifications - DELETE /notifications/all
func DeleteAllNotifications(w http.ResponseWriter, r *http.Request) {
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

	userRole, _ := session.Values["role"].(string)

	var err error
	if userRole == "admin" {
		err = model.DeleteAllNotificationsAdmin()
	} else {
		err = model.DeleteAllNotifications(employeeID)
	}

	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error deleting notifications")
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "All deleted",
	})
}