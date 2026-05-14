// Dashboard Module
const Dashboard = {
    async render(user) {
        console.log('Dashboard.render called with user:', user);
        
        // Check if user exists
        if (!user) {
            console.error('No user data available');
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="bg-white rounded-2xl p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Unable to Load Dashboard</h3>
                        <p class="text-gray-600">User session not found. Please refresh the page.</p>
                        <button onclick="window.location.reload()" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Refresh Page</button>
                    </div>
                `;
            }
            return;
        }

        // Check if user has role property
        const isAdmin = user.role === 'admin';
        console.log('Is Admin:', isAdmin);
        
        // Show loading
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="flex justify-center items-center h-64">
                    <div class="text-center">
                        <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                        <p class="mt-2 text-gray-500">Loading dashboard...</p>
                    </div>
                </div>
            `;
        }
        
        try {
            // Welcome Section
            const welcomeHtml = `
                <div class="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 mb-6 border">
                    <h2 class="text-2xl font-bold text-gray-800">Welcome back, ${user.firstName || 'User'} ${user.lastName || ''}!</h2>
                    <p class="text-gray-600 mt-1">${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p class="text-sm text-primary-600 mt-2">${isAdmin ? 'Administrator Access' : 'Employee Access'}</p>
                </div>
            `;
            
            let statsHtml = '';
            let quickActionsHtml = '';
            
            if (isAdmin) {
                // Fetch admin data
                let totalEmployees = 0;
                let pendingCount = 0;
                let totalDepartments = 0;
                let activeCount = 0;
                
                try {
                    const employees = await API.getAllEmployees();
                    console.log('Employees API response:', employees);
                    totalEmployees = employees?.data?.length || employees?.count || 0;
                    activeCount = (employees?.data || []).filter(e => e.status === 'active').length;
                } catch (e) { 
                    console.error('Employees fetch error:', e); 
                }
                
                try {
                    const pendingLeaves = await API.getPendingLeaves();
                    console.log('Pending leaves API response:', pendingLeaves);
                    pendingCount = pendingLeaves?.data?.length || pendingLeaves?.count || 0;
                } catch (e) { 
                    console.error('Pending leaves fetch error:', e); 
                }
                
                try {
                    const departments = await API.getAllDepartments();
                    console.log('Departments API response:', departments);
                    totalDepartments = departments?.data?.length || departments?.count || 0;
                } catch (e) { 
                    console.error('Departments fetch error:', e); 
                }
                
                statsHtml = `
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <i class="fas fa-users text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${totalEmployees}</div>
                                    <div class="text-xs text-gray-500">Total Employees</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <i class="fas fa-clock text-yellow-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${pendingCount}</div>
                                    <div class="text-xs text-gray-500">Pending Leaves</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <i class="fas fa-building text-green-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${totalDepartments}</div>
                                    <div class="text-xs text-gray-500">Departments</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${activeCount}</div>
                                    <div class="text-xs text-gray-500">Active Employees</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Quick Actions for Admin - Leave Approvals instead of My Profile
                quickActionsHtml = `
                    <div class="bg-white rounded-2xl shadow-sm border p-5">
                        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                            <i class="fas fa-bolt text-primary-600"></i>
                            Quick Actions
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <button onclick="App.navigateTo('manageEmployees')" 
                                    class="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
                                <i class="fas fa-users-gear text-2xl text-blue-600"></i>
                                <span class="text-sm font-medium text-gray-700">Manage Employees</span>
                            </button>
                            <button onclick="App.navigateTo('manageDepartments')" 
                                    class="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition">
                                <i class="fas fa-building text-2xl text-green-600"></i>
                                <span class="text-sm font-medium text-gray-700">Departments</span>
                            </button>
                            <button onclick="App.navigateTo('leaveRequests')" 
                                    class="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition">
                                <i class="fas fa-clipboard-list text-2xl text-purple-600"></i>
                                <span class="text-sm font-medium text-gray-700">Leave Approvals</span>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Fetch employee data
                let totalUsed = 0;
                let pendingCount = 0;
                let approvedCount = 0;
                let colleaguesCount = 0;
                
                try {
                    const balance = await API.getLeaveBalance();
                    console.log('Balance API response:', balance);
                    if (balance?.data) {
                        const b = balance.data;
                        totalUsed = (b.casualLeaveUsed || 0) + (b.earnedLeaveUsed || 0) + 
                                   (b.maternityLeaveUsed || 0) + (b.paternityLeaveUsed || 0) +
                                   (b.studyLeaveUsed || 0) + (b.extraOrdinaryLeaveUsed || 0) +
                                   (b.bereavementLeaveUsed || 0);
                    }
                } catch (e) { 
                    console.error('Balance fetch error:', e); 
                }
                
                try {
                    const myLeaves = await API.getMyLeaves();
                    console.log('My leaves API response:', myLeaves);
                    pendingCount = (myLeaves?.data || []).filter(l => l.status === 'pending').length;
                    approvedCount = (myLeaves?.data || []).filter(l => l.status === 'approved').length;
                } catch (e) { 
                    console.error('My leaves fetch error:', e); 
                }
                
                try {
                    const colleagues = await API.getColleaguesOnLeave();
                    console.log('Colleagues API response:', colleagues);
                    colleaguesCount = colleagues?.data?.length || 0;
                } catch (e) { 
                    console.error('Colleagues fetch error:', e); 
                }
                
                statsHtml = `
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${totalUsed}</div>
                                    <div class="text-xs text-gray-500">Leaves Taken</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <i class="fas fa-hourglass-half text-yellow-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${pendingCount}</div>
                                    <div class="text-xs text-gray-500">Pending Requests</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <i class="fas fa-check-circle text-green-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${approvedCount}</div>
                                    <div class="text-xs text-gray-500">Approved Leaves</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl p-5 shadow-sm border">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <i class="fas fa-users text-purple-600 text-xl"></i>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold">${colleaguesCount}</div>
                                    <div class="text-xs text-gray-500">On Leave Today</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                quickActionsHtml = `
                    <div class="bg-white rounded-2xl shadow-sm border p-5">
                        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                            <i class="fas fa-bolt text-primary-600"></i>
                            Quick Actions
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <button onclick="App.navigateTo('applyLeave')" 
                                    class="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
                                <i class="fas fa-calendar-plus text-2xl text-blue-600"></i>
                                <span class="text-sm font-medium text-gray-700">Apply Leave</span>
                            </button>
                            <button onclick="App.navigateTo('myLeaves')" 
                                    class="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition">
                                <i class="fas fa-history text-2xl text-green-600"></i>
                                <span class="text-sm font-medium text-gray-700">My History</span>
                            </button>
                            <button onclick="App.navigateTo('leaveBalance')" 
                                    class="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition">
                                <i class="fas fa-chart-pie text-2xl text-purple-600"></i>
                                <span class="text-sm font-medium text-gray-700">Leave Balance</span>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Render everything
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="animate-fade-in">
                        ${welcomeHtml}
                        ${statsHtml}
                        ${quickActionsHtml}
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Dashboard error:', error);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="bg-white rounded-2xl p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h3>
                        <p class="text-gray-600">${error.message}</p>
                        <button onclick="Dashboard.render(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                    </div>
                `;
            }
        }
    }
};