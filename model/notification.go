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
		var isRead bool
		var createdAt time.Time

		err := rows.Scan(&n.ID, &n.EmployeeID, &n.Message, &n.Type, &isRead, &createdAt)
		if err != nil {
			return nil, err
		}

		n.IsRead = isRead
		n.CreatedAt = createdAt
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
	query := `
		UPDATE notifications 
		SET is_read = true 
		WHERE id = $1 AND employee_id = $2
	`

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
	query := `UPDATE notifications SET is_read = true WHERE employee_id = $1`
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
