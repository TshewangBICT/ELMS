// API Service
const API = {
    BASE_URL: 'http://localhost:8080',
    
    async request(endpoint, options = {}) {
        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return response.json();
    },
    
    // ============= AUTH APIS =============
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },
    
    async getProfile() {
        return this.request('/auth/profile');
    },
    
    async changePassword(oldPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
    },
    
    // ============= EMPLOYEE APIS =============
    async getAllEmployees() {
        return this.request('/employees/all');
    },
    
    async getEmployee(employeeId) {
        return this.request(`/employee/${employeeId}`);
    },
    
    async addEmployee(employeeData) {
        return this.request('/employee/add', {
            method: 'POST',
            body: JSON.stringify(employeeData)
        });
    },
    
    async updateEmployee(employeeId, employeeData) {
        return this.request(`/employee/${employeeId}`, {
            method: 'PUT',
            body: JSON.stringify(employeeData)
        });
    },

    async updateProfilePic(employeeId, profilePic) {
        return this.request(`/employee/${employeeId}/profile-pic`, {
            method: 'PUT',
            body: JSON.stringify({ profilePic })
        });
    },
    
    async updateEmployeeStatus(employeeId, status) {
        return this.request(`/employee/${employeeId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    
    async deleteEmployee(employeeId) {
        return this.request(`/employee/${employeeId}`, {
            method: 'DELETE'
        });
    },
    
    async filterEmployees(department, status, search) {
        let url = '/employees/filter?';
        if (department && department !== 'all') url += `department=${encodeURIComponent(department)}&`;
        if (status && status !== 'all') url += `status=${status}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        return this.request(url);
    },
    
    // ============= DEPARTMENT APIS =============
    async getAllDepartments() {
        return this.request('/departments/all');
    },
    
    async getDepartment(id) {
        return this.request(`/department/${id}`);
    },
    
    async getDepartmentNames() {
        return this.request('/departments/names');
    },
    
    async addDepartment(name) {
        return this.request('/department/add', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    },
    
    async updateDepartment(id, newName) {
        return this.request(`/department/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ newName })
        });
    },
    
    async deleteDepartment(id) {
        return this.request(`/department/${id}`, {
            method: 'DELETE'
        });
    },
    
    async getDepartmentEmployees(id) {
        return this.request(`/department/${id}/employees`);
    },
    
    // ============= LEAVE APIS =============
    async applyLeave(leaveData) {
        return this.request('/leave/apply', {
            method: 'POST',
            body: JSON.stringify(leaveData)
        });
    },
    
    async getMyLeaves() {
        return this.request('/leave/my-leaves');
    },
    
    async getLeaveBalance() {
        return this.request('/leave/balance');
    },
    
    async getAllLeaves(status = null) {
        let url = '/leave/all';
        if (status) url += `?status=${status}`;
        return this.request(url);
    },
    
    async getPendingLeaves() {
        return this.request('/leave/pending');
    },
    
    async approveLeave(id, status) {
        return this.request(`/leave/${id}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    
    async cancelLeave(id) {
        return this.request(`/leave/${id}/cancel`, {
            method: 'DELETE'
        });
    },
    
    async getColleaguesOnLeave() {
        return this.request('/leave/colleagues-on-leave');
    },
    
    // ============= NOTIFICATION APIS =============
    async getNotifications() {
        return this.request('/notifications');
    },
    
    async getUnreadCount() {
        return this.request('/notifications/unread/count');
    },
    
    async markAsRead(id) {
        return this.request(`/notifications/${id}/read`, { method: 'PUT' });
    },
    
    async markAllAsRead() {
        return this.request('/notifications/read-all', { method: 'PUT' });
    },
    
    async deleteNotification(id) {
        return this.request(`/notifications/${id}`, { method: 'DELETE' });
    },
    
    async deleteAllNotifications() {
        return this.request('/notifications/all', { method: 'DELETE' });
    },
    
    // User self update profile
    async updateMyProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
};

// Main Application Controller
const App = {
    currentUser: null,
    currentPage: 'dashboard',
    isLoading: false,
    notificationPollingInterval: null,
    adminPollingInterval: null,

    async init() {
    console.log('App initializing...');
    this.showLoading();
    
    try {
        const checkResponse = await fetch('http://localhost:8080/auth/check', {
            credentials: 'include'
        });
        const checkResult = await checkResponse.json();
        console.log('Auth check result:', checkResult);
        
        if (checkResult.authenticated) {
            // Fetch profile data properly
            const profileResponse = await fetch('http://localhost:8080/auth/profile', {
                credentials: 'include'
            });
            const profileResult = await profileResponse.json();
            console.log('Profile result:', profileResult);
            
            if (profileResult.success && profileResult.data) {
                const userData = profileResult.data;
                
                // IMPORTANT: Fetch the complete employee data to get profile picture
                // The /auth/profile might not return profilePic, so we fetch from /employee endpoint
                let profilePic = null;
                try {
                    const employeeId = userData.employeeId || userData.employee_id;
                    if (employeeId) {
                        const empResponse = await fetch(`http://localhost:8080/employee/${employeeId}`, {
                            credentials: 'include'
                        });
                        const empResult = await empResponse.json();
                        console.log('Full employee data:', empResult);
                        if (empResult.success && empResult.data) {
                            profilePic = empResult.data.profilePic || empResult.data.profile_pic || null;
                        }
                    }
                } catch (err) {
                    console.error('Error fetching full employee data:', err);
                }
                
                this.currentUser = {
                    employeeId: userData.employeeId || userData.employee_id,
                    firstName: userData.firstName || userData.first_name,
                    lastName: userData.lastName || userData.last_name,
                    email: userData.email,
                    phone: userData.phone,
                    dob: userData.dob,
                    position: userData.position,
                    department: userData.department,
                    role: userData.role,
                    status: userData.status,
                    joinDate: userData.joinDate || userData.join_date,
                    profilePic: profilePic || userData.profilePic || userData.profile_pic || null,
                    createdAt: userData.createdAt || userData.created_at,
                    updatedAt: userData.updatedAt || userData.updated_at
                };
                
                console.log('User set with profilePic:', this.currentUser.profilePic);
                console.log('Full user object:', this.currentUser);
                
                // Start notification polling
                this.startNotificationPolling();
                
                this.loadApp();
                return true;
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
    
    this.showLogin();
    return false;
},

    startNotificationPolling() {
        if (this.notificationPollingInterval) {
            clearInterval(this.notificationPollingInterval);
        }
        
        // Poll every 30 seconds for notifications
        this.notificationPollingInterval = setInterval(() => {
            this.updateNotificationBadges();
        }, 30000);
        
        // Start admin polling if user is admin
        this.startAdminPolling();
    },

    startAdminPolling() {
        if (this.adminPollingInterval) {
            clearInterval(this.adminPollingInterval);
        }
        
        // Only start if user is admin
        if (this.currentUser?.role === 'admin') {
            // Poll every 10 seconds for new pending leaves
            this.adminPollingInterval = setInterval(() => {
                this.checkForNewPendingLeaves();
            }, 10000);
        }
    },

    async checkForNewPendingLeaves() {
        try {
            const result = await API.getPendingLeaves();
            const currentPendingCount = result?.data?.length || 0;
            
            // Get the current displayed count from the badge
            const badge = document.getElementById('notifBadge');
            let displayedCount = 0;
            if (badge && !badge.classList.contains('hidden')) {
                displayedCount = parseInt(badge.textContent) || 0;
            }
            
            // If count changed and increased, show toast notification
            if (currentPendingCount > displayedCount) {
                const newCount = currentPendingCount - displayedCount;
                Utils.showToast(`📋 ${newCount} new leave request${newCount > 1 ? 's' : ''} pending approval`, 'info');
                
                // Update the leave requests page if it's currently open
                if (App.currentPage === 'leaveRequests') {
                    if (typeof LeaveRequests !== 'undefined' && LeaveRequests.render) {
                        await LeaveRequests.render();
                    } else {
                        await this.renderPendingLeaves();
                    }
                }
            }
            
            // Update badge
            await this.updateNotificationBadges();
            
        } catch (error) {
            console.error('Error checking pending leaves:', error);
        }
    },

    stopNotificationPolling() {
        if (this.notificationPollingInterval) {
            clearInterval(this.notificationPollingInterval);
            this.notificationPollingInterval = null;
        }
        if (this.adminPollingInterval) {
            clearInterval(this.adminPollingInterval);
            this.adminPollingInterval = null;
        }
    },

    showLoading() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `<div class="min-h-screen flex items-center justify-center"><div class="text-center"><i class="fas fa-spinner fa-spin text-4xl text-primary-600"></i><p class="mt-4 text-gray-600">Loading...</p></div></div>`;
        }
    },

    showLogin() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = LoginPage.render();
            LoginPage.attachEvents();
        }
    },

    loadApp() {
    console.log('Loading app with user:', this.currentUser);
    console.log('Profile pic in loadApp:', this.currentUser?.profilePic);
    
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = MainLayout.render();
        MainLayout.attachEvents();
        
        // Update sidebar profile immediately
        MainLayout.updateSidebarProfile();
        
        // Navigate to dashboard
        this.navigateTo('dashboard');
    }
},
    async navigateTo(page) {
    console.log('Navigating to:', page, 'Current user:', this.currentUser);
    
    if (!this.currentUser) {
        console.error('No current user! Redirecting to login...');
        this.showLogin();
        return;
    }
    
    // If already on the same page and not dashboard, just refresh the data
    if (this.currentPage === page && page !== 'dashboard') {
        console.log('Already on page, refreshing data...');
        this.isLoading = true;
        try {
            switch(page) {
                case 'manageEmployees':
                    await EmployeeManager.render(this.currentUser);
                    break;
                case 'manageDepartments':
                    await DepartmentManager.render(this.currentUser);
                    break;
                case 'leaveRequests':
                    if (typeof LeaveRequests !== 'undefined' && LeaveRequests.render) {
                        await LeaveRequests.render();
                    } else {
                        await this.renderPendingLeaves();
                    }
                    break;
                case 'notifications':
                    await Notifications.render(this.currentUser);
                    break;
                case 'myLeaves':
                    await Leave.myLeaves(this.currentUser);
                    break;
                case 'leaveBalance':
                    await Leave.balance(this.currentUser);
                    break;
                case 'colleaguesOnLeave':
                    await Leave.colleaguesOnLeave(this.currentUser);
                    break;
                case 'profile':
                    Profile.render(this.currentUser);
                    break;
            }
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            this.isLoading = false;
        }
        return;
    }
    
    if (this.isLoading) return;
    this.isLoading = true;
    this.currentPage = page;
    
    // Update sidebar and title - ALWAYS update sidebar profile
    MainLayout.updateSidebar(page);
    MainLayout.updatePageTitle(page);
    MainLayout.updateSidebarProfile();  // Make sure sidebar profile is updated on every navigation
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = `<div class="flex justify-center items-center h-64"><div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i><p class="mt-2 text-gray-500">Loading...</p></div></div>`;
    }
    
    try {
        switch(page) {
            case 'dashboard':
                await Dashboard.render(this.currentUser);
                break;
            case 'manageEmployees':
                await EmployeeManager.render(this.currentUser);
                break;
            case 'manageDepartments':
                await DepartmentManager.render(this.currentUser);
                break;
            case 'profile':
                Profile.render(this.currentUser);
                break;
            case 'changePassword':
                Profile.changePassword();
                break;
            case 'applyLeave':
                await Leave.apply(this.currentUser);
                break;
            case 'myLeaves':
                await Leave.myLeaves(this.currentUser);
                break;
            case 'leaveBalance':
                await Leave.balance(this.currentUser);
                break;
            case 'colleaguesOnLeave':
                await Leave.colleaguesOnLeave(this.currentUser);
                break;
            case 'notifications':
                await Notifications.render(this.currentUser);
                break;
            case 'leaveRequests':
                if (typeof LeaveRequests !== 'undefined' && LeaveRequests.render) {
                    await LeaveRequests.render();
                } else {
                    await this.renderPendingLeaves();
                }
                break;
            default:
                await Dashboard.render(this.currentUser);
        }
        
        // Update notification badge after page loads
        await this.updateNotificationBadges();
        
    } catch (error) {
        console.error('Navigation error:', error);
        const mc = document.getElementById('mainContent');
        if (mc) {
            mc.innerHTML = `<div class="bg-white rounded-2xl p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i><h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Page</h3><p class="text-gray-600">${error.message}</p><button onclick="App.navigateTo('dashboard')" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Go to Dashboard</button></div>`;
        }
    } finally {
        this.isLoading = false;
    }
},

    async renderPendingLeaves() {
    console.log('Fetching pending leaves...');
    
    try {
        const result = await API.getPendingLeaves();
        const leaves = result?.data || [];
        const currentUserId = this.currentUser?.employeeId;
        
        if (leaves.length === 0) {
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">No Pending Requests</h3>
                    <p class="text-gray-500">All leave requests have been processed.</p>
                    <button onclick="App.renderPendingLeaves()" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-sync-alt mr-2"></i> Refresh
                    </button>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div class="border-b p-5 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
                    <div>
                        <h2 class="font-bold text-xl flex items-center gap-2">
                            <i class="fas fa-clipboard-list text-primary-600"></i>
                            Pending Leave Approvals
                        </h2>
                        <p class="text-sm text-gray-500 mt-1">${leaves.length} request(s) awaiting your action</p>
                    </div>
                    <button onclick="App.renderPendingLeaves()" class="text-primary-600 hover:text-primary-800 transition">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-4 text-left">Employee</th>
                                <th class="p-4 text-left">Department</th>
                                <th class="p-4 text-left">Leave Type</th>
                                <th class="p-4 text-left">From Date</th>
                                <th class="p-4 text-left">To Date</th>
                                <th class="p-4 text-left">Days</th>
                                <th class="p-4 text-left">Reason</th>
                                <th class="p-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaves.map(leave => {
                                const isSelf = leave.employeeId === currentUserId;
                                const actionButtons = isSelf ? `
                                    <span class="text-gray-400 text-xs">
                                        <i class="fas fa-lock"></i> Cannot self-approve
                                    </span>
                                ` : `
                                    <div class="flex gap-2">
                                        <button onclick="App.approveLeave(${leave.id}, 'approved')" 
                                                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition">
                                            <i class="fas fa-check"></i> Approve
                                        </button>
                                        <button onclick="App.approveLeave(${leave.id}, 'rejected')" 
                                                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition">
                                            <i class="fas fa-times"></i> Reject
                                        </button>
                                    </div>
                                `;
                                
                                return `
                                    <tr class="border-b hover:bg-gray-50 ${isSelf ? 'bg-amber-50' : ''}">
                                        <td class="p-4 font-medium">
                                            ${leave.employeeName || leave.first_name || 'N/A'} ${leave.last_name || ''}
                                            ${isSelf ? '<span class="ml-2 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">You</span>' : ''}
                                            <div class="text-xs text-gray-400">${leave.employee_id || leave.employeeId}</div>
                                        </td>
                                        <td class="p-4">${leave.department || 'N/A'}</td>
                                        <td class="p-4">
                                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                ${leave.leave_type || leave.leaveType}
                                            </span>
                                        </td>
                                        <td class="p-4">${Utils.formatDate(leave.from_date || leave.fromDate)}</td>
                                        <td class="p-4">${Utils.formatDate(leave.to_date || leave.toDate)}</td>
                                        <td class="p-4">${leave.days}</td>
                                        <td class="p-4 max-w-xs truncate" title="${leave.reason}">${leave.reason}</td>
                                        <td class="p-4">${actionButtons}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading pending leaves:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="bg-white rounded-2xl p-8 text-center">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
                <p class="text-gray-600">${error.message}</p>
                <button onclick="App.renderPendingLeaves()" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
            </div>
        `;
    }
},

async approveLeave(leaveId, status) {
    // Check if trying to approve own leave (additional safety)
    const pendingLeaves = await API.getPendingLeaves();
    const leave = pendingLeaves?.data?.find(l => l.id === leaveId);
    
    if (leave && leave.employeeId === this.currentUser?.employeeId) {
        Utils.showToast('You cannot approve or reject your own leave request', 'warn');
        await this.renderPendingLeaves();
        return;
    }
    
    try {
        // Convert 'rejected' to 'cancelled' for backend
        const backendStatus = status === 'rejected' ? 'cancelled' : status;
        const result = await API.approveLeave(leaveId, backendStatus);
        
        if (result.success) {
            Utils.showToast(`Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully`, 'ok');
            await this.renderPendingLeaves();
            await this.updateNotificationBadges();
        } else {
            Utils.showToast(result.error || 'Failed to process leave request', 'err');
        }
    } catch (error) {
        Utils.showToast(error.message || 'Failed to process leave request', 'err');
    }
},

    async updateNotificationBadges() {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        
        try {
            if (this.currentUser?.role === 'admin') {
                const pendingLeaves = await API.getPendingLeaves();
                const pendingCount = pendingLeaves?.data?.length || 0;
                
                if (pendingCount > 0) {
                    badge.textContent = pendingCount;
                    badge.classList.remove('hidden');
                    badge.classList.add('animate-pulse');
                } else {
                    badge.classList.add('hidden');
                    badge.classList.remove('animate-pulse');
                }
            } else {
                const result = await API.getUnreadCount();
                if (result?.unread > 0) {
                    badge.textContent = result.unread;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error updating badges:', error);
            badge.classList.add('hidden');
        }
    },

    async logout() {
        this.stopNotificationPolling();
        
        try {
            await fetch('http://localhost:8080/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        this.currentUser = null;
        this.showLogin();
        Utils.showToast('Logged out successfully', 'ok');
    }
};

// Main Layout Component
const MainLayout = {
    render() {
        return `
            <div class="min-h-screen bg-gray-50 flex flex-col">
                <div id="mobileOverlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 hidden" onclick="Utils.closeMobileSidebar()"></div>
                <div class="flex flex-1">
                    <aside id="mainSidebar" class="fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl border-r border-gray-200 transform -translate-x-full md:translate-x-0 sidebar-transition flex flex-col">
                        <div id="sidebarTopProfile" class="px-5 py-5 border-b border-gray-100 flex items-center gap-3"></div>
                        <nav id="sidebarNav" class="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin"></nav>
                        <div class="p-4 border-t border-gray-100">
                            <button onclick="App.logout()" class="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-xl transition-all duration-200">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </aside>
                    <div class="flex-1 md:ml-72 flex flex-col min-h-screen">
                        <header class="app-header sticky top-0 z-20 px-5 md:px-8 py-3 flex justify-between items-center shadow-lg">
                            <div class="flex items-center gap-3">
                                <button id="mobileMenuBtn" class="md:hidden text-white text-xl"><i class="fas fa-bars"></i></button>
                                <div class="flex items-center gap-2">
                                    <h1 id="pageTitle" class="text-xl font-bold text-white">Dashboard</h1>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <button onclick="App.navigateTo('notifications')" class="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                                    <i class="fas fa-bell text-white"></i>
                                    <span id="notifBadge" class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 hidden">0</span>
                                </button>
                            </div>
                        </header>
                        <main id="mainContent" class="p-5 md:p-8 flex-1">
                            <div class="flex justify-center items-center h-64"><div class="text-center"><i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i><p class="mt-2 text-gray-500">Loading...</p></div></div>
                        </main>
                        <footer class="unified-header-footer py-6 px-6 mt-auto">
    <div class="max-w-7xl mx-auto">
        <div class="flex flex-col lg:flex-row justify-between items-center gap-5">
            <!-- Left Section - Copyright -->
            <div class="text-center lg:text-left order-3 lg:order-1">
                <p class="text-white/70 text-xs tracking-wide">
                    <i class="far fa-copyright mr-1"></i> 2026 Employee Leave Management System. All rights reserved.
                </p>
            </div>
            
            <!-- Center Section - Developers -->
            <div class="text-center order-1 lg:order-2">
                <div class="flex flex-col items-center gap-1">
                    <div class="flex flex-wrap justify-center gap-x-3 gap-y-1">
                        <span class="text-white/90 text-xs hover:text-white transition-colors">Arjun Mishra</span>
                        <span class="text-white/50 text-xs">•</span>
                        <span class="text-white/90 text-xs hover:text-white transition-colors">Chencho Nedup</span>
                        <span class="text-white/50 text-xs">•</span>
                        <span class="text-white/90 text-xs hover:text-white transition-colors">Jigme Tashi</span>
                        <span class="text-white/50 text-xs">•</span>
                        <span class="text-white/90 text-xs hover:text-white transition-colors">Tshewang Tobgay</span>
                    </div>
                </div>
            </div>
            
            <!-- Right Section - Social Media -->
            <div class="order-2 lg:order-3">
                <div class="flex gap-4">
                    <a href="https://facebook.com" target="_blank" 
                       class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:translate-y-[-2px] group">
                        <i class="fab fa-facebook-f text-white/80 group-hover:text-white text-sm"></i>
                    </a>
                    <a href="https://instagram.com" target="_blank" 
                       class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:translate-y-[-2px] group">
                        <i class="fab fa-instagram text-white/80 group-hover:text-white text-sm"></i>
                    </a>
                    <a href="https://youtube.com" target="_blank" 
                       class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:translate-y-[-2px] group">
                        <i class="fab fa-youtube text-white/80 group-hover:text-white text-sm"></i>
                    </a>
                    <a href="https://twitter.com" target="_blank" 
                       class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:translate-y-[-2px] group">
                        <i class="fab fa-x-twitter text-white/80 group-hover:text-white text-sm"></i>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Decorative Line -->
        <div class="mt-4 pt-3 border-t border-white/10 text-center">
            <p class="text-white/40 text-[10px] tracking-wider">
                <i class="fas fa-heart text-red-400/50 text-[8px] mx-1"></i> 
                Empowering Workforce Through Smart Leave Management 
                <i class="fas fa-heart text-red-400/50 text-[8px] mx-1"></i>
            </p>
        </div>
    </div>
</footer>
                    </div>
                </div>
            </div>
        `;
    },

    attachEvents() {
        const mobileBtn = document.getElementById('mobileMenuBtn');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                document.getElementById('mainSidebar')?.classList.remove('-translate-x-full');
                document.getElementById('mobileOverlay')?.classList.remove('hidden');
            });
        }
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                document.getElementById('mainSidebar')?.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            });
        }
    },

    updateSidebar(currentPage) {
    const isAdmin = App.currentUser?.role === 'admin';
    
    const items = isAdmin ? [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
        { divider: true, title: 'LEAVE MANAGEMENT' },
        { id: 'applyLeave', icon: 'fa-calendar-plus', label: 'Apply Leave' },
        { id: 'myLeaves', icon: 'fa-calendar-check', label: 'My Leave History' },
        { id: 'leaveBalance', icon: 'fa-chart-pie', label: 'Leave Balance' },
        { id: 'colleaguesOnLeave', icon: 'fa-people-arrows', label: "Today's Leave" },
        { divider: true, title: 'Admin Portal' },
        { id: 'manageEmployees', icon: 'fa-users-gear', label: 'Employee Directory' },
        { id: 'manageDepartments', icon: 'fa-building', label: 'Departments' },
        { id: 'leaveRequests', icon: 'fa-clipboard-list', label: 'Leave Approvals' },
        { divider: true, title: 'NOTIFICATIONS' },
        { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
        { divider: true, title: 'PERSONAL' },
        { id: 'profile', icon: 'fa-user', label: 'My Profile' },
        { id: 'changePassword', icon: 'fa-lock', label: 'Change Password' }
    ] : [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
        { divider: true, title: 'LEAVE MANAGEMENT' },
        { id: 'applyLeave', icon: 'fa-calendar-plus', label: 'Apply Leave' },
        { id: 'myLeaves', icon: 'fa-calendar-check', label: 'My Leave History' },
        { id: 'leaveBalance', icon: 'fa-chart-pie', label: 'Leave Balance' },
        { id: 'colleaguesOnLeave', icon: 'fa-people-arrows', label: "Today's Leave" },
        { divider: true, title: 'NOTIFICATIONS' },
        { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
        { divider: true, title: 'ACCOUNT SETTINGS' },
        { id: 'profile', icon: 'fa-user', label: 'My Profile' },
        { id: 'changePassword', icon: 'fa-lock', label: 'Change Password' }
    ];
    
    let html = '';
    for (const it of items) {
        if (it.divider) {
            html += `<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1.5">${it.title}</div>`;
        } else {
            const active = currentPage === it.id ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' : 'text-gray-700 hover:bg-gray-50';
            html += `<div class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl cursor-pointer ${active}" onclick="App.navigateTo('${it.id}')"><i class="fas ${it.icon} w-5"></i><span>${it.label}</span></div>`;
        }
    }
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) sidebarNav.innerHTML = html;
    this.updateSidebarProfile();
},

    updateSidebarProfile() {
    const u = App.currentUser;
    if (!u) {
        console.log('No current user, cannot update sidebar profile');
        return;
    }

    const profilePicUrl = u.profilePic || null;

    let avatarHtml = '';
    if (profilePicUrl && profilePicUrl !== 'null' && profilePicUrl !== 'undefined') {
        avatarHtml = `<img src="${profilePicUrl}" class="w-12 h-12 rounded-xl object-cover border-2 border-primary-200" 
                         onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<div class=\'w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white flex items-center justify-center text-lg font-bold border-2 border-primary-200\'>${(u.firstName?.[0] || '')}${(u.lastName?.[0] || '')}</div>';">`;
    } else {
        avatarHtml = `<div class="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white flex items-center justify-center text-lg font-bold border-2 border-primary-200">
            ${(u.firstName?.[0] || '')}${(u.lastName?.[0] || '')}
        </div>`;
    }

    const profileDiv = document.getElementById('sidebarTopProfile');
    if (profileDiv) {
        profileDiv.innerHTML = `
            <div class="flex items-center gap-3 w-full">
                ${avatarHtml}
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-gray-800 truncate">${u.firstName || ''} ${u.lastName || ''}</div>
                    <div class="text-xs text-gray-500 truncate">${u.role === 'admin' ? 'Administrator' : 'Employee'}</div>
                    <div class="text-xs text-primary-600 truncate">${u.position || ''}</div>
                </div>
            </div>
        `;
        console.log('Sidebar profile updated with avatar');
    } else {
        console.log('Sidebar profile div not found');
    }
},

    updatePageTitle(page) {
        const titles = {
            dashboard: 'Dashboard',
            manageEmployees: 'Employee Directory',
            manageDepartments: 'Manage Departments',
            profile: 'My Profile',
            changePassword: 'Change Password',
            applyLeave: 'Apply Leave',
            myLeaves: 'My Leave History',
            leaveBalance: 'Leave Balance',
            colleaguesOnLeave: "Today's Leave",
            notifications: 'Notifications',
            leaveRequests: 'Leave Approvals'
        };
        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.innerText = titles[page] || 'ELMS';
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting App...');
    App.init();
});

window.App = App;
window.API = API;
window.MainLayout = MainLayout;