package routes

import (
	"fmt"
	"leaveapp/controller"
	"leaveapp/middleware"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func InitializeRoutes() {
	// creating a new router
	router := mux.NewRouter()

	// Public Auth routes
	router.HandleFunc("/auth/login", controller.Login).Methods("POST")
	router.HandleFunc("/auth/register", controller.Register).Methods("POST")
	router.HandleFunc("/auth/logout", controller.Logout).Methods("POST")
	router.HandleFunc("/auth/check", controller.CheckAuth).Methods("GET")

	// Protected Auth routes
	router.HandleFunc("/auth/profile", middleware.AuthMiddleware(controller.GetProfile)).Methods("GET")
	router.HandleFunc("/auth/change-password", middleware.AuthMiddleware(controller.ChangePassword)).Methods("POST")

	// Employee routes
	router.HandleFunc("/employee/add", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.AddEmployee))).Methods("POST")
	router.HandleFunc("/employee/{eid}", middleware.AuthMiddleware(controller.GetEmployee)).Methods("GET")
	router.HandleFunc("/employee/{eid}", middleware.AuthMiddleware(controller.UpdateEmployee)).Methods("PUT")
	router.HandleFunc("/employee/{eid}/profile-pic", middleware.AuthMiddleware(controller.UpdateProfilePic)).Methods("PUT")
	router.HandleFunc("/employee/{eid}/status", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.UpdateEmployeeStatus))).Methods("PUT")
	router.HandleFunc("/employee/{eid}", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.DeleteEmployee))).Methods("DELETE")
	router.HandleFunc("/employees/all", middleware.AuthMiddleware(controller.GetAllEmployees)).Methods("GET")
	router.HandleFunc("/employees/filter", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.GetFilteredEmployees))).Methods("GET")

	// TEMPORARY - Direct access without auth for testing
	// router.HandleFunc("/employee/add", controller.AddEmployee).Methods("POST")
	// router.HandleFunc("/employee/{eid}", controller.GetEmployee).Methods("GET")
	// router.HandleFunc("/employee/{eid}", controller.UpdateEmployee).Methods("PUT")
	// router.HandleFunc("/employee/{eid}/profile-pic", controller.UpdateProfilePic).Methods("PUT")
	// router.HandleFunc("/employee/{eid}/status", controller.UpdateEmployeeStatus).Methods("PUT")
	// router.HandleFunc("/employee/{eid}", controller.DeleteEmployee).Methods("DELETE")
	// router.HandleFunc("/employees/all", controller.GetAllEmployees).Methods("GET")
	// router.HandleFunc("/employees/filter", controller.GetFilteredEmployees).Methods("GET")

	// Department routes - COMMENT OUT middleware
	router.HandleFunc("/department/add", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.AddDepartment))).Methods("POST")
	router.HandleFunc("/department/{id}", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.GetDepartment))).Methods("GET")
	router.HandleFunc("/department/{id}", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.UpdateDepartment))).Methods("PUT")
	router.HandleFunc("/department/{id}", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.DeleteDepartment))).Methods("DELETE")
	router.HandleFunc("/departments/all", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.GetAllDepartments))).Methods("GET")
	router.HandleFunc("/departments/names", middleware.AuthMiddleware(controller.GetDepartmentNames)).Methods("GET")
	router.HandleFunc("/department/{id}/employees", middleware.AuthMiddleware(controller.GetDepartmentEmployees)).Methods("GET")

	// Department routes
	// router.HandleFunc("/department/add", controller.AddDepartment).Methods("POST")
	// router.HandleFunc("/department/{id}", controller.GetDepartment).Methods("GET")
	// router.HandleFunc("/department/{id}", controller.UpdateDepartment).Methods("PUT")
	// router.HandleFunc("/department/{id}", controller.DeleteDepartment).Methods("DELETE")
	// router.HandleFunc("/departments/all", controller.GetAllDepartments).Methods("GET")
	// router.HandleFunc("/departments/names", controller.GetDepartmentNames).Methods("GET")
	// router.HandleFunc("/department/{id}/employees", controller.GetDepartmentEmployees).Methods("GET")

	// Leave routes - Employee and Admin
	router.HandleFunc("/leave/apply", middleware.AuthMiddleware(controller.ApplyLeave)).Methods("POST")
	router.HandleFunc("/leave/my-leaves", middleware.AuthMiddleware(controller.GetMyLeaves)).Methods("GET")
	router.HandleFunc("/leave/balance", middleware.AuthMiddleware(controller.GetLeaveBalance)).Methods("GET")
	router.HandleFunc("/leave/colleagues-on-leave", middleware.AuthMiddleware(controller.GetColleaguesOnLeave)).Methods("GET")
	router.HandleFunc("/leave/{id}/cancel", middleware.AuthMiddleware(controller.CancelLeave)).Methods("DELETE")
	router.HandleFunc("/leave/{id}/update", middleware.AuthMiddleware(controller.UpdateLeave)).Methods("PUT")

	// Admin only leave routes
	router.HandleFunc("/leave/all", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.GetAllLeaves))).Methods("GET")
	router.HandleFunc("/leave/pending", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.GetPendingLeaves))).Methods("GET")
	router.HandleFunc("/leave/{id}/approve", middleware.AuthMiddleware(middleware.AdminMiddleware(controller.ApproveLeave))).Methods("PUT")

	// Leave routes
	// router.HandleFunc("/leave/apply", (controller.ApplyLeave)).Methods("POST")
	// router.HandleFunc("/leave/my-leaves", (controller.GetMyLeaves)).Methods("GET")
	// router.HandleFunc("/leave/balance", (controller.GetLeaveBalance)).Methods("GET")
	// router.HandleFunc("/leave/colleagues-on-leave", (controller.GetColleaguesOnLeave)).Methods("GET")
	// router.HandleFunc("/leave/all", (controller.GetAllLeaves)).Methods("GET")
	// router.HandleFunc("/leave/pending", controller.GetPendingLeaves).Methods("GET")
	// router.HandleFunc("/leave/{id}/approve", controller.ApproveLeave).Methods("PUT")
	// router.HandleFunc("/leave/{id}/cancel", (controller.CancelLeave)).Methods("DELETE")

	// Notification routes
	router.HandleFunc("/notifications", middleware.AuthMiddleware(controller.GetMyNotifications)).Methods("GET")
	router.HandleFunc("/notifications/unread/count", middleware.AuthMiddleware(controller.GetUnreadCount)).Methods("GET")
	router.HandleFunc("/notifications/{id}/read", middleware.AuthMiddleware(controller.MarkAsRead)).Methods("PUT")
	router.HandleFunc("/notifications/read-all", middleware.AuthMiddleware(controller.MarkAllAsRead)).Methods("PUT")
	router.HandleFunc("/notifications/{id}", middleware.AuthMiddleware(controller.DeleteNotification)).Methods("DELETE")
	router.HandleFunc("/notifications/all", middleware.AuthMiddleware(controller.DeleteAllNotifications)).Methods("DELETE")

	// Notification routes
	// router.HandleFunc("/notifications", (controller.GetMyNotifications)).Methods("GET")
	// router.HandleFunc("/notifications/unread/count", (controller.GetUnreadCount)).Methods("GET")
	// router.HandleFunc("/notifications/{id}/read", (controller.MarkAsRead)).Methods("PUT")
	// router.HandleFunc("/notifications/read-all", (controller.MarkAllAsRead)).Methods("PUT")
	// router.HandleFunc("/notifications/{id}", (controller.DeleteNotification)).Methods("DELETE")
	// router.HandleFunc("/notifications/all", (controller.DeleteAllNotifications)).Methods("DELETE")

	// load static files
	fHandler := http.FileServer(http.Dir("./view"))
	// serve static files as a route by registering all static files on the mux router
	router.PathPrefix("/").Handler(fHandler)

	fmt.Println("Server started successfully")
	// start the http server
	log.Fatal(http.ListenAndServe(":8080", router))
}
