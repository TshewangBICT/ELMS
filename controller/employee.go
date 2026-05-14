package controller

import (
	"encoding/json"
	"fmt"
	"leaveapp/model"
	httpResp "leaveapp/utils"
	"net/http"
	"time"

	"github.com/gorilla/mux"
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
