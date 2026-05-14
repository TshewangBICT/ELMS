// Department Management Module
const DepartmentManager = {
    async render(user) {
        console.log('DepartmentManager.render called');
        
        if (user.role !== 'admin') {
            Utils.showToast('Access denied. Admin only.', 'err');
            App.navigateTo('dashboard');
            return;
        }
        
        try {
            const result = await API.getAllDepartments();
            const departments = result?.data || [];
            
            let tableRows = '';
            if (departments.length === 0) {
                tableRows = '<tr><td colspan="3" class="text-center p-8 text-gray-400">No departments. Click "New Department" to add.</td></tr>';
            } else {
                for (const dept of departments) {
                    const empCount = dept.employeeCount || 0;
                    const isProtected = dept.name === 'Information Technology';
                    tableRows += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-3 font-medium">
                                <i class="fas fa-building text-primary-500 mr-2"></i>
                                ${Utils.escapeHtml(dept.name)}
                                ${isProtected ? '<span class="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Default</span>' : ''}
                            </td>
                            <td class="p-3">
                                <span class="bg-gray-100 px-2 py-1 rounded-full text-xs">
                                    <i class="fas fa-users text-gray-500"></i> ${empCount} employees
                                </span>
                            </td>
                            <td class="p-3">
                                <button onclick="DepartmentManager.openEditModal(${dept.id}, '${dept.name.replace(/'/g, "\\'")}')" 
                                        class="text-blue-500 hover:text-blue-700 mr-3 transition">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                ${!isProtected ? 
                                    `<button onclick="DepartmentManager.deleteDepartment(${dept.id}, '${dept.name.replace(/'/g, "\\'")}')" 
                                            class="text-red-500 hover:text-red-700 transition">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>` : 
                                    `<span class="text-gray-400"><i class="fas fa-lock"></i> Protected</span>`
                                }
                            </td>
                        </tr>
                    `;
                }
            }
            
            const html = `
                <div class="bg-white rounded-2xl shadow-sm p-6 animate-fade-in">
                    <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h3 class="font-bold text-2xl flex items-center gap-2">
                                <i class="fas fa-building text-primary-600"></i>
                                Manage Departments
                            </h3>
                            <p class="text-sm text-gray-500 mt-1">Add, edit, or remove departments. Changes affect employee department options.</p>
                        </div>
                        <button onclick="DepartmentManager.openAddModal()" 
                                class="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2">
                            <i class="fas fa-plus-circle"></i> New Department
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 border-b-2">
                                <tr>
                                    <th class="p-3 text-left">Department Name</th>
                                    <th class="p-3 text-left">Employees</th>
                                    <th class="p-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div class="flex gap-2 text-amber-700 text-sm">
                            <i class="fas fa-info-circle mt-0.5"></i>
                            <div>
                                <strong>Note:</strong> Deleting a department moves employees to "Other". 
                                "Information Technology" is protected and cannot be deleted.
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('mainContent').innerHTML = html;
        } catch (error) {
            console.error('Error loading departments:', error);
            Utils.showToast('Error loading departments', 'err');
        }
    },
    
    openAddModal() {
        const modalHtml = `
            <div class="p-6">
                <h3 class="font-bold text-xl mb-4 flex items-center gap-2">
                    <i class="fas fa-plus-circle text-primary-600"></i>
                    Add New Department
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-2">Department Name</label>
                        <input type="text" id="newDeptName" 
                               class="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400" 
                               placeholder="e.g., Research & Development, Sales, Legal"
                               autocomplete="off">
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button onclick="DepartmentManager.addDepartment()" 
                                class="flex-1 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-medium">
                            <i class="fas fa-save"></i> Create Department
                        </button>
                        <button onclick="Utils.closeModal()" 
                                class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-medium">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        Utils.openModal(modalHtml);
        setTimeout(() => {
            const input = document.getElementById('newDeptName');
            if (input) input.focus();
        }, 100);
    },
    
    async addDepartment() {
        const newDept = document.getElementById('newDeptName').value.trim();
        
        if (!newDept) {
            Utils.showToast('Department name cannot be empty', 'warn');
            return;
        }
        
        try {
            const result = await API.addDepartment(newDept);
            if (result.success) {
                Utils.closeModal();
                Utils.showToast(`Department "${newDept}" created successfully`, 'ok');
                await this.render(App.currentUser);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to create department', 'err');
        }
    },
    
    openEditModal(id, oldName) {
        const modalHtml = `
            <div class="p-6">
                <h3 class="font-bold text-xl mb-4 flex items-center gap-2">
                    <i class="fas fa-edit text-primary-600"></i>
                    Edit Department
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-2">Current Name</label>
                        <input type="text" value="${Utils.escapeHtml(oldName)}" disabled 
                               class="w-full border bg-gray-100 p-3 rounded-xl text-gray-500">
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-2">New Name</label>
                        <input type="text" id="editDeptName" 
                               class="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400" 
                               placeholder="Enter new department name"
                               value="${Utils.escapeHtml(oldName)}"
                               autocomplete="off">
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button onclick="DepartmentManager.updateDepartment(${id})" 
                                class="flex-1 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition font-medium">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button onclick="Utils.closeModal()" 
                                class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-medium">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        Utils.openModal(modalHtml);
        setTimeout(() => {
            const input = document.getElementById('editDeptName');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    },
    
    async updateDepartment(id) {
        const newName = document.getElementById('editDeptName').value.trim();
        
        if (!newName) {
            Utils.showToast('New department name cannot be empty', 'warn');
            return;
        }
        
        try {
            const result = await API.updateDepartment(id, newName);
            if (result.success) {
                Utils.closeModal();
                Utils.showToast(`Department renamed successfully`, 'ok');
                await this.render(App.currentUser);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to update department', 'err');
        }
    },
    
    async deleteDepartment(id, deptName) {
        if (deptName === 'Information Technology') {
            Utils.showToast('Cannot delete the default Information Technology department', 'warn');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete department "${deptName}"?`)) return;
        
        try {
            const result = await API.deleteDepartment(id);
            if (result.success) {
                Utils.showToast(`Department "${deptName}" deleted successfully`, 'ok');
                await this.render(App.currentUser);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to delete department', 'err');
        }
    }
};

window.DepartmentManager = DepartmentManager;