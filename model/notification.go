package model

import (
	"fmt"
	"leaveapp/dataStore/postgres"
	"time"
)

type Notification struct {
	ID         int       `json:"id"`
	EmployeeID string    `json:"employeeId"`
	Message    string    `json:"message"`
	Type       string    `json:"type"`
	IsRead     bool      `json:"isRead"`
	CreatedAt  time.Time `json:"createdAt"`
}

// CreateNotification - Create a new notification
func CreateNotification(employeeID, message, notifType string) error {
	query := `
		INSERT INTO notifications (employee_id, message, type, created_at)
		VALUES ($1, $2, $3, $4)
	`
	_, err := postgres.Db.Exec(query, employeeID, message, notifType, time.Now())
	return err
}

// GetMyNotifications - Get all notifications for an employee
func GetMyNotifications(employeeID string) ([]Notification, error) {
	query := `
		SELECT id, employee_id, message, type, is_read, created_at
		FROM notifications 
		WHERE employee_id = $1
		ORDER BY created_at DESC
	`

	rows, err := postgres.Db.Query(query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var n Notification
		err := rows.Scan(&n.ID, &n.EmployeeID, &n.Message, &n.Type, &n.IsRead, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, nil
}

// GetUnreadCount - Get count of unread notifications
func GetUnreadCount(employeeID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM notifications WHERE employee_id = $1 AND is_read = false`
	err := postgres.Db.QueryRow(query, employeeID).Scan(&count)
	return count, err
}

// MarkAsRead - Mark a single notification as read
func MarkAsRead(id int, employeeID string) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND employee_id = $2 AND is_read = false`
	result, err := postgres.Db.Exec(query, id, employeeID)
	if err != nil {
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("notification not found")
	}
	return nil
}

// MarkAllAsRead - Mark all notifications as read for an employee
func MarkAllAsRead(employeeID string) error {
	query := `UPDATE notifications SET is_read = true WHERE employee_id = $1 AND is_read = false`
	_, err := postgres.Db.Exec(query, employeeID)
	return err
}

// DeleteNotification - Delete a single notification
func DeleteNotification(id int, employeeID string) error {
	query := `DELETE FROM notifications WHERE id = $1 AND employee_id = $2`
	result, err := postgres.Db.Exec(query, id, employeeID)
	if err != nil {
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("notification not found")
	}
	return nil
}

// DeleteAllNotifications - Delete all notifications for an employee
func DeleteAllNotifications(employeeID string) error {
	query := `DELETE FROM notifications WHERE employee_id = $1`
	_, err := postgres.Db.Exec(query, employeeID)
	return err
}

// GetAllNotifications - Get all notifications (for admin)
func GetAllNotifications() ([]Notification, error) {
	query := `
		SELECT id, employee_id, message, type, is_read, created_at
		FROM notifications 
		ORDER BY created_at DESC
	`

	rows, err := postgres.Db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var n Notification
		err := rows.Scan(&n.ID, &n.EmployeeID, &n.Message, &n.Type, &n.IsRead, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, nil
}

// GetAllUnreadCount - Get total unread count (for admin)
func GetAllUnreadCount() (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM notifications WHERE is_read = false`
	err := postgres.Db.QueryRow(query).Scan(&count)
	return count, err
}

// MarkAsReadAdmin - Mark any notification as read (admin)
func MarkAsReadAdmin(id int) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND is_read = false`
	result, err := postgres.Db.Exec(query, id)
	if err != nil {
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("notification not found")
	}
	return nil
}

// MarkAllAsReadAdmin - Mark all notifications as read (admin)
func MarkAllAsReadAdmin() error {
	query := `UPDATE notifications SET is_read = true WHERE is_read = false`
	_, err := postgres.Db.Exec(query)
	return err
}

// DeleteNotificationAdmin - Delete any notification (admin)
func DeleteNotificationAdmin(id int) error {
	query := `DELETE FROM notifications WHERE id = $1`
	_, err := postgres.Db.Exec(query, id)
	return err
}

// DeleteAllNotificationsAdmin - Delete all notifications (admin)
func DeleteAllNotificationsAdmin() error {
	query := `DELETE FROM notifications`
	_, err := postgres.Db.Exec(query)
	return err
}
