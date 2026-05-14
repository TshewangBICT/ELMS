package model

import (
	"database/sql"
	"fmt"
	"leaveapp/dataStore/postgres"
	"time"
)

type Department struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	IsProtected   bool      `json:"isProtected"`
	CreatedAt     time.Time `json:"createdAt"`
	EmployeeCount int       `json:"employeeCount,omitempty"`
}

// Create - Insert a new department
func (d *Department) Create() error {
	query := `
		INSERT INTO departments (name, is_protected, created_at)
		VALUES ($1, $2, $3)
		RETURNING id
	`

	err := postgres.Db.QueryRow(query, d.Name, d.IsProtected, time.Now()).Scan(&d.ID)
	return err
}

// GetDepartmentByID - Get department by ID
func GetDepartmentByID(id int) (*Department, error) {
	var dept Department
	var createdAt time.Time

	query := `
		SELECT id, name, is_protected, created_at
		FROM departments 
		WHERE id = $1
	`

	err := postgres.Db.QueryRow(query, id).Scan(
		&dept.ID,
		&dept.Name,
		&dept.IsProtected,
		&createdAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("department not found with ID: %d", id)
		}
		return nil, err
	}

	dept.CreatedAt = createdAt
	return &dept, nil
}

// GetDepartmentByName - Get department by name (for checking duplicates)
func GetDepartmentByName(name string) (*Department, error) {
	var dept Department
	var createdAt time.Time

	query := `
		SELECT id, name, is_protected, created_at
		FROM departments 
		WHERE name = $1
	`

	err := postgres.Db.QueryRow(query, name).Scan(
		&dept.ID,
		&dept.Name,
		&dept.IsProtected,
		&createdAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("department not found: %s", name)
		}
		return nil, err
	}

	dept.CreatedAt = createdAt
	return &dept, nil
}

// GetAllDepartments - Get all departments with employee count
func GetAllDepartments() ([]Department, error) {
	query := `
		SELECT 
			d.id,
			d.name, 
			d.is_protected, 
			d.created_at,
			COUNT(e.employee_id) as employee_count
		FROM departments d
		LEFT JOIN employees e ON e.department = d.name
		GROUP BY d.id, d.name, d.is_protected, d.created_at
		ORDER BY d.name ASC
	`

	rows, err := postgres.Db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []Department
	for rows.Next() {
		var dept Department
		var createdAt time.Time
		var employeeCount int

		err := rows.Scan(
			&dept.ID,
			&dept.Name,
			&dept.IsProtected,
			&createdAt,
			&employeeCount,
		)
		if err != nil {
			return nil, err
		}

		dept.CreatedAt = createdAt
		dept.EmployeeCount = employeeCount
		departments = append(departments, dept)
	}

	return departments, nil
}

// UpdateDepartment - Update department by ID
func UpdateDepartment(id int, newName string) error {
	// Check if new name already exists
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM departments WHERE name = $1 AND id != $2)`
	err := postgres.Db.QueryRow(checkQuery, newName, id).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("department '%s' already exists", newName)
	}

	// Get old department name first
	var oldName string
	nameQuery := `SELECT name FROM departments WHERE id = $1`
	err = postgres.Db.QueryRow(nameQuery, id).Scan(&oldName)
	if err != nil {
		return err
	}

	// Start transaction
	tx, err := postgres.Db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update department name
	updateQuery := `UPDATE departments SET name = $1 WHERE id = $2`
	_, err = tx.Exec(updateQuery, newName, id)
	if err != nil {
		return err
	}

	// Update all employees with this department
	updateEmployeesQuery := `UPDATE employees SET department = $1 WHERE department = $2`
	_, err = tx.Exec(updateEmployeesQuery, newName, oldName)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// DeleteDepartment - Delete department by ID
func DeleteDepartment(id int) error {
	// Get department info first
	var name string
	var isProtected bool
	infoQuery := `SELECT name, is_protected FROM departments WHERE id = $1`
	err := postgres.Db.QueryRow(infoQuery, id).Scan(&name, &isProtected)
	if err != nil {
		return err
	}

	if isProtected {
		return fmt.Errorf("cannot delete protected department: %s", name)
	}

	// Start transaction
	tx, err := postgres.Db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Ensure "Other" department exists
	var otherID int
	otherQuery := `SELECT id FROM departments WHERE name = 'Other'`
	err = tx.QueryRow(otherQuery).Scan(&otherID)
	if err != nil {
		// Create "Other" department if not exists
		err = tx.QueryRow(`INSERT INTO departments (name, is_protected) VALUES ('Other', false) RETURNING id`).Scan(&otherID)
		if err != nil {
			return err
		}
	}

	// Move employees to "Other" department
	updateEmployeesQuery := `UPDATE employees SET department = 'Other' WHERE department = $1`
	_, err = tx.Exec(updateEmployeesQuery, name)
	if err != nil {
		return err
	}

	// Delete the department
	deleteQuery := `DELETE FROM departments WHERE id = $1`
	_, err = tx.Exec(deleteQuery, id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetDepartmentEmployeeCount - Get number of employees in a department by name
func GetDepartmentEmployeeCount(name string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM employees WHERE department = $1`
	err := postgres.Db.QueryRow(query, name).Scan(&count)
	return count, err
}

// GetDepartmentNames - Get all department names (for dropdown)
func GetDepartmentNames() ([]map[string]interface{}, error) {
	query := `SELECT id, name FROM departments ORDER BY name ASC`
	rows, err := postgres.Db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		err := rows.Scan(&id, &name)
		if err != nil {
			return nil, err
		}
		departments = append(departments, map[string]interface{}{
			"id":   id,
			"name": name,
		})
	}

	return departments, nil
}
