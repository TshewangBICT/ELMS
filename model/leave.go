package model

import (
	"database/sql"
	"fmt"
	"leaveapp/dataStore/postgres"
	"time"
)

type LeaveRequest struct {
	ID           int       `json:"id"`
	EmployeeID   string    `json:"employeeId"`
	LeaveType    string    `json:"leaveType"`
	DurationType string    `json:"durationType"` // "full" or "half"
	FromDate     string    `json:"fromDate"`
	ToDate       string    `json:"toDate"`
	Days         float64   `json:"days"`
	Reason       string    `json:"reason"`
	Status       string    `json:"status"` // "pending", "approved", "cancelled"
	ApprovedBy   string    `json:"approvedBy,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	// Joined fields for response
	EmployeeName string `json:"employeeName,omitempty"`
	Department   string `json:"department,omitempty"`
}

// LeaveBalance structure
type LeaveBalance struct {
	EmployeeID                  string  `json:"employeeId"`
	CasualLeave                 int     `json:"casualLeave"`
	CasualLeaveUsed             float64 `json:"casualLeaveUsed"`
	CasualLeaveRemaining        float64 `json:"casualLeaveRemaining"`
	EarnedLeave                 int     `json:"earnedLeave"`
	EarnedLeaveUsed             float64 `json:"earnedLeaveUsed"`
	EarnedLeaveRemaining        float64 `json:"earnedLeaveRemaining"`
	MaternityLeave              int     `json:"maternityLeave"`
	MaternityLeaveUsed          float64 `json:"maternityLeaveUsed"`
	MaternityLeaveRemaining     float64 `json:"maternityLeaveRemaining"`
	PaternityLeave              int     `json:"paternityLeave"`
	PaternityLeaveUsed          float64 `json:"paternityLeaveUsed"`
	PaternityLeaveRemaining     float64 `json:"paternityLeaveRemaining"`
	StudyLeave                  int     `json:"studyLeave"`
	StudyLeaveUsed              float64 `json:"studyLeaveUsed"`
	StudyLeaveRemaining         float64 `json:"studyLeaveRemaining"`
	ExtraOrdinaryLeave          int     `json:"extraOrdinaryLeave"`
	ExtraOrdinaryLeaveUsed      float64 `json:"extraOrdinaryLeaveUsed"`
	ExtraOrdinaryLeaveRemaining float64 `json:"extraOrdinaryLeaveRemaining"`
	BereavementLeave            int     `json:"bereavementLeave"`
	BereavementLeaveUsed        float64 `json:"bereavementLeaveUsed"`
	BereavementLeaveRemaining   float64 `json:"bereavementLeaveRemaining"`
}

// ApplyLeave - Create a new leave request
func (l *LeaveRequest) Apply() error {
	query := `
		INSERT INTO leave_requests (
			employee_id, leave_type, duration_type, from_date, to_date, 
			days, reason, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8, $9, $10)
		RETURNING id
	`

	err := postgres.Db.QueryRow(
		query,
		l.EmployeeID,
		l.LeaveType,
		l.DurationType,
		l.FromDate,
		l.ToDate,
		l.Days,
		l.Reason,
		"pending",
		time.Now(),
		time.Now(),
	).Scan(&l.ID)

	return err
}

// GetLeaveByID - Get leave request by ID
func GetLeaveByID(id int) (*LeaveRequest, error) {
	var leave LeaveRequest
	var approvedBy sql.NullString

	query := `
		SELECT 
			id, employee_id, leave_type, duration_type, 
			from_date, to_date, days, reason, status, 
			COALESCE(approved_by, ''), created_at, updated_at
		FROM leave_requests 
		WHERE id = $1
	`

	err := postgres.Db.QueryRow(query, id).Scan(
		&leave.ID,
		&leave.EmployeeID,
		&leave.LeaveType,
		&leave.DurationType,
		&leave.FromDate,
		&leave.ToDate,
		&leave.Days,
		&leave.Reason,
		&leave.Status,
		&approvedBy,
		&leave.CreatedAt,
		&leave.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("leave request not found with ID: %d", id)
		}
		return nil, err
	}

	leave.ApprovedBy = approvedBy.String
	return &leave, nil
}

// CheckLeaveOverlapExcludingCurrent - Check for overlapping leave excluding current leave ID
func CheckLeaveOverlapExcludingCurrent(employeeID, fromDate, toDate string, excludeID int) (bool, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM leave_requests
		WHERE employee_id = $1 
			AND id != $2
			AND status != 'cancelled'
			AND (
				(from_date <= $3 AND to_date >= $3) OR
				(from_date <= $4 AND to_date >= $4) OR
				(from_date >= $3 AND to_date <= $4)
			)
	`

	err := postgres.Db.QueryRow(query, employeeID, excludeID, fromDate, toDate).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdateLeaveRequest - Update an existing leave request (only for pending status)
func UpdateLeaveRequest(id int, leaveType, durationType, fromDate, toDate string, days float64, reason string) error {
	query := `
		UPDATE leave_requests 
		SET leave_type = $1, 
			duration_type = $2, 
			from_date = $3::date, 
			to_date = $4::date, 
			days = $5, 
			reason = $6,
			updated_at = $7
		WHERE id = $8 AND status = 'pending'
	`

	result, err := postgres.Db.Exec(query, leaveType, durationType, fromDate, toDate, days, reason, time.Now(), id)
	if err != nil {
		return fmt.Errorf("database error: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("leave request not found or not pending (only pending requests can be edited)")
	}

	return nil
}

// GetLeaveBalanceWithDetails - Get leave balance with used and remaining details (if you need more detailed balance)
func GetLeaveBalanceWithDetails(employeeID string) (map[string]interface{}, error) {
	var balance struct {
		EmployeeID             string
		CasualLeave            int
		CasualLeaveUsed        float64
		EarnedLeave            int
		EarnedLeaveUsed        float64
		MaternityLeave         int
		MaternityLeaveUsed     float64
		PaternityLeave         int
		PaternityLeaveUsed     float64
		StudyLeave             int
		StudyLeaveUsed         float64
		ExtraOrdinaryLeave     int
		ExtraOrdinaryLeaveUsed float64
		BereavementLeave       int
		BereavementLeaveUsed   float64
	}

	query := `
		SELECT 
			employee_id,
			casual_leave, casual_leave_used,
			earned_leave, earned_leave_used,
			maternity_leave, maternity_leave_used,
			paternity_leave, paternity_leave_used,
			study_leave, study_leave_used,
			extra_ordinary_leave, extra_ordinary_leave_used,
			bereavement_leave, bereavement_leave_used
		FROM leave_balances 
		WHERE employee_id = $1
	`

	err := postgres.Db.QueryRow(query, employeeID).Scan(
		&balance.EmployeeID,
		&balance.CasualLeave, &balance.CasualLeaveUsed,
		&balance.EarnedLeave, &balance.EarnedLeaveUsed,
		&balance.MaternityLeave, &balance.MaternityLeaveUsed,
		&balance.PaternityLeave, &balance.PaternityLeaveUsed,
		&balance.StudyLeave, &balance.StudyLeaveUsed,
		&balance.ExtraOrdinaryLeave, &balance.ExtraOrdinaryLeaveUsed,
		&balance.BereavementLeave, &balance.BereavementLeaveUsed,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Create default balance if not exists
			insertQuery := `
				INSERT INTO leave_balances (employee_id)
				VALUES ($1)
				RETURNING 
					employee_id,
					casual_leave, casual_leave_used,
					earned_leave, earned_leave_used,
					maternity_leave, maternity_leave_used,
					paternity_leave, paternity_leave_used,
					study_leave, study_leave_used,
					extra_ordinary_leave, extra_ordinary_leave_used,
					bereavement_leave, bereavement_leave_used
			`
			err = postgres.Db.QueryRow(insertQuery, employeeID).Scan(
				&balance.EmployeeID,
				&balance.CasualLeave, &balance.CasualLeaveUsed,
				&balance.EarnedLeave, &balance.EarnedLeaveUsed,
				&balance.MaternityLeave, &balance.MaternityLeaveUsed,
				&balance.PaternityLeave, &balance.PaternityLeaveUsed,
				&balance.StudyLeave, &balance.StudyLeaveUsed,
				&balance.ExtraOrdinaryLeave, &balance.ExtraOrdinaryLeaveUsed,
				&balance.BereavementLeave, &balance.BereavementLeaveUsed,
			)
			if err != nil {
				return nil, fmt.Errorf("error creating leave balance: %w", err)
			}
		} else {
			return nil, fmt.Errorf("error fetching leave balance: %w", err)
		}
	}

	// Calculate remaining balances
	result := map[string]interface{}{
		"employeeId":                  balance.EmployeeID,
		"casualLeave":                 balance.CasualLeave,
		"casualLeaveUsed":             balance.CasualLeaveUsed,
		"casualLeaveRemaining":        float64(balance.CasualLeave) - balance.CasualLeaveUsed,
		"earnedLeave":                 balance.EarnedLeave,
		"earnedLeaveUsed":             balance.EarnedLeaveUsed,
		"earnedLeaveRemaining":        float64(balance.EarnedLeave) - balance.EarnedLeaveUsed,
		"maternityLeave":              balance.MaternityLeave,
		"maternityLeaveUsed":          balance.MaternityLeaveUsed,
		"maternityLeaveRemaining":     float64(balance.MaternityLeave) - balance.MaternityLeaveUsed,
		"paternityLeave":              balance.PaternityLeave,
		"paternityLeaveUsed":          balance.PaternityLeaveUsed,
		"paternityLeaveRemaining":     float64(balance.PaternityLeave) - balance.PaternityLeaveUsed,
		"studyLeave":                  balance.StudyLeave,
		"studyLeaveUsed":              balance.StudyLeaveUsed,
		"studyLeaveRemaining":         float64(balance.StudyLeave) - balance.StudyLeaveUsed,
		"extraOrdinaryLeave":          balance.ExtraOrdinaryLeave,
		"extraOrdinaryLeaveUsed":      balance.ExtraOrdinaryLeaveUsed,
		"extraOrdinaryLeaveRemaining": float64(balance.ExtraOrdinaryLeave) - balance.ExtraOrdinaryLeaveUsed,
		"bereavementLeave":            balance.BereavementLeave,
		"bereavementLeaveUsed":        balance.BereavementLeaveUsed,
		"bereavementLeaveRemaining":   float64(balance.BereavementLeave) - balance.BereavementLeaveUsed,
	}

	return result, nil
}

// GetUserPendingLeaveCount - Get count of pending leaves for a user
func GetUserPendingLeaveCount(employeeID string) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM leave_requests
		WHERE employee_id = $1 AND status = 'pending'
	`
	err := postgres.Db.QueryRow(query, employeeID).Scan(&count)
	return count, err
}

// GetLeaveRequestsByDateRange - Get leave requests within a date range (for reporting)
func GetLeaveRequestsByDateRange(startDate, endDate, status string) ([]LeaveRequest, error) {
	query := `
		SELECT 
			l.id, l.employee_id, l.leave_type, l.duration_type, 
			l.from_date, l.to_date, l.days, l.reason, l.status, 
			COALESCE(l.approved_by, ''), l.created_at, l.updated_at,
			e.first_name, e.last_name, e.department
		FROM leave_requests l
		JOIN employees e ON l.employee_id = e.employee_id
		WHERE l.from_date >= $1 AND l.to_date <= $2
	`
	args := []interface{}{startDate, endDate}

	if status != "" && status != "all" {
		query += " AND l.status = $3"
		args = append(args, status)
	}

	query += " ORDER BY l.from_date ASC"

	rows, err := postgres.Db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leaves []LeaveRequest
	for rows.Next() {
		var leave LeaveRequest
		var approvedBy sql.NullString
		var firstName, lastName, department string

		err := rows.Scan(
			&leave.ID,
			&leave.EmployeeID,
			&leave.LeaveType,
			&leave.DurationType,
			&leave.FromDate,
			&leave.ToDate,
			&leave.Days,
			&leave.Reason,
			&leave.Status,
			&approvedBy,
			&leave.CreatedAt,
			&leave.UpdatedAt,
			&firstName,
			&lastName,
			&department,
		)
		if err != nil {
			return nil, err
		}

		leave.ApprovedBy = approvedBy.String
		leave.EmployeeName = firstName + " " + lastName
		leave.Department = department
		leaves = append(leaves, leave)
	}

	return leaves, nil
}

// GetMyLeaves - Get all leave requests for a specific employee
func GetMyLeaves(employeeID string) ([]LeaveRequest, error) {
	query := `
		SELECT 
			id, employee_id, leave_type, duration_type, 
			from_date, to_date, days, reason, status, 
			COALESCE(approved_by, ''), created_at, updated_at
		FROM leave_requests 
		WHERE employee_id = $1
		ORDER BY created_at DESC
	`

	rows, err := postgres.Db.Query(query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leaves []LeaveRequest
	for rows.Next() {
		var leave LeaveRequest
		var approvedBy sql.NullString

		err := rows.Scan(
			&leave.ID,
			&leave.EmployeeID,
			&leave.LeaveType,
			&leave.DurationType,
			&leave.FromDate,
			&leave.ToDate,
			&leave.Days,
			&leave.Reason,
			&leave.Status,
			&approvedBy,
			&leave.CreatedAt,
			&leave.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		leave.ApprovedBy = approvedBy.String
		leaves = append(leaves, leave)
	}

	return leaves, nil
}

// GetAllLeaveRequests - Get all leave requests (admin)
func GetAllLeaveRequests(status string) ([]LeaveRequest, error) {
	query := `
		SELECT 
			l.id, l.employee_id, l.leave_type, l.duration_type, 
			l.from_date, l.to_date, l.days, l.reason, l.status, 
			COALESCE(l.approved_by, ''), l.created_at, l.updated_at,
			e.first_name, e.last_name, e.department
		FROM leave_requests l
		JOIN employees e ON l.employee_id = e.employee_id
	`

	if status != "" && status != "all" {
		query += " WHERE l.status = '" + status + "'"
	}

	query += " ORDER BY l.created_at DESC"

	rows, err := postgres.Db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leaves []LeaveRequest
	for rows.Next() {
		var leave LeaveRequest
		var approvedBy sql.NullString
		var firstName, lastName, department string

		err := rows.Scan(
			&leave.ID,
			&leave.EmployeeID,
			&leave.LeaveType,
			&leave.DurationType,
			&leave.FromDate,
			&leave.ToDate,
			&leave.Days,
			&leave.Reason,
			&leave.Status,
			&approvedBy,
			&leave.CreatedAt,
			&leave.UpdatedAt,
			&firstName,
			&lastName,
			&department,
		)
		if err != nil {
			return nil, err
		}

		leave.ApprovedBy = approvedBy.String
		leave.EmployeeName = firstName + " " + lastName
		leave.Department = department
		leaves = append(leaves, leave)
	}

	return leaves, nil
}

// GetPendingLeaveRequests - Get all pending leave requests (admin)
func GetPendingLeaveRequests() ([]LeaveRequest, error) {
	return GetAllLeaveRequests("pending")
}

// ApproveLeave - Approve or reject leave request with notification
func ApproveLeave(leaveID int, approvedBy string, status string) error {
	// Start transaction
	tx, err := postgres.Db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get leave details first
	var employeeID string
	var leaveType string
	var days float64
	var fromDate, toDate string

	getQuery := `SELECT employee_id, leave_type, days, from_date, to_date FROM leave_requests WHERE id = $1`
	err = tx.QueryRow(getQuery, leaveID).Scan(&employeeID, &leaveType, &days, &fromDate, &toDate)
	if err != nil {
		return err
	}

	// Update leave request status
	updateQuery := `
		UPDATE leave_requests 
		SET status = $1, approved_by = $2, updated_at = $3
		WHERE id = $4
	`
	_, err = tx.Exec(updateQuery, status, approvedBy, time.Now(), leaveID)
	if err != nil {
		return err
	}

	// If approved, update leave balance
	if status == "approved" {
		// Map leave type to database column
		columnMap := map[string]string{
			"Casual Leave":         "casual_leave_used",
			"Earned Leave":         "earned_leave_used",
			"Maternity Leave":      "maternity_leave_used",
			"Paternity Leave":      "paternity_leave_used",
			"Study Leave":          "study_leave_used",
			"Extra Ordinary Leave": "extra_ordinary_leave_used",
			"Bereavement Leave":    "bereavement_leave_used",
		}

		column, exists := columnMap[leaveType]
		if exists {
			// Direct float64 update since columns are now DECIMAL
			balanceQuery := fmt.Sprintf(`
				UPDATE leave_balances 
				SET %s = %s + $1
				WHERE employee_id = $2
			`, column, column)

			_, err = tx.Exec(balanceQuery, days, employeeID)
			if err != nil {
				return fmt.Errorf("error updating leave balance: %w", err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	// Create notification for employee after transaction is complete
	if status == "approved" {
		message := fmt.Sprintf("Your %s leave request for %.1f day(s) (from %s to %s) has been APPROVED.",
			leaveType, days, fromDate, toDate)
		CreateNotification(employeeID, message, "ok")
	} else {
		message := fmt.Sprintf("Your %s leave request for %.1f day(s) (from %s to %s) has been REJECTED.",
			leaveType, days, fromDate, toDate)
		CreateNotification(employeeID, message, "err")
	}

	return nil
}

// CancelLeave - Cancel a pending leave request with notification
func CancelLeave(leaveID int, employeeID string) error {
	// Get leave details first
	var leaveType string
	var days float64
	var fromDate, toDate string
	var status string

	getQuery := `SELECT leave_type, days, from_date, to_date, status FROM leave_requests WHERE id = $1 AND employee_id = $2`
	err := postgres.Db.QueryRow(getQuery, leaveID, employeeID).Scan(&leaveType, &days, &fromDate, &toDate, &status)
	if err != nil {
		return err
	}

	if status != "pending" {
		return fmt.Errorf("only pending leave requests can be cancelled")
	}

	// Update status to cancelled
	updateQuery := `
		UPDATE leave_requests 
		SET status = 'cancelled', updated_at = $1
		WHERE id = $2
	`
	_, err = postgres.Db.Exec(updateQuery, time.Now(), leaveID)
	if err != nil {
		return err
	}

	// Create notification
	message := fmt.Sprintf("Your %s leave request for %.1f day(s) (from %s to %s) has been CANCELLED.",
		leaveType, days, fromDate, toDate)
	CreateNotification(employeeID, message, "info")

	return nil
}

// GetLeaveBalance - Get leave balance for an employee
func GetLeaveBalance(employeeID string) (*LeaveBalance, error) {
	var balance LeaveBalance

	query := `
		SELECT 
			employee_id,
			casual_leave, casual_leave_used,
			earned_leave, earned_leave_used,
			maternity_leave, maternity_leave_used,
			paternity_leave, paternity_leave_used,
			study_leave, study_leave_used,
			extra_ordinary_leave, extra_ordinary_leave_used,
			bereavement_leave, bereavement_leave_used
		FROM leave_balances 
		WHERE employee_id = $1
	`

	err := postgres.Db.QueryRow(query, employeeID).Scan(
		&balance.EmployeeID,
		&balance.CasualLeave, &balance.CasualLeaveUsed,
		&balance.EarnedLeave, &balance.EarnedLeaveUsed,
		&balance.MaternityLeave, &balance.MaternityLeaveUsed,
		&balance.PaternityLeave, &balance.PaternityLeaveUsed,
		&balance.StudyLeave, &balance.StudyLeaveUsed,
		&balance.ExtraOrdinaryLeave, &balance.ExtraOrdinaryLeaveUsed,
		&balance.BereavementLeave, &balance.BereavementLeaveUsed,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Create default balance if not exists
			insertQuery := `
				INSERT INTO leave_balances (employee_id)
				VALUES ($1)
				RETURNING 
					employee_id,
					casual_leave, casual_leave_used,
					earned_leave, earned_leave_used,
					maternity_leave, maternity_leave_used,
					paternity_leave, paternity_leave_used,
					study_leave, study_leave_used,
					extra_ordinary_leave, extra_ordinary_leave_used,
					bereavement_leave, bereavement_leave_used
			`
			err = postgres.Db.QueryRow(insertQuery, employeeID).Scan(
				&balance.EmployeeID,
				&balance.CasualLeave, &balance.CasualLeaveUsed,
				&balance.EarnedLeave, &balance.EarnedLeaveUsed,
				&balance.MaternityLeave, &balance.MaternityLeaveUsed,
				&balance.PaternityLeave, &balance.PaternityLeaveUsed,
				&balance.StudyLeave, &balance.StudyLeaveUsed,
				&balance.ExtraOrdinaryLeave, &balance.ExtraOrdinaryLeaveUsed,
				&balance.BereavementLeave, &balance.BereavementLeaveUsed,
			)
			if err != nil {
				return nil, fmt.Errorf("error creating leave balance: %w", err)
			}
		} else {
			return nil, fmt.Errorf("error fetching leave balance: %w", err)
		}
	}

	// Calculate remaining balances (using float64)
	balance.CasualLeaveRemaining = float64(balance.CasualLeave) - balance.CasualLeaveUsed
	balance.EarnedLeaveRemaining = float64(balance.EarnedLeave) - balance.EarnedLeaveUsed
	balance.MaternityLeaveRemaining = float64(balance.MaternityLeave) - balance.MaternityLeaveUsed
	balance.PaternityLeaveRemaining = float64(balance.PaternityLeave) - balance.PaternityLeaveUsed
	balance.StudyLeaveRemaining = float64(balance.StudyLeave) - balance.StudyLeaveUsed
	balance.ExtraOrdinaryLeaveRemaining = float64(balance.ExtraOrdinaryLeave) - balance.ExtraOrdinaryLeaveUsed
	balance.BereavementLeaveRemaining = float64(balance.BereavementLeave) - balance.BereavementLeaveUsed

	return &balance, nil
}

// GetEmployeesOnLeaveToday - Get all employees on leave today
func GetEmployeesOnLeaveToday() ([]LeaveRequest, error) {
	today := time.Now().Format("2006-01-02")

	query := `
		SELECT 
			l.id, l.employee_id, l.leave_type, l.duration_type, 
			l.from_date, l.to_date, l.days, l.reason, l.status, 
			COALESCE(l.approved_by, ''), l.created_at, l.updated_at,
			e.first_name, e.last_name, e.department
		FROM leave_requests l
		JOIN employees e ON l.employee_id = e.employee_id
		WHERE l.status = 'approved' 
			AND l.from_date <= $1 
			AND l.to_date >= $1
		ORDER BY e.department, e.first_name
	`

	rows, err := postgres.Db.Query(query, today)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leaves []LeaveRequest
	for rows.Next() {
		var leave LeaveRequest
		var approvedBy sql.NullString
		var firstName, lastName, department string

		err := rows.Scan(
			&leave.ID,
			&leave.EmployeeID,
			&leave.LeaveType,
			&leave.DurationType,
			&leave.FromDate,
			&leave.ToDate,
			&leave.Days,
			&leave.Reason,
			&leave.Status,
			&approvedBy,
			&leave.CreatedAt,
			&leave.UpdatedAt,
			&firstName,
			&lastName,
			&department,
		)
		if err != nil {
			return nil, err
		}

		leave.ApprovedBy = approvedBy.String
		leave.EmployeeName = firstName + " " + lastName
		leave.Department = department
		leaves = append(leaves, leave)
	}

	return leaves, nil
}

// CheckLeaveOverlap - Check if employee has overlapping leave
func CheckLeaveOverlap(employeeID, fromDate, toDate string) (bool, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM leave_requests
		WHERE employee_id = $1 
			AND status != 'cancelled'
			AND (
				(from_date <= $2 AND to_date >= $2) OR
				(from_date <= $3 AND to_date >= $3) OR
				(from_date >= $2 AND to_date <= $3)
			)
	`

	err := postgres.Db.QueryRow(query, employeeID, fromDate, toDate).Scan(&count)
	return count > 0, err
}
