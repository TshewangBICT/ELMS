package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"leaveapp/model"
	httpResp "leaveapp/utils"

	"github.com/gorilla/mux"
)

// ApplyLeave - POST /leave/apply
func ApplyLeave(w http.ResponseWriter, r *http.Request) {
	// Get employee ID from session
	session, _ := store.Get(r, "elms-session")
	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	var req struct {
		LeaveType    string `json:"leaveType"`
		DurationType string `json:"durationType"`
		FromDate     string `json:"fromDate"`
		ToDate       string `json:"toDate"`
		Reason       string `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	// Validate required fields
	if req.LeaveType == "" || req.FromDate == "" || req.Reason == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Leave type, from date, and reason are required")
		return
	}

	// Set default duration type if not provided
	if req.DurationType == "" {
		req.DurationType = "full"
	}

	// Validate dates
	fromDate, err := time.Parse("2006-01-02", req.FromDate)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid from date format. Use YYYY-MM-DD")
		return
	}

	toDate := fromDate
	if req.ToDate != "" {
		toDate, err = time.Parse("2006-01-02", req.ToDate)
		if err != nil {
			httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid to date format. Use YYYY-MM-DD")
			return
		}
	} else {
		req.ToDate = req.FromDate
	}

	if toDate.Before(fromDate) {
		httpResp.RespondWithError(w, http.StatusBadRequest, "To date cannot be before from date")
		return
	}

	// Calculate days
	var days float64
	if req.DurationType == "half" {
		days = 0.5
	} else {
		days = float64(toDate.Sub(fromDate).Hours()/24) + 1
	}

	// Check leave balance
	balance, err := model.GetLeaveBalance(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching leave balance: "+err.Error())
		return
	}

	var availableBalance float64
	switch req.LeaveType {
	case "Casual Leave":
		availableBalance = balance.CasualLeaveRemaining
	case "Earned Leave":
		availableBalance = balance.EarnedLeaveRemaining
	case "Maternity Leave":
		availableBalance = balance.MaternityLeaveRemaining
	case "Paternity Leave":
		availableBalance = balance.PaternityLeaveRemaining
	case "Study Leave":
		availableBalance = balance.StudyLeaveRemaining
	case "Extra Ordinary Leave":
		availableBalance = balance.ExtraOrdinaryLeaveRemaining
	case "Bereavement Leave":
		availableBalance = balance.BereavementLeaveRemaining
	default:
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid leave type")
		return
	}

	if availableBalance < days {
		httpResp.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("Insufficient leave balance. Available: %.1f, Requested: %.1f", availableBalance, days))
		return
	}

	// Check for overlapping leave
	overlap, err := model.CheckLeaveOverlap(employeeID, req.FromDate, req.ToDate)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error checking leave overlap: "+err.Error())
		return
	}
	if overlap {
		httpResp.RespondWithError(w, http.StatusConflict, "You already have a leave request for this period")
		return
	}

	// Create leave request
	leave := &model.LeaveRequest{
		EmployeeID:   employeeID,
		LeaveType:    req.LeaveType,
		DurationType: req.DurationType,
		FromDate:     req.FromDate,
		ToDate:       req.ToDate,
		Days:         days,
		Reason:       req.Reason,
	}

	if err := leave.Apply(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error applying for leave: "+err.Error())
		return
	}

	// ========== SIMPLE NOTIFICATION CODE ==========
	// Get employee details
	employee, _ := model.GetEmployeeByID(employeeID)
	employeeName := fmt.Sprintf("%s %s", employee.FirstName, employee.LastName)
	if employeeName == " " {
		employeeName = employeeID
	}

	// Days text
	daysText := fmt.Sprintf("%.1f day(s)", days)
	if days == 0.5 {
		daysText = "half day"
	} else if days == 1 {
		daysText = "1 day"
	}

	// NOTIFICATION FOR EMPLOYEE
	model.CreateNotification(employeeID,
		fmt.Sprintf("📝 %s leave request submitted for %s", req.LeaveType, daysText), "info")

	// NOTIFICATION FOR ALL ADMINS
	admins, _ := model.GetAllAdmins()
	for _, admin := range admins {
		model.CreateNotification(admin.EmployeeID,
			fmt.Sprintf("🔔 %s (%s) requested %s leave for %s",
				employeeName, employee.Department, req.LeaveType, daysText), "pending")
	}
	// ========== END OF NOTIFICATION CODE ==========

	httpResp.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Leave request submitted successfully",
		"data":    leave,
	})
}

// GetMyLeaves - GET /leave/my-leaves
func GetMyLeaves(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "elms-session")
	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	leaves, err := model.GetMyLeaves(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching leaves: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(leaves),
		"data":    leaves,
	})
}

// GetAllLeaves - GET /leave/all (Admin only)
func GetAllLeaves(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	leaves, err := model.GetAllLeaveRequests(status)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching leaves: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(leaves),
		"data":    leaves,
	})
}

// GetPendingLeaves - GET /leave/pending (Admin only)
func GetPendingLeaves(w http.ResponseWriter, r *http.Request) {
	leaves, err := model.GetPendingLeaveRequests()
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching pending leaves: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(leaves),
		"data":    leaves,
	})
}

// ApproveLeave - PUT /leave/{id}/approve (Admin only)
func ApproveLeave(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid leave ID")
		return
	}

	var req struct {
		Status string `json:"status"` // "approved" or "cancelled"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	if req.Status != "approved" && req.Status != "cancelled" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Status must be 'approved' or 'cancelled'")
		return
	}

	// Get admin ID from session
	session, _ := store.Get(r, "elms-session")
	adminID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	// Get leave request details
	leave, err := model.GetLeaveByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Leave request not found")
		return
	}

	// Get employee details for notification
	employee, _ := model.GetEmployeeByID(leave.EmployeeID)
	employeeName := fmt.Sprintf("%s %s", employee.FirstName, employee.LastName)
	if employeeName == " " {
		employeeName = leave.EmployeeID
	}

	// Prevent admin from approving their own leave
	if leave.EmployeeID == adminID {
		httpResp.RespondWithError(w, http.StatusForbidden, "You cannot approve or reject your own leave request")
		return
	}

	if err := model.ApproveLeave(id, adminID, req.Status); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error processing leave: "+err.Error())
		return
	}

	// Days text
	daysText := fmt.Sprintf("%.1f", leave.Days)
	if leave.Days == 0.5 {
		daysText = "half"
	} else if leave.Days == 1 {
		daysText = "1"
	}

	// ========== SIMPLE NOTIFICATION CODE ==========
	if req.Status == "approved" {
		// NOTIFICATION FOR EMPLOYEE
		model.CreateNotification(leave.EmployeeID,
			fmt.Sprintf("✅ Your %s leave request for %s day(s) has been APPROVED",
				leave.LeaveType, daysText), "approved")

		// NOTIFICATION FOR ADMIN
		model.CreateNotification(adminID,
			fmt.Sprintf("✅ Approved %s's %s leave request",
				employeeName, leave.LeaveType), "ok")
	} else {
		// NOTIFICATION FOR EMPLOYEE
		model.CreateNotification(leave.EmployeeID,
			fmt.Sprintf("❌ Your %s leave request for %s day(s) has been REJECTED",
				leave.LeaveType, daysText), "rejected")

		// NOTIFICATION FOR ADMIN
		model.CreateNotification(adminID,
			fmt.Sprintf("❌ Rejected %s's %s leave request",
				employeeName, leave.LeaveType), "err")
	}
	// ========== END OF NOTIFICATION CODE ==========

	message := "Leave request "
	if req.Status == "approved" {
		message += "approved"
	} else {
		message += "rejected"
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": message + " successfully",
	})
}

// GetLeaveByID - GET /leave/{id}
func GetLeaveByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid leave ID")
		return
	}

	session, _ := store.Get(r, "elms-session")
	employeeID, _ := session.Values["employeeID"].(string)
	userRole, _ := session.Values["role"].(string)

	leave, err := model.GetLeaveByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Leave request not found")
		return
	}

	if leave.EmployeeID != employeeID && userRole != "admin" {
		httpResp.RespondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    leave,
	})
}

// UpdateLeave - PUT /leave/{id}/update
func UpdateLeave(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid leave ID")
		return
	}

	session, _ := store.Get(r, "elms-session")
	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	leave, err := model.GetLeaveByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Leave request not found")
		return
	}

	if leave.EmployeeID != employeeID {
		httpResp.RespondWithError(w, http.StatusForbidden, "You can only edit your own leave requests")
		return
	}

	if leave.Status != "pending" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Only pending leave requests can be edited")
		return
	}

	var req struct {
		LeaveType    string  `json:"leaveType"`
		DurationType string  `json:"durationType"`
		FromDate     string  `json:"fromDate"`
		ToDate       string  `json:"toDate"`
		Reason       string  `json:"reason"`
		Days         float64 `json:"days"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	fromDate, err := time.Parse("2006-01-02", req.FromDate)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid from date format")
		return
	}

	toDate, err := time.Parse("2006-01-02", req.ToDate)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid to date format")
		return
	}

	if toDate.Before(fromDate) {
		httpResp.RespondWithError(w, http.StatusBadRequest, "To date cannot be before from date")
		return
	}

	var newDays float64
	if req.DurationType == "half" {
		newDays = 0.5
	} else {
		newDays = float64(toDate.Sub(fromDate).Hours()/24) + 1
	}

	if err := model.UpdateLeaveRequest(id, req.LeaveType, req.DurationType, req.FromDate, req.ToDate, newDays, req.Reason); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error updating leave request: "+err.Error())
		return
	}

	formattedFromDate := fromDate.Format("2006-01-02")
	formattedToDate := toDate.Format("2006-01-02")

	model.CreateNotification(employeeID,
		fmt.Sprintf("✏️ Your %s leave request has been updated to %s (%.1f days from %s to %s)",
			leave.LeaveType, req.LeaveType, newDays, formattedFromDate, formattedToDate), "info")

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Leave request updated successfully",
	})
}

// CancelLeave - DELETE /leave/{id}/cancel
func CancelLeave(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid leave ID")
		return
	}

	session, _ := store.Get(r, "elms-session")
	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	leave, err := model.GetLeaveByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Leave request not found")
		return
	}

	if leave.EmployeeID != employeeID {
		httpResp.RespondWithError(w, http.StatusForbidden, "You can only cancel your own leave requests")
		return
	}

	fromDate := leave.FromDate
	toDate := leave.ToDate
	if len(fromDate) > 10 {
		fromDate = fromDate[:10]
	}
	if len(toDate) > 10 {
		toDate = toDate[:10]
	}

	if err := model.CancelLeave(id, employeeID); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	model.CreateNotification(employeeID,
		fmt.Sprintf("🗑️ Your %s leave request for %.1f day(s) (from %s to %s) has been CANCELLED",
			leave.LeaveType, leave.Days, fromDate, toDate), "cancelled")

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Leave request cancelled successfully",
	})
}

// GetLeaveBalance - GET /leave/balance
func GetLeaveBalance(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "elms-session")
	employeeID, ok := session.Values["employeeID"].(string)
	if !ok {
		httpResp.RespondWithError(w, http.StatusUnauthorized, "Please login first")
		return
	}

	balance, err := model.GetLeaveBalance(employeeID)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching leave balance: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    balance,
	})
}

// GetColleaguesOnLeave - GET /leave/colleagues-on-leave
func GetColleaguesOnLeave(w http.ResponseWriter, r *http.Request) {
	leaves, err := model.GetEmployeesOnLeaveToday()
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching colleagues on leave: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(leaves),
		"data":    leaves,
	})
}
