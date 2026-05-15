// Employee Management Module
const EmployeeManager = {
    currentDepartmentFilter: 'all',
    employeeSearchQuery: '',
    searchTimeout: null,
    allEmployees: [],

    async render(user) {
        const isAdmin = user.role === 'admin';
        
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading employees...</p>
                </div>
            </div>
        `;
        
        try {
            const departmentsResult = await API.getDepartmentNames();
            let departments = [];
            if (departmentsResult?.data) {
                departments = departmentsResult.data;
            } else if (Array.isArray(departmentsResult)) {
                departments = departmentsResult;
            }
            
            const employeesResult = await API.getAllEmployees();
            this.allEmployees = employeesResult?.data || [];
            
            // Get unique departments from employees as fallback
            const uniqueDepts = [...new Set(this.allEmployees.map(e => e.department).filter(d => d))];
            
            const html = `
                <div class="bg-white rounded-2xl shadow-sm p-5 animate-fade-in">
                    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <div>
                            <h3 class="font-bold text-lg">Employee Directory <span id="employeeCount" class="text-primary-600">(${this.allEmployees.length})</span></h3>
                            <p class="text-xs text-gray-500 mt-1">${isAdmin ? 'Full access - Manage employees' : 'View only - Employee information'}</p>
                        </div>
                        ${isAdmin ? `
<<<<<<< HEAD
                            <div class="flex gap-2">
                                <button onclick="EmployeeManager.openAddModal()" class="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 transition-all shadow-sm flex items-center gap-2">
                                    <i class="fas fa-user-plus"></i> Add Employee
                                </button>
                                <button onclick="EmployeeManager.openBulkUploadModal()" class="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition-all shadow-sm flex items-center gap-2">
                                    <i class="fas fa-upload"></i> Bulk Upload
                                </button>
                            </div>
=======
                            <button onclick="EmployeeManager.openAddModal()" class="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 transition-all shadow-sm">
                                <i class="fas fa-user-plus"></i> Add Employee
                            </button>
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                        ` : ''}
                    </div>
                    <div class="flex flex-wrap gap-3 mb-4">
                        <div class="search-container relative flex-1 max-w-md">
                            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                            <input type="text" id="searchEmployeeInput" autocomplete="off" placeholder="Search by name, email, ID, department, position..." class="w-full pl-9 pr-10 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all">
                            <button id="clearSearchBtn" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hidden"><i class="fas fa-times-circle"></i></button>
                        </div>
                        <div>
                            <select id="deptFilterSelect" class="px-4 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-200">
                                <option value="all">All Departments</option>
                                ${departments.length > 0 ? 
                                    departments.map(d => `<option value="${d.name || d}">${Utils.escapeHtml(d.name || d)}</option>`).join('') :
                                    uniqueDepts.map(d => `<option value="${d}">${Utils.escapeHtml(d)}</option>`).join('')
                                }
                            </select>
                        </div>
                        <button id="clearFiltersBtn" class="px-3 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200 transition-all">
                            <i class="fas fa-times"></i> Clear Filters
                        </button>
                    </div>
                    <div id="employeeTableContainer" class="overflow-auto max-h-[550px] rounded-lg table-container"></div>
                </div>
            `;
            
            document.getElementById('mainContent').innerHTML = html;
            this.attachEvents();
            this.refreshTable(isAdmin);
            
        } catch (error) {
            console.error('Error loading employees:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Employees</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="EmployeeManager.render(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },

    // Bulk Upload Modal - Clean UI with Upload button
openBulkUploadModal() {
    const modalHtml = `
        <div class="p-5">
            <div class="flex items-center justify-between mb-4 pb-3 border-b">
                <h3 class="font-bold text-lg flex items-center gap-2">
                    <i class="fas fa-upload text-green-600"></i>
                    Bulk Upload Employees
                </h3>
                <button onclick="Utils.closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-5">
                <!-- File Upload Area -->
                <div>
                    <label class="text-sm font-medium text-gray-700 block mb-2">Upload File</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer"
                         onclick="document.getElementById('bulkFileInput').click()">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                        <p class="text-sm text-gray-500">Click to select file</p>
                        <p class="text-xs text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
                    </div>
                    <input type="file" id="bulkFileInput" accept=".xlsx,.xls,.csv" class="hidden" onchange="EmployeeManager.previewFile(this)">
                    <div id="filePreview" class="mt-2 hidden">
                        <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i id="fileIcon" class="fas fa-file-excel text-green-600"></i>
                                <span id="fileName" class="text-sm text-gray-700 font-medium"></span>
                                <span id="fileSize" class="text-xs text-gray-400"></span>
                            </div>
                            <button onclick="EmployeeManager.clearFile()" class="text-gray-400 hover:text-red-500">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Default Password Info (Static) -->
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-info-circle text-gray-400 text-sm"></i>
                        <span class="text-xs text-gray-500">Default password for new employees: <strong class="text-gray-700">Welcome123</strong></span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1 ml-5">You can override by adding a "Password" column in your file</p>
                </div>
                
                <!-- Template Download -->
                <div class="flex items-center justify-between pt-2">
                    <button onclick="EmployeeManager.downloadTemplate()" 
                            class="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                        <i class="fas fa-download"></i> Download Template
                    </button>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 mt-6 pt-4 border-t">
                <button id="bulkUploadBtn" onclick="EmployeeManager.bulkUpload()" 
                        class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2">
                    <i class="fas fa-upload"></i> Upload
                </button>
                <button onclick="Utils.closeModal()" 
                        class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                </button>
            </div>
        </div>
    `;
    Utils.openModal(modalHtml);
},

previewFile(input) {
    const file = input.files[0];
    if (file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const validTypes = ['xlsx', 'xls', 'csv'];
        if (!validTypes.includes(fileExt)) {
            Utils.showToast('Please select a valid file (.xlsx, .xls, or .csv)', 'err');
            input.value = '';
            return;
        }
        
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileIcon = document.getElementById('fileIcon');
        
        if (fileExt === 'csv') {
            fileIcon.className = 'fas fa-file-csv text-blue-600';
        } else {
            fileIcon.className = 'fas fa-file-excel text-green-600';
        }
        
        fileName.textContent = file.name;
        fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
        filePreview.classList.remove('hidden');
        
        // Scroll to show the preview
        filePreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
},

clearFile() {
    const fileInput = document.getElementById('bulkFileInput');
    const filePreview = document.getElementById('filePreview');
    if (fileInput) fileInput.value = '';
    if (filePreview) filePreview.classList.add('hidden');
},

downloadTemplate() {
    const templateData = [
        ['EmployeeID', 'FirstName', 'LastName', 'Email', 'Phone', 'Position', 'Department', 'Password'],
        ['EMP001', 'John', 'Doe', 'john@example.com', '1234567890', 'Software Engineer', 'Information Technology', ''],
        ['EMP002', 'Jane', 'Smith', 'jane@example.com', '0987654321', 'HR Manager', 'Human Resources', 'Welcome123'],
        ['EMP003', 'Mike', 'Johnson', 'mike@example.com', '5551234567', 'Accountant', 'Finance', '']
    ];
    
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Utils.showToast('Template downloaded!', 'ok');
},

async bulkUpload() {
    const fileInput = document.getElementById('bulkFileInput');
    const defaultPassword = 'Welcome123';
    
    if (!fileInput.files || !fileInput.files[0]) {
        Utils.showToast('Please select a file to upload', 'warn');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('defaultPassword', defaultPassword);
    
    const uploadBtn = document.getElementById('bulkUploadBtn');
    const originalText = uploadBtn?.innerHTML;
    if (uploadBtn) {
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        uploadBtn.disabled = true;
    }
    
    try {
        const response = await fetch('http://localhost:8080/employees/bulk-upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const result = await response.json();
        console.log('Bulk upload result:', result);
        
        if (result.success) {
            Utils.closeModal();
            Utils.showToast(result.message, 'ok');
            this.clearFile();
            await this.render(App.currentUser);
        } else {
            Utils.showToast(result.error || 'Upload failed', 'err');
            if (uploadBtn) {
                uploadBtn.innerHTML = originalText;
                uploadBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Bulk upload error:', error);
        Utils.showToast(error.message || 'Failed to upload file', 'err');
        if (uploadBtn) {
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
        }
    }
},

    attachEvents() {
        const searchInput = document.getElementById('searchEmployeeInput');
        const deptSelect = document.getElementById('deptFilterSelect');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        if (searchInput) {
            searchInput.value = this.employeeSearchQuery;
            searchInput.addEventListener('input', (e) => {
                if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', e.target.value === '');
                if (this.searchTimeout) clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.employeeSearchQuery = e.target.value;
                    const isAdmin = App.currentUser?.role === 'admin';
                    this.refreshTable(isAdmin);
                }, 350);
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this.employeeSearchQuery = '';
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                const isAdmin = App.currentUser?.role === 'admin';
                this.refreshTable(isAdmin);
            });
        }
        
        if (deptSelect) {
            deptSelect.value = this.currentDepartmentFilter;
            deptSelect.onchange = () => {
                this.currentDepartmentFilter = deptSelect.value;
                const isAdmin = App.currentUser?.role === 'admin';
                this.refreshTable(isAdmin);
            };
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.onclick = () => {
                this.employeeSearchQuery = '';
                this.currentDepartmentFilter = 'all';
                if (searchInput) searchInput.value = '';
                if (deptSelect) deptSelect.value = 'all';
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                const isAdmin = App.currentUser?.role === 'admin';
                this.refreshTable(isAdmin);
            };
        }
    },

    refreshTable(isAdmin = false) {
        let filteredEmps = [...this.allEmployees];
        const searchTerm = this.employeeSearchQuery.trim().toLowerCase();
        
        if (searchTerm) {
            filteredEmps = filteredEmps.filter(e => 
                (e.firstName || '').toLowerCase().includes(searchTerm) ||
                (e.lastName || '').toLowerCase().includes(searchTerm) ||
                (e.email || '').toLowerCase().includes(searchTerm) ||
                (e.employeeId || '').toLowerCase().includes(searchTerm) ||
                (e.phone || '').toLowerCase().includes(searchTerm) ||
                (e.position || '').toLowerCase().includes(searchTerm) ||
                (e.department || '').toLowerCase().includes(searchTerm)
            );
        }
        
        if (this.currentDepartmentFilter !== 'all') {
            filteredEmps = filteredEmps.filter(e => e.department === this.currentDepartmentFilter);
        }
        
        const countSpan = document.getElementById('employeeCount');
        if (countSpan) countSpan.innerText = `(${filteredEmps.length})`;
        
        let empRows = '';
        if (filteredEmps.length === 0) {
<<<<<<< HEAD
            const colSpan = isAdmin ? 6 : 5;
=======
            const colSpan = isAdmin ? 5 : 4;
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
            empRows = `<tr><td colspan="${colSpan}" class="text-center p-8 text-gray-400"><i class="fas fa-search text-2xl mb-2 block"></i>No employees match your search criteria</td></tr>`;
        } else {
            filteredEmps.forEach(emp => {
                const roleBadge = emp.role === 'admin' 
                    ? '<span class="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>' 
                    : '';
                
<<<<<<< HEAD
                const phoneNumber = emp.phone || '-';
                
                if (!isAdmin) {
                    // Regular users: Show 5 columns (Employee, Email, Phone, Department, Position)
=======
                // For non-admin users: show ONLY 4 columns (no Status, no Actions)
                if (!isAdmin) {
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                    empRows += `
                        <tr class="border-b hover:bg-gray-50 transition-colors duration-150">
                            <td class="p-3">
                                <div class="font-medium">${Utils.escapeHtml(emp.firstName || '')} ${Utils.escapeHtml(emp.lastName || '')} ${roleBadge}</div>
                                <div class="text-xs text-gray-400">${emp.employeeId || ''}</div>
                               </td>
                            <td class="p-3 text-sm">${Utils.escapeHtml(emp.email || '')}</td>
<<<<<<< HEAD
                            <td class="p-3 text-sm">${Utils.escapeHtml(phoneNumber)}</td>
=======
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                            <td class="p-3">${Utils.escapeHtml(emp.department || '')}</td>
                            <td class="p-3">${Utils.escapeHtml(emp.position || '')}</td>
                        </tr>
                    `;
                } else {
<<<<<<< HEAD
                    // Admin users: Show 7 columns (Employee, Email, Phone, Department, Position, Status, Actions)
=======
                    // For admin users: show 5 columns including Status and Actions
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                    empRows += `
                        <tr class="border-b hover:bg-gray-50 transition-colors duration-150">
                            <td class="p-3">
                                <div class="font-medium">${Utils.escapeHtml(emp.firstName || '')} ${Utils.escapeHtml(emp.lastName || '')} ${roleBadge}</div>
                                <div class="text-xs text-gray-400">${emp.employeeId || ''}</div>
                               </td>
                            <td class="p-3 text-sm">${Utils.escapeHtml(emp.email || '')}</td>
<<<<<<< HEAD
                            <td class="p-3 text-sm">${Utils.escapeHtml(phoneNumber)}</td>
=======
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                            <td class="p-3">${Utils.escapeHtml(emp.department || '')}</td>
                            <td class="p-3">${Utils.escapeHtml(emp.position || '')}</td>
                            <td class="p-3">${Utils.statusBadge(emp.status)}</td>
                            <td class="p-3 flex gap-2">
                                <button onclick="EmployeeManager.openEditModal('${emp.employeeId}')" class="text-blue-500 hover:text-blue-700 transition" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="EmployeeManager.toggleRole('${emp.employeeId}', '${emp.role}')" class="text-purple-500 hover:text-purple-700 transition" title="${emp.role === 'admin' ? 'Remove Admin' : 'Make Admin'}">
                                    <i class="fas ${emp.role === 'admin' ? 'fa-user-minus' : 'fa-user-shield'}"></i>
                                </button>
                                <button onclick="EmployeeManager.toggleStatus('${emp.employeeId}')" class="text-amber-500 hover:text-amber-700 transition" title="${emp.status === 'active' ? 'Deactivate' : 'Activate'}">
                                    <i class="fas ${emp.status === 'active' ? 'fa-ban' : 'fa-check-circle'}"></i>
                                </button>
                                <button onclick="EmployeeManager.deleteEmployee('${emp.employeeId}')" class="text-red-500 hover:text-red-700 transition" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
<<<<<<< HEAD
                        <tr>
=======
                        </tr>
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                    `;
                }
            });
        }
        
        const container = document.getElementById('employeeTableContainer');
        if (container) {
<<<<<<< HEAD
=======
            // Different table headers for admin vs regular users
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
            let tableHeaders = '';
            if (isAdmin) {
                tableHeaders = `
                    <thead class="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th class="p-3 text-left">Employee</th>
                            <th class="p-3 text-left">Email</th>
                            <th class="p-3 text-left">Phone</th>
                            <th class="p-3 text-left">Department</th>
                            <th class="p-3 text-left">Position</th>
                            <th class="p-3 text-left">Status</th>
                            <th class="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                `;
            } else {
                tableHeaders = `
                    <thead class="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th class="p-3 text-left">Employee</th>
                            <th class="p-3 text-left">Email</th>
<<<<<<< HEAD
                            <th class="p-3 text-left">Phone</th>
=======
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
                            <th class="p-3 text-left">Department</th>
                            <th class="p-3 text-left">Position</th>
                        </tr>
                    </thead>
                `;
            }
            
            container.innerHTML = `
                <table class="w-full text-sm">
                    ${tableHeaders}
                    <tbody>${empRows}</tbody>
                </table>
            `;
        }
    },

<<<<<<< HEAD
    // Add Employee Modal
=======
    // All other functions remain the same...
>>>>>>> 25df70d17982de3d3f21b2230e9ccce2fcaba527
    async openAddModal() {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        let departments = [];
        try {
            const result = await API.getDepartmentNames();
            departments = result?.data || [];
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
        
        const deptOptions = departments.map(dept => 
            `<option value="${Utils.escapeHtml(dept.name || dept)}">${Utils.escapeHtml(dept.name || dept)}</option>`
        ).join('');
        
        const modalHtml = `
            <div class="p-5">
                <h3 class="font-bold text-lg mb-4">Add New Employee</h3>
                <div class="space-y-3">
                    <input id="newEmpId" placeholder="Employee ID (e.g., EMP010)" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <input id="newFn" placeholder="First name" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <input id="newLn" placeholder="Last name" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <input id="newEmail" placeholder="Email" type="email" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <input id="newPass" placeholder="Password" type="password" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <input id="newPhone" placeholder="Phone" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <select id="newDept" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                        <option value="">Select Department</option>
                        ${deptOptions}
                    </select>
                    <input id="newPos" placeholder="Position" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <div class="flex gap-3 pt-4">
                        <button onclick="EmployeeManager.addEmployee()" class="flex-1 bg-primary-600 text-white py-2 rounded-xl hover:bg-primary-700 transition">Create</button>
                        <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 py-2 rounded-xl hover:bg-gray-300 transition">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        Utils.openModal(modalHtml);
    },

    async addEmployee() {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        const empData = {
            employeeId: document.getElementById('newEmpId').value.trim(),
            firstName: document.getElementById('newFn').value.trim(),
            lastName: document.getElementById('newLn').value.trim(),
            email: document.getElementById('newEmail').value.trim(),
            passwordHash: document.getElementById('newPass').value,
            phone: document.getElementById('newPhone').value.trim(),
            position: document.getElementById('newPos').value.trim(),
            department: document.getElementById('newDept').value,
            role: 'user'
        };
        
        if (!empData.employeeId || !empData.firstName || !empData.lastName || !empData.email || !empData.passwordHash || !empData.position || !empData.department) {
            Utils.showToast('All required fields must be filled', 'warn');
            return;
        }
        
        if (empData.passwordHash.length < 4) {
            Utils.showToast('Password must be at least 4 characters', 'warn');
            return;
        }
        
        try {
            const result = await API.addEmployee(empData);
            if (result.success) {
                Utils.closeModal();
                Utils.showToast('Employee added successfully', 'ok');
                await this.render(App.currentUser);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to add employee', 'err');
        }
    },

    async openEditModal(employeeId) {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        try {
            const result = await API.getEmployee(employeeId);
            const emp = result?.data;
            
            if (!emp) {
                Utils.showToast('Employee not found', 'err');
                return;
            }
            
            let departments = [];
            try {
                const deptResult = await API.getDepartmentNames();
                departments = deptResult?.data || [];
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
            
            const deptOptions = departments.map(dept => 
                `<option value="${Utils.escapeHtml(dept.name || dept)}" ${emp.department === (dept.name || dept) ? 'selected' : ''}>${Utils.escapeHtml(dept.name || dept)}</option>`
            ).join('');
            
            const modalHtml = `
                <div class="p-5">
                    <h3 class="font-bold text-lg mb-4">Edit Employee: ${emp.firstName} ${emp.lastName}</h3>
                    <div class="space-y-3">
                        <div class="text-sm text-gray-500 mb-2">Employee ID: <span class="font-semibold">${emp.employeeId}</span></div>
                        <input id="editFn" value="${emp.firstName || ''}" placeholder="First name" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                        <input id="editLn" value="${emp.lastName || ''}" placeholder="Last name" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                        <input id="editEmail" value="${emp.email || ''}" placeholder="Email" type="email" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                        <input id="editPhone" value="${emp.phone || ''}" placeholder="Phone" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                        <select id="editDept" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                            ${deptOptions}
                        </select>
                        <input id="editPos" value="${emp.position || ''}" placeholder="Position" class="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-200">
                        
                        <div class="border-t pt-3 mt-2">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" id="editIsAdmin" ${emp.role === 'admin' ? 'checked' : ''} class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500">
                                <span class="text-sm font-semibold text-gray-700">Administrator Access</span>
                                <span class="text-xs text-gray-500">(Enable to grant admin privileges)</span>
                            </label>
                        </div>
                        
                        <div class="flex gap-3 pt-4">
                            <button onclick="EmployeeManager.saveEmployee('${employeeId}')" class="flex-1 bg-primary-600 text-white py-2 rounded-xl hover:bg-primary-700 transition">Save Changes</button>
                            <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 py-2 rounded-xl hover:bg-gray-300 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            Utils.openModal(modalHtml);
            
        } catch (error) {
            console.error('Error loading employee:', error);
            Utils.showToast('Error loading employee data: ' + error.message, 'err');
        }
    },

    async saveEmployee(employeeId) {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        const isAdmin = document.getElementById('editIsAdmin')?.checked || false;
        
        const empData = {
            firstName: document.getElementById('editFn').value.trim(),
            lastName: document.getElementById('editLn').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            position: document.getElementById('editPos').value.trim(),
            department: document.getElementById('editDept').value,
            role: isAdmin ? 'admin' : 'user'
        };
        
        if (!empData.firstName || !empData.lastName || !empData.email || !empData.position || !empData.department) {
            Utils.showToast('Please fill all required fields', 'warn');
            return;
        }
        
        try {
            const result = await API.updateEmployee(employeeId, empData);
            if (result.success) {
                Utils.closeModal();
                Utils.showToast('Employee updated successfully', 'ok');
                await this.render(App.currentUser);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to update employee', 'err');
        }
    },

    async toggleRole(employeeId, currentRole) {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const action = newRole === 'admin' ? 'make admin' : 'remove admin privileges';
        
        if (confirm(`Are you sure you want to ${action} this employee?`)) {
            try {
                const result = await API.updateEmployee(employeeId, { role: newRole });
                if (result.success) {
                    Utils.showToast(`Employee ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'} successfully`, 'ok');
                    await this.render(App.currentUser);
                }
            } catch (error) {
                Utils.showToast(error.message || 'Failed to update role', 'err');
            }
        }
    },

    async toggleStatus(employeeId) {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        const emp = this.allEmployees.find(e => e.employeeId === employeeId);
        if (!emp) return;
        
        if (emp.employeeId === App.currentUser?.employeeId) {
            Utils.showToast('Cannot change your own status', 'err');
            return;
        }
        
        const newStatus = emp.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';
        
        if (confirm(`Are you sure you want to ${action} ${emp.firstName} ${emp.lastName}?`)) {
            try {
                const result = await API.updateEmployeeStatus(employeeId, newStatus);
                if (result.success) {
                    Utils.showToast(`Employee ${action}d successfully`, 'ok');
                    await this.render(App.currentUser);
                }
            } catch (error) {
                Utils.showToast(error.message || `Failed to ${action} employee`, 'err');
            }
        }
    },

    async deleteEmployee(employeeId) {
        if (App.currentUser?.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            return;
        }
        
        const emp = this.allEmployees.find(e => e.employeeId === employeeId);
        if (!emp) return;
        
        if (emp.employeeId === App.currentUser?.employeeId) {
            Utils.showToast('Cannot delete your own account', 'err');
            return;
        }
        
        if (emp.role === 'admin') {
            const otherAdmins = this.allEmployees.filter(e => e.role === 'admin' && e.employeeId !== employeeId);
            if (otherAdmins.length === 0) {
                Utils.showToast('Cannot delete the only admin user', 'err');
                return;
            }
        }
        
        if (confirm(`Are you sure you want to delete ${emp.firstName} ${emp.lastName}? This action cannot be undone.`)) {
            try {
                const result = await API.deleteEmployee(employeeId);
                if (result.success) {
                    Utils.showToast('Employee deleted successfully', 'ok');
                    await this.render(App.currentUser);
                }
            } catch (error) {
                Utils.showToast(error.message || 'Failed to delete employee', 'err');
            }
        }
    }
};