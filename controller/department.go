package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"leaveapp/model"
	httpResp "leaveapp/utils"

	"github.com/gorilla/mux"
)

// AddDepartment - POST /department/add
func AddDepartment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	if req.Name == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Department name is required")
		return
	}

	// Check if department already exists
	existingDept, _ := model.GetDepartmentByName(req.Name)
	if existingDept != nil {
		httpResp.RespondWithError(w, http.StatusConflict, "Department already exists")
		return
	}

	// Create new department
	dept := &model.Department{
		Name:        req.Name,
		IsProtected: false,
	}

	if err := dept.Create(); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error creating department: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Department created successfully",
		"data":    dept,
	})
}

// GetAllDepartments - GET /departments/all
func GetAllDepartments(w http.ResponseWriter, r *http.Request) {
	departments, err := model.GetAllDepartments()
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching departments: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(departments),
		"data":    departments,
	})
}

// GetPublicDepartmentNames - GET /departments/public/names (no auth required)
func GetPublicDepartmentNames(w http.ResponseWriter, r *http.Request) {
	departments, err := model.GetDepartmentNames()
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching departments: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    departments,
	})
}

// GetDepartment - GET /department/{id}
func GetDepartment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	dept, err := model.GetDepartmentByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	// Get employee count
	employeeCount, _ := model.GetDepartmentEmployeeCount(dept.Name)
	dept.EmployeeCount = employeeCount

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    dept,
	})
}

// UpdateDepartment - PUT /department/{id}
func UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	var req struct {
		NewName string `json:"newName"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}
	r.Body.Close()

	if req.NewName == "" {
		httpResp.RespondWithError(w, http.StatusBadRequest, "New department name is required")
		return
	}

	// Check if department exists
	dept, err := model.GetDepartmentByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Department not found")
		return
	}

	if dept.Name == req.NewName {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Department name is the same")
		return
	}

	// Update department
	if err := model.UpdateDepartment(id, req.NewName); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Department updated successfully",
		"data": map[string]interface{}{
			"id":      id,
			"oldName": dept.Name,
			"newName": req.NewName,
		},
	})
}

// DeleteDepartment - DELETE /department/{id}
func DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	// Check if department exists
	_, err = model.GetDepartmentByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Department not found")
		return
	}

	// Delete department
	if err := model.DeleteDepartment(id); err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Department deleted successfully",
	})
}

// GetDepartmentNames - GET /departments/names (for dropdown)
func GetDepartmentNames(w http.ResponseWriter, r *http.Request) {
	departments, err := model.GetDepartmentNames()
	if err != nil {
		httpResp.RespondWithError(w, http.StatusInternalServerError, "Error fetching departments: "+err.Error())
		return
	}

	httpResp.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    departments,
	})
}

// GetDepartmentEmployees - GET /department/{id}/employees
func GetDepartmentEmployees(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusBadRequest, "Invalid department ID")
		return
	}

	// Get department
	dept, err := model.GetDepartmentByID(id)
	if err != nil {
		httpResp.RespondWithError(w, http.StatusNotFound, "Department not found")
		return
	}

	// Get employees in this department
	employees, err := model.GetFilteredEmployees(dept.Name, "", "")
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
