// Profile Management Module
const Profile = {
    render(user) {
        console.log('Profile render called with user:', user);
        
        if (!user) {
            Utils.showToast('User data not available', 'err');
            App.navigateTo('dashboard');
            return;
        }
        
        const profilePicUrl = user.profilePic || null;
        
        const avatarHtml = profilePicUrl ? 
            `<img src="${profilePicUrl}" class="w-28 h-28 rounded-full object-cover shadow-md border-4 border-primary-200">` : 
            `<div class="w-28 h-28 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 text-white flex items-center justify-center text-4xl font-bold border-4 border-primary-200 shadow-md">
                ${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}
            </div>`;
        
        const html = `
            <div class="bg-white rounded-2xl p-6 max-w-3xl mx-auto animate-fade-in shadow-sm">
                <div class="flex flex-col items-center border-b pb-6 mb-6">
                    <div class="relative group mb-4">
                        ${avatarHtml}
                        <button onclick="Profile.openEditModal()" 
                                class="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1.5 text-white shadow-md hover:bg-primary-700 transition">
                            <i class="fas fa-camera text-xs"></i>
                        </button>
                    </div>
                    <h2 class="text-xl font-bold text-gray-800">${user.firstName || ''} ${user.lastName || ''}</h2>
                    <p class="text-sm text-gray-500 mt-1">Employee ID: ${user.employeeId || user.id || 'N/A'}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <label class="text-xs text-gray-500 uppercase font-semibold tracking-wide">EMAIL</label>
                        <p class="text-sm text-gray-800 mt-1 break-all">${user.email || '-'}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <label class="text-xs text-gray-500 uppercase font-semibold tracking-wide">PHONE</label>
                        <p class="text-sm text-gray-800 mt-1">${user.phone || '-'}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <label class="text-xs text-gray-500 uppercase font-semibold tracking-wide">DEPARTMENT</label>
                        <p class="text-sm text-gray-800 mt-1">${user.department || '-'}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <label class="text-xs text-gray-500 uppercase font-semibold tracking-wide">POSITION</label>
                        <p class="text-sm text-gray-800 mt-1">${user.position || '-'}</p>
                    </div>
                </div>
                
                <div class="mt-8 pt-4 border-t text-center">
                    <button onclick="Profile.openEditModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition shadow-sm">
                        <i class="fas fa-edit mr-2"></i> Edit Profile
                    </button>
                </div>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = html;
    },

    openEditModal() {
        const u = App.currentUser;
        if (!u) return;
        
        const currentPic = u.profilePic || '';
        
        const previewHtml = currentPic ? 
            `<img id="modalPreviewImg" src="${currentPic}" class="w-28 h-28 rounded-full object-cover border-4 border-primary-200">` : 
            `<div id="modalPreviewImg" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-dashed">
                <i class="fas fa-camera text-4xl"></i>
            </div>`;
        
        const modalHtml = `
            <div class="p-6">
                <h3 class="font-bold text-xl mb-4">Edit Profile</h3>
                
                <!-- Profile Picture Section -->
                <div class="flex flex-col items-center mb-6">
                    <div class="relative cursor-pointer group" onclick="document.getElementById('modalPicInput').click()">
                        <div id="modalPreviewContainer">${previewHtml}</div>
                        <div class="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1.5 text-white shadow-md">
                            <i class="fas fa-camera text-xs"></i>
                        </div>
                    </div>
                    <input type="file" id="modalPicInput" accept="image/*" class="hidden" onchange="Profile.previewImage(event)">
                    <p class="text-xs text-gray-400 mt-2">Click camera icon to change photo</p>
                </div>
                
                <!-- Form Fields -->
                <div class="space-y-4">
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Employee ID</label>
                        <input type="text" value="${u.employeeId || u.id || 'N/A'}" disabled class="w-full border bg-gray-100 p-2.5 rounded-lg">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm font-semibold text-gray-700 block mb-1">First Name</label>
                            <input id="editFirstName" value="${this.escapeHtml(u.firstName || '')}" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-700 block mb-1">Last Name</label>
                            <input id="editLastName" value="${this.escapeHtml(u.lastName || '')}" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Email</label>
                        <input id="editEmail" value="${u.email || ''}" type="email" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                    </div>
                    
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Phone</label>
                        <input id="editPhone" value="${u.phone || ''}" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm font-semibold text-gray-700 block mb-1">Department</label>
                            <select id="editDepartment" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white">
                                <option value="">Loading departments...</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-700 block mb-1">Position</label>
                            <input id="editPosition" value="${this.escapeHtml(u.position || '')}" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex gap-3 mt-6 pt-4 border-t">
                    <button onclick="Profile.saveProfile()" class="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition">
                        <i class="fas fa-save mr-2"></i> Save Changes
                    </button>
                    <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        Utils.openModal(modalHtml);
        this.loadDepartmentsForEdit(u.department);
    },
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    },
    
    async loadDepartmentsForEdit(selectedDept) {
        console.log('Loading departments...');
        
        try {
            const response = await fetch('http://localhost:8080/departments/names', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            console.log('Departments API response:', result);
            
            const departments = result?.data || [];
            console.log('Departments list:', departments);
            
            const deptSelect = document.getElementById('editDepartment');
            if (deptSelect) {
                if (departments.length === 0) {
                    deptSelect.innerHTML = '<option value="">No departments available</option>';
                } else {
                    let options = '<option value="">Select Department</option>';
                    for (const dept of departments) {
                        const deptName = typeof dept === 'string' ? dept : dept.name;
                        const selected = (selectedDept === deptName) ? 'selected' : '';
                        options += `<option value="${deptName}" ${selected}>${deptName}</option>`;
                    }
                    deptSelect.innerHTML = options;
                    console.log('Department dropdown populated');
                }
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            const deptSelect = document.getElementById('editDepartment');
            if (deptSelect) {
                deptSelect.innerHTML = '<option value="">Error loading departments</option>';
            }
        }
    },

    previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                Utils.showToast('Please select an image file', 'warn');
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                Utils.showToast('Image size should be less than 2MB', 'warn');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const container = document.getElementById('modalPreviewContainer');
                if (container) {
                    container.innerHTML = `<img id="modalPreviewImg" src="${e.target.result}" class="w-28 h-28 rounded-full object-cover border-4 border-primary-200">`;
                    window.tempProfilePic = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    },

    async saveProfile() {
        const newFirstName = document.getElementById('editFirstName').value.trim();
        const newLastName = document.getElementById('editLastName').value.trim();
        const newEmail = document.getElementById('editEmail').value.trim();
        const newPhone = document.getElementById('editPhone').value.trim();
        const newDepartment = document.getElementById('editDepartment').value;
        const newPosition = document.getElementById('editPosition').value.trim();
        
        if (!newFirstName || !newLastName || !newEmail || !newDepartment || !newPosition) {
            Utils.showToast('Please fill all required fields', 'warn');
            return;
        }
        
        const updateData = {
            firstName: newFirstName,
            lastName: newLastName,
            email: newEmail,
            phone: newPhone,
            department: newDepartment,
            position: newPosition
        };
        
        console.log('Sending update data:', updateData);
        
        try {
            const employeeId = App.currentUser.employeeId || App.currentUser.id;
            
            const response = await fetch(`http://localhost:8080/employee/${employeeId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Update failed');
            }
            
            const result = await response.json();
            
            if (result && result.success) {
                // Update local user object
                App.currentUser.firstName = newFirstName;
                App.currentUser.lastName = newLastName;
                App.currentUser.email = newEmail;
                App.currentUser.phone = newPhone;
                App.currentUser.department = newDepartment;
                App.currentUser.position = newPosition;
                
                // Update profile picture if changed
                if (window.tempProfilePic) {
                    const picResponse = await fetch(`http://localhost:8080/employee/${employeeId}/profile-pic`, {
                        method: 'PUT',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ profilePic: window.tempProfilePic })
                    });
                    
                    if (picResponse.ok) {
                        const picResult = await picResponse.json();
                        if (picResult && picResult.success) {
                            App.currentUser.profilePic = window.tempProfilePic;
                            window.tempProfilePic = null;
                        }
                    }
                }
                
                Utils.showToast('Profile updated successfully!', 'ok');
                Utils.closeModal();
                
                // Re-render profile and update sidebar immediately
                this.render(App.currentUser);
                
                // Force sidebar profile update
                if (typeof MainLayout !== 'undefined') {
                    MainLayout.updateSidebarProfile();
                }
                
            } else {
                Utils.showToast(result?.error || 'Failed to update profile', 'err');
            }
        } catch (error) {
            console.error('Save profile error:', error);
            Utils.showToast(error.message || 'Failed to update profile', 'err');
        }
    },

    changePassword() {
        const html = `
            <div class="bg-white p-6 max-w-md rounded-2xl shadow-md mx-auto animate-fade-in">
                <h2 class="font-bold text-xl mb-4"><i class="fas fa-lock text-primary-600"></i> Change Password</h2>
                <div class="space-y-4">
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Current Password</label>
                        <input type="password" id="oldP" class="w-full border p-2.5 rounded-lg">
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">New Password (min 4)</label>
                        <input type="password" id="newP" class="w-full border p-2.5 rounded-lg">
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Confirm New Password</label>
                        <input type="password" id="confP" class="w-full border p-2.5 rounded-lg">
                    </div>
                    <button onclick="Profile.updatePassword()" class="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition shadow-md">
                        <i class="fas fa-save"></i> Update Password
                    </button>
                </div>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = html;
    },

    async updatePassword() {
        const oldPassword = document.getElementById('oldP').value;
        const newPassword = document.getElementById('newP').value;
        const confirmPassword = document.getElementById('confP').value;
        
        if (!oldPassword || !newPassword) {
            Utils.showToast('Please fill all fields', 'warn');
            return;
        }
        
        if (newPassword.length < 4) {
            Utils.showToast('New password must be at least 4 characters', 'warn');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Utils.showToast('New passwords do not match', 'err');
            return;
        }
        
        try {
            const result = await API.changePassword(oldPassword, newPassword);
            if (result.success) {
                Utils.showToast('Password changed successfully', 'ok');
                App.navigateTo('profile');
            } else {
                Utils.showToast(result.error || 'Failed to change password', 'err');
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to change password', 'err');
        }
    }
};