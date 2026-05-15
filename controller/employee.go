package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"leaveapp/model"
	httpResp "leaveapp/utils"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/xuri/excelize/v2"
)

// AddEmployee - POST /employee/add
func AddEmployee(w http.ResponseWriter, r *http.Request) {
	var emp model.Employee

	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	// Set default values
	emp.Role = "user"
	emp.Status = "active"
	emp.CreatedAt = time.Now()
	emp.UpdatedAt = time.Now()
	emp.RegistrationApproved = true

	// Save to database
	if err := emp.Create(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Remove password from response
	emp.PasswordHash = ""

	httpResp.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Employee created successfully",
		"data":    emp,
	})
}

// BulkUploadEmployees - POST /employees/bulk-upload
func BulkUploadEmployees(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(20 << 20)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Unable to parse form data: "+err.Error())
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Excel file is required: "+err.Error())
		return
	}
	defer file.Close()

	buffer := bytes.NewBuffer(nil)
	if _, err := io.Copy(buffer, file); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Unable to read uploaded file: "+err.Error())
		return
	}

	excelFile, err := excelize.OpenReader(bytes.NewReader(buffer.Bytes()))
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid Excel file: "+err.Error())
		return
	}

	sheetName := excelFile.GetSheetName(0)
	if sheetName == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Excel workbook must contain at least one sheet")
		return
	}

	rows, err := excelFile.GetRows(sheetName)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Unable to read Excel rows: "+err.Error())
		return
	}

	if len(rows) < 2 {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Excel file must contain header row and at least one employee row")
		return
	}

	headers := rows[0]
	columnIndex := map[string]int{}
	for index, column := range headers {
		columnIndex[strings.ToLower(strings.TrimSpace(column))] = index
	}

	requiredColumns := []string{"employeeid", "firstname", "lastname", "email", "position", "department"}
	for _, col := range requiredColumns {
		if _, ok := columnIndex[col]; !ok {
			httpResp.RespondWithError(w, http.StatusBadRequest, "Missing required column: "+col)
			return
		}
	}

	defaultPassword := r.FormValue("defaultPassword")
	if defaultPassword == "" {
		defaultPassword = "Welcome123"
	}

	var created []model.Employee
	var errors []map[string]string
	for rowIndex, row := range rows[1:] {
		if len(row) == 0 {
			continue
		}

		getCell := func(column string) string {
			idx, ok := columnIndex[column]
			if !ok || idx >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[idx])
		}

		empID := getCell("employeeid")
		firstName := getCell("firstname")
		lastName := getCell("lastname")
		email := getCell("email")
		phone := getCell("phone")
		position := getCell("position")
		department := getCell("department")
		password := getCell("password")
		if password == "" {
			password = defaultPassword
		}

		if empID == "" || firstName == "" || lastName == "" || email == "" || position == "" || department == "" {
			errors = append(errors, map[string]string{
				"row":   fmt.Sprintf("%d", rowIndex+2),
				"error": "Missing required employee fields",
			})
			continue
		}

		if _, err := model.GetEmployeeByID(empID); err == nil {
			errors = append(errors, map[string]string{
				"row":   fmt.Sprintf("%d", rowIndex+2),
				"error": "Employee ID already exists",
			})
			continue
		}

		if existing, err := model.FindByEmail(email); err == nil && existing != nil {
			errors = append(errors, map[string]string{
				"row":   fmt.Sprintf("%d", rowIndex+2),
				"error": "Email already exists",
			})
			continue
		}

		emp := model.Employee{
			EmployeeID:           empID,
			FirstName:            firstName,
			LastName:             lastName,
			Email:                email,
			PasswordHash:         password,
			Phone:                phone,
			Position:             position,
			Department:           department,
			Role:                 "user",
			Status:               "active",
			RegistrationApproved: true,
			CreatedAt:            time.Now(),
			UpdatedAt:            time.Now(),
		}

		if err := emp.Create(); err != nil {
			errors = append(errors, map[string]string{
				"row":   fmt.Sprintf("%d", rowIndex+2),
				"error": err.Error(),
			})
			continue
		}

		created = append(created, emp)
		// FIXED: Removed the extra empty string argument
		model.CreateNotification(emp.EmployeeID, "Welcome to ELMS! Your account has been created.", "info")
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"message":      fmt.Sprintf("%d employees created, %d rows had errors", len(created), len(errors)),
		"createdCount": len(created),
		"created":      created,
		"errors":       errors,
	})
}

// GetEmployee - GET /employee/{eid}
func GetEmployee(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	employeeID := vars["eid"]

	if employeeID == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Employee ID is required")
		return
	}

	emp, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	emp.PasswordHash = ""
	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    emp,
	})
}

// UpdateEmployee - PUT /employee/{eid}
func UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	employeeID := vars["eid"]

	if employeeID == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Employee ID is required")
		return
	}

	// Get current logged in user from session
	session, _ := store.Get(r, "elms-session")
	loggedInEmployeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Not logged in")
		return
	}

	loggedInRole, _ := session.Values["role"].(string)

	// Check if user is admin OR updating their own profile
	isAdmin := loggedInRole == "admin"
	isSelf := loggedInEmployeeID == employeeID

	if !isAdmin && !isSelf {
		httpResp.RespondWithError(w, http.StatusForbidden, "You can only update your own profile")
		return
	}

	// First check if employee exists
	existingEmp, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, fmt.Sprintf("Employee not found: %s", employeeID))
		return
	}

	var emp model.Employee

	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	// Preserve fields that shouldn't be changed
	emp.EmployeeID = existingEmp.EmployeeID
	emp.PasswordHash = existingEmp.PasswordHash
	emp.CreatedAt = existingEmp.CreatedAt
	emp.RegistrationApproved = existingEmp.RegistrationApproved
	emp.ProfilePic = existingEmp.ProfilePic

	// If NOT admin, prevent role change
	if !isAdmin && emp.Role != "" && emp.Role != existingEmp.Role {
		httpResp.RespondWithError(w, http.StatusForbidden, "You cannot change your own role")
		return
	}

	// If NOT admin, prevent status change
	if !isAdmin && emp.Status != "" && emp.Status != existingEmp.Status {
		httpResp.RespondWithError(w, http.StatusForbidden, "You cannot change your own status")
		return
	}

	// Only update fields that are provided (non-empty)
	if emp.FirstName == "" {
		emp.FirstName = existingEmp.FirstName
	}
	if emp.LastName == "" {
		emp.LastName = existingEmp.LastName
	}
	if emp.Email == "" {
		emp.Email = existingEmp.Email
	}
	if emp.Phone == "" {
		emp.Phone = existingEmp.Phone
	}
	if emp.Position == "" {
		emp.Position = existingEmp.Position
	}
	if emp.Department == "" {
		emp.Department = existingEmp.Department
	}
	if emp.Role == "" {
		emp.Role = existingEmp.Role
	}
	if emp.Status == "" {
		emp.Status = existingEmp.Status
	}

	// Update in database
	if err := emp.Update(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	// Remove sensitive data from response
	emp.PasswordHash = ""

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Profile updated successfully",
		"data":    emp,
	})
}

// UpdateProfilePic - PUT /employee/{eid}/profile-pic
func UpdateProfilePic(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	employeeID := vars["eid"]

	if employeeID == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Employee ID is required")
		return
	}

	var req struct {
		ProfilePic string `json:"profilePic"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	// Check if employee exists
	existingEmp, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Employee not found")
		return
	}

	// Update profile picture
	existingEmp.ProfilePic = req.ProfilePic
	if err := existingEmp.UpdateProfilePic(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error updating profile picture: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Profile picture updated successfully",
		"data": map[string]string{
			"profilePic": req.ProfilePic,
		},
	})
}

// UpdateEmployeeStatus - PUT /employee/{eid}/status
func UpdateEmployeeStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	employeeID := vars["eid"]

	if employeeID == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Employee ID is required")
		return
	}

	var req struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	if req.Status != "active" && req.Status != "inactive" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Status must be 'active' or 'inactive'")
		return
	}

	// Check if employee exists
	existingEmp, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Employee not found")
		return
	}

	// Update status
	existingEmp.Status = req.Status
	if err := existingEmp.UpdateStatus(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Employee status updated successfully",
		"data": map[string]interface{}{
			"employeeId": employeeID,
			"status":     req.Status,
		},
	})
}

// DeleteEmployee - DELETE /employee/{eid}
func DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	employeeID := vars["eid"]

	if employeeID == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Employee ID is required")
		return
	}

	// Check if employee exists
	_, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Employee not found")
		return
	}

	// Delete employee
	if err := model.DeleteEmployee(employeeID); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Employee deleted successfully",
	})
}

// GetAllEmployees - GET /employees/all
func GetAllEmployees(w http.ResponseWriter, r *http.Request) {
	employees, err := model.GetAllEmployees()
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching employees: "+err.Error())
		return
	}

	// Remove sensitive data
	for i := range employees {
		employees[i].PasswordHash = ""
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(employees),
		"data":    employees,
	})
}

// GetFilteredEmployees - GET /employees/filter
func GetFilteredEmployees(w http.ResponseWriter, r *http.Request) {
	department := r.URL.Query().Get("department")
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")

	employees, err := model.GetFilteredEmployees(department, status, search)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching employees: "+err.Error())
		return
	}

	// Remove sensitive data
	for i := range employees {
		employees[i].PasswordHash = ""
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(employees),
		"filters": map[string]string{
			"department": department,
			"status":     status,
			"search":     search,
		},
		"data": employees,
	})
}
