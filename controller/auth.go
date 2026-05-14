package controller

import (
	"encoding/json"
	"net/http"
	"time"

	"leaveapp/model"
	httpResp "leaveapp/utils"

	"github.com/gorilla/sessions"
)

// Session store - one time initialization
var store = sessions.NewCookieStore([]byte("secret-key"))

// Request/Response structures
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	EmployeeID string `json:"employeeId"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	Phone      string `json:"phone"`
	Position   string `json:"position"`
	Department string `json:"department"`
}

// Login - POST /auth/login
func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	r.Body.Close()

	// Validate required fields
	if req.Email == "" || req.Password == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	// Find employee by email
	employee, err := model.FindByEmail(req.Email)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Check if employee is active
	if employee.Status != "active" {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Account is deactivated. Please contact admin.")
		return
	}

	// Check if registration is approved
	if !employee.RegistrationApproved {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Account pending admin approval")
		return
	}

	// Verify password (plain text comparison - no bcrypt)
	if req.Password != employee.PasswordHash {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Create session
	session, _ := store.Get(r, "elms-session")
	session.Values["employeeID"] = employee.EmployeeID
	session.Values["email"] = employee.Email
	session.Values["role"] = employee.Role
	session.Values["firstName"] = employee.FirstName
	session.Values["lastName"] = employee.LastName
	session.Values["authenticated"] = true
	session.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
	}
	session.Save(r, w)

	// Prepare response (no date fields)
	response := map[string]interface{}{
		"employeeId": employee.EmployeeID,
		"firstName":  employee.FirstName,
		"lastName":   employee.LastName,
		"email":      employee.Email,
		"role":       employee.Role,
		"department": employee.Department,
		"position":   employee.Position,
		"phone":      employee.Phone,
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Login successful",
		"data":    response,
	})
}

// Register - POST /auth/register
func Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	r.Body.Close()

	// Validate required fields
	if req.EmployeeID == "" || req.FirstName == "" || req.LastName == "" ||
		req.Email == "" || req.Password == "" || req.Position == "" || req.Department == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	// Check if employee already exists by email
	existingEmp, _ := model.FindByEmail(req.Email)
	if existingEmp != nil {
		httpResp.RespondWithError(w, http.StatusConflict, "Email already registered")
		return
	}

	// Check if employee ID exists
	_, err := model.GetEmployeeByID(req.EmployeeID)
	if err == nil {
		httpResp.RespondWithError(w, http.StatusConflict, "Employee ID already exists")
		return
	}

	// Create new employee (no date fields)
	employee := &model.Employee{
		EmployeeID:           req.EmployeeID,
		FirstName:            req.FirstName,
		LastName:             req.LastName,
		Email:                req.Email,
		PasswordHash:         req.Password,
		Phone:                req.Phone,
		Position:             req.Position,
		Department:           req.Department,
		Role:                 "user",
		Status:               "active",
		RegistrationApproved: true,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	// Save to database
	if err := employee.Create(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error creating employee: "+err.Error())
		return
	}

	// DO NOT CREATE SESSION - User must login manually

	// Prepare response (no date fields)
	response := map[string]interface{}{
		"employeeId": employee.EmployeeID,
		"firstName":  employee.FirstName,
		"lastName":   employee.LastName,
		"email":      employee.Email,
		"role":       employee.Role,
		"department": employee.Department,
		"position":   employee.Position,
		"phone":      employee.Phone,
	}

	httpResp.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Registration successful! Please login to continue.",
		"data":    response,
	})
}

// Logout - POST /auth/logout
func Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "elms-session")

	// Clear session
	session.Values["authenticated"] = false
	session.Values["employeeID"] = ""
	session.Values["email"] = ""
	session.Values["role"] = ""
	session.Values["firstName"] = ""
	session.Values["lastName"] = ""
	session.Options.MaxAge = -1 // Delete cookie
	session.Save(r, w)

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Logged out successfully",
	})
}

// GetProfile - GET /auth/profile
func GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get session
	session, _ := store.Get(r, "elms-session")

	// Check if user is authenticated
	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	// Get employee
	employee, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Remove sensitive data
	employee.PasswordHash = ""

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    employee,
	})
}

// ChangePassword - POST /auth/change-password
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	r.Body.Close()

	if req.OldPassword == "" || req.NewPassword == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Old password and new password are required")
		return
	}

	if len(req.NewPassword) < 4 {
		httpResp.RespondWithError(w, http.StatusBadRequest, "New password must be at least 4 characters")
		return
	}

	// Get session
	session, _ := store.Get(r, "elms-session")

	// Check if user is authenticated
	if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Session invalid")
		return
	}

	// Get employee
	employee, err := model.GetEmployeeByID(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Verify old password (plain text comparison)
	if req.OldPassword != employee.PasswordHash {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Current password is incorrect")
		return
	}

	// Update password (plain text)
	employee.PasswordHash = req.NewPassword
	if err := employee.ChangePassword(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error changing password")
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Password changed successfully",
	})
}

// CheckAuth - GET /auth/check (check if user is logged in)
func CheckAuth(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "elms-session")

	if auth, ok := session.Values["authenticated"].(bool); ok && auth {
		httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"success":       true,
			"authenticated": true,
			"user": map[string]interface{}{
				"employeeId": session.Values["employeeID"],
				"email":      session.Values["email"],
				"role":       session.Values["role"],
				"firstName":  session.Values["firstName"],
				"lastName":   session.Values["lastName"],
			},
		})
	} else {
		httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"success":       true,
			"authenticated": false,
		})
	}
}
