package model

import (
	"database/sql"
	"fmt"
	"leaveapp/dataStore/postgres"
	"time"
)

type Employee struct {
	EmployeeID           string    `json:"employeeId"`
	FirstName            string    `json:"firstName"`
	LastName             string    `json:"lastName"`
	Email                string    `json:"email"`
	PasswordHash         string    `json:"passwordHash"`
	Phone                string    `json:"phone"`
	Position             string    `json:"position"`
	Department           string    `json:"department"`
	Role                 string    `json:"role"`
	Status               string    `json:"status"`
	RegistrationApproved bool      `json:"registrationApproved"`
	ProfilePic           string    `json:"profilePic"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

const queryInsertEmp = `INSERT INTO employees (
			employee_id, first_name, last_name, email, password_hash,
			phone, position, department, role, status,
			registration_approved, profile_pic, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

const queryGetEmp = `SELECT 
			employee_id, first_name, last_name, email, password_hash,
			phone, position, department, role, status,
			registration_approved, profile_pic, created_at, updated_at
		FROM employees 
		WHERE employee_id = $1`

const queryUpdateEmp = `UPDATE employees SET 
			first_name = $1,
			last_name = $2,
			email = $3,
			phone = $4,
			position = $5,
			department = $6,
			role = $7,
			status = $8,
			updated_at = $9
		WHERE employee_id = $10`

const queryGetAllEmp = `SELECT 
			employee_id, first_name, last_name, email,
			COALESCE(phone, '') as phone,
			COALESCE(position, '') as position,
			COALESCE(department, '') as department,
			COALESCE(role, 'user') as role,
			COALESCE(status, 'active') as status,
			registration_approved, 
			COALESCE(profile_pic, '') as profile_pic,
			created_at, updated_at
		FROM employees 
		ORDER BY created_at DESC`

// Create - Insert a new employee
func (e *Employee) Create() error {
	_, err := postgres.Db.Exec(
		queryInsertEmp,
		e.EmployeeID,
		e.FirstName,
		e.LastName,
		e.Email,
		e.PasswordHash,
		e.Phone,
		e.Position,
		e.Department,
		e.Role,
		e.Status,
		e.RegistrationApproved,
		e.ProfilePic,
		e.CreatedAt,
		e.UpdatedAt,
	)
	return err
}

// GetEmployeeByID - Get employee by employee_id
func GetEmployeeByID(employeeID string) (*Employee, error) {
	var emp Employee
	var phone sql.NullString
	var profilePic sql.NullString

	err := postgres.Db.QueryRow(queryGetEmp, employeeID).Scan(
		&emp.EmployeeID,
		&emp.FirstName,
		&emp.LastName,
		&emp.Email,
		&emp.PasswordHash,
		&phone,
		&emp.Position,
		&emp.Department,
		&emp.Role,
		&emp.Status,
		&emp.RegistrationApproved,
		&profilePic,
		&emp.CreatedAt,
		&emp.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("employee not found: %s", employeeID)
		}
		return nil, err
	}

	emp.Phone = phone.String
	emp.ProfilePic = profilePic.String

	return &emp, nil
}

// Update - Update an existing employee
func (e *Employee) Update() error {
	result, err := postgres.Db.Exec(
		queryUpdateEmp,
		e.FirstName,
		e.LastName,
		e.Email,
		e.Phone,
		e.Position,
		e.Department,
		e.Role,
		e.Status,
		time.Now(),
		e.EmployeeID,
	)

	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no employee found with ID: %s", e.EmployeeID)
	}

	return nil
}

// UpdateProfilePic - Update employee profile picture
func (e *Employee) UpdateProfilePic() error {
	query := `
        UPDATE employees 
        SET profile_pic = $1, updated_at = $2
        WHERE employee_id = $3
    `

	_, err := postgres.Db.Exec(query, e.ProfilePic, time.Now(), e.EmployeeID)
	return err
}

// UpdateStatus - Update only employee status
func (e *Employee) UpdateStatus() error {
	query := `
		UPDATE employees 
		SET status = $1, updated_at = $2
		WHERE employee_id = $3
	`

	_, err := postgres.Db.Exec(query, e.Status, time.Now(), e.EmployeeID)
	return err
}

// DeleteEmployee - Delete employee by employee_id
func DeleteEmployee(employeeID string) error {
	query := `DELETE FROM employees WHERE employee_id = $1`
	result, err := postgres.Db.Exec(query, employeeID)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no employee found with ID: %s", employeeID)
	}

	return nil
}

// GetAllEmployees - Get all employees
func GetAllEmployees() ([]Employee, error) {
	rows, err := postgres.Db.Query(queryGetAllEmp)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var emp Employee
		var phone, profilePic sql.NullString

		err := rows.Scan(
			&emp.EmployeeID,
			&emp.FirstName,
			&emp.LastName,
			&emp.Email,
			&phone,
			&emp.Position,
			&emp.Department,
			&emp.Role,
			&emp.Status,
			&emp.RegistrationApproved,
			&profilePic,
			&emp.CreatedAt,
			&emp.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		emp.Phone = phone.String
		emp.ProfilePic = profilePic.String
		employees = append(employees, emp)
	}

	return employees, nil
}

// GetFilteredEmployees - Get employees with filters
func GetFilteredEmployees(department, status, search string) ([]Employee, error) {
	query := `
		SELECT 
			employee_id, first_name, last_name, email,
			COALESCE(phone, '') as phone,
			position, department, role, status,
			registration_approved, 
			COALESCE(profile_pic, '') as profile_pic,
			created_at, updated_at
		FROM employees 
		WHERE 1=1
	`

	args := []interface{}{}
	counter := 1

	if department != "" {
		query += fmt.Sprintf(" AND department = $%d", counter)
		args = append(args, department)
		counter++
	}

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", counter)
		args = append(args, status)
		counter++
	}

	if search != "" {
		query += fmt.Sprintf(" AND (first_name ILIKE $%d OR last_name ILIKE $%d OR email ILIKE $%d OR employee_id ILIKE $%d)",
			counter, counter, counter, counter)
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
		counter += 4
	}

	query += " ORDER BY created_at DESC"

	rows, err := postgres.Db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var emp Employee
		var phone, profilePic sql.NullString

		err := rows.Scan(
			&emp.EmployeeID,
			&emp.FirstName,
			&emp.LastName,
			&emp.Email,
			&phone,
			&emp.Position,
			&emp.Department,
			&emp.Role,
			&emp.Status,
			&emp.RegistrationApproved,
			&profilePic,
			&emp.CreatedAt,
			&emp.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		emp.Phone = phone.String
		emp.ProfilePic = profilePic.String
		employees = append(employees, emp)
	}

	return employees, nil
}

// GetEmployeesByDepartment - Get employees by department
func GetEmployeesByDepartment(department string) ([]Employee, error) {
	return GetFilteredEmployees(department, "", "")
}

// GetActiveEmployees - Get only active employees
func GetActiveEmployees() ([]Employee, error) {
	return GetFilteredEmployees("", "active", "")
}

// GetEmployeeCount - Get total employee count
func GetEmployeeCount() (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM employees`
	err := postgres.Db.QueryRow(query).Scan(&count)
	return count, err
}

// FindByEmail - Find employee by email for login
func FindByEmail(email string) (*Employee, error) {
	var emp Employee
	var phone, profilePic sql.NullString

	query := `
		SELECT 
			employee_id, first_name, last_name, email, password_hash,
			COALESCE(phone, '') as phone,
			position, department, role, status,
			registration_approved, 
			COALESCE(profile_pic, '') as profile_pic,
			created_at, updated_at
		FROM employees 
		WHERE email = $1
	`

	err := postgres.Db.QueryRow(query, email).Scan(
		&emp.EmployeeID,
		&emp.FirstName,
		&emp.LastName,
		&emp.Email,
		&emp.PasswordHash,
		&phone,
		&emp.Position,
		&emp.Department,
		&emp.Role,
		&emp.Status,
		&emp.RegistrationApproved,
		&profilePic,
		&emp.CreatedAt,
		&emp.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("employee not found with email: %s", email)
		}
		return nil, err
	}

	emp.Phone = phone.String
	emp.ProfilePic = profilePic.String

	return &emp, nil
}

// ChangePassword - Update employee password
func (e *Employee) ChangePassword() error {
	query := `
		UPDATE employees 
		SET password_hash = $1, updated_at = $2
		WHERE employee_id = $3
	`

	_, err := postgres.Db.Exec(query, e.PasswordHash, time.Now(), e.EmployeeID)
	return err
}
