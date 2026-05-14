// Leave Management Module
const Leave = {
    async apply(user) {
        // Show loading
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading leave balance...</p>
                </div>
            </div>
        `;
        
        try {
            // Fetch leave balance from API
            const balanceResult = await API.getLeaveBalance();
            const balance = balanceResult?.data;
            
            // Get leave options with remaining balance
            const leaveOptions = LEAVE_TYPES.map(type => {
                let remaining = 0;
                switch(type) {
                    case 'Casual Leave': remaining = balance?.casualLeaveRemaining || 0; break;
                    case 'Earned Leave': remaining = balance?.earnedLeaveRemaining || 0; break;
                    case 'Maternity Leave': remaining = balance?.maternityLeaveRemaining || 0; break;
                    case 'Paternity Leave': remaining = balance?.paternityLeaveRemaining || 0; break;
                    case 'Study Leave': remaining = balance?.studyLeaveRemaining || 0; break;
                    case 'Extra Ordinary Leave': remaining = balance?.extraOrdinaryLeaveRemaining || 0; break;
                    case 'Bereavement Leave': remaining = balance?.bereavementLeaveRemaining || 0; break;
                    default: remaining = 0;
                }
                const isDisabled = remaining <= 0;
                
                return `<option value="${type}" ${isDisabled ? 'disabled style="color: #9ca3af; background-color: #f3f4f6;"' : ''}>
                            ${type} (${remaining} days left)
                        </option>`;
            }).join('');
            
            const hasAnyBalance = LEAVE_TYPES.some(type => {
                let remaining = 0;
                switch(type) {
                    case 'Casual Leave': remaining = balance?.casualLeaveRemaining || 0; break;
                    case 'Earned Leave': remaining = balance?.earnedLeaveRemaining || 0; break;
                    case 'Maternity Leave': remaining = balance?.maternityLeaveRemaining || 0; break;
                    case 'Paternity Leave': remaining = balance?.paternityLeaveRemaining || 0; break;
                    case 'Study Leave': remaining = balance?.studyLeaveRemaining || 0; break;
                    case 'Extra Ordinary Leave': remaining = balance?.extraOrdinaryLeaveRemaining || 0; break;
                    case 'Bereavement Leave': remaining = balance?.bereavementLeaveRemaining || 0; break;
                    default: remaining = 0;
                }
                return remaining > 0;
            });
            
            const noBalanceWarning = !hasAnyBalance ? `
                <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <div class="flex items-center gap-2 text-red-700">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="text-sm font-semibold">No Leave Balance Available</span>
                    </div>
                    <p class="text-xs text-red-600 mt-1">You don't have any leave balance remaining. Please contact HR for assistance.</p>
                </div>
            ` : '';
            
            const html = `
                <div class="bg-white p-6 max-w-lg rounded-2xl shadow-md mx-auto animate-fade-in">
                    <h3 class="font-bold text-xl mb-4">
                        <i class="fas fa-calendar-plus text-primary-600"></i> Apply for Leave
                    </h3>
                    ${noBalanceWarning}
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-semibold text-gray-700">Leave Type</label>
                            <select id="type" class="w-full border p-2.5 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary-200" ${!hasAnyBalance ? 'disabled' : ''}>
                                ${leaveOptions}
                            </select>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-700">Duration Type</label>
                            <div class="flex gap-3 mt-2">
                                <label class="flex items-center gap-2 border rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="duration" value="full" checked> Full Day
                                </label>
                                <label class="flex items-center gap-2 border rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="duration" value="half"> Half Day
                                </label>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-700">Start Date</label>
                            <input type="date" id="startDate" class="w-full border p-2.5 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary-200">
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-700">End Date</label>
                            <input type="date" id="endDate" class="w-full border p-2.5 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary-200">
                            <p class="text-xs text-gray-400 mt-1">For single day leave, set same date for start and end</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-700">Reason</label>
                            <textarea id="reason" rows="4" placeholder="Please provide reason for leave..." class="border p-2.5 rounded-xl w-full mt-1 focus:outline-none focus:ring-2 focus:ring-primary-200"></textarea>
                        </div>
                        <button onclick="Leave.submit()" class="bg-primary-600 text-white w-full py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition shadow-md ${!hasAnyBalance ? 'opacity-50 cursor-not-allowed' : ''}" ${!hasAnyBalance ? 'disabled' : ''}>
                            <i class="fas fa-paper-plane"></i> Submit Request
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading leave form:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Leave Form</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="Leave.apply(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },

    submit() {
        // Get values with correct IDs
        const typeEl = document.getElementById('type');
        const durationRadio = document.querySelector('input[name="duration"]:checked');
        const startDateEl = document.getElementById('startDate');
        const endDateEl = document.getElementById('endDate');
        const reasonEl = document.getElementById('reason');
        
        // Check if elements exist
        if (!typeEl || !startDateEl || !endDateEl || !reasonEl) {
            Utils.showToast('Form elements not found. Please refresh the page.', 'err');
            return;
        }
        
        const type = typeEl.value;
        const durationType = durationRadio ? durationRadio.value : 'full';
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;
        const reason = reasonEl.value.trim();
        
        // Validation
        if (!startDate) {
            Utils.showToast('Please select start date', 'warn');
            return;
        }
        
        if (!endDate) {
            Utils.showToast('Please select end date', 'warn');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            Utils.showToast('End date must be after start date', 'err');
            return;
        }
        
        if (!reason) {
            Utils.showToast('Please provide a reason', 'warn');
            return;
        }
        
        // Show loading state on button
        const submitBtn = document.querySelector('#mainContent button');
        const originalText = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
        }
        
        const leaveData = {
            leaveType: type,
            durationType: durationType,
            fromDate: startDate,
            toDate: endDate,
            reason: reason
        };
        
        console.log('Submitting leave request:', leaveData);
        
        // Use fetch directly to avoid any API issues
        fetch('http://localhost:8080/leave/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(leaveData)
        })
        .then(response => response.json())
        .then(result => {
            console.log('Leave submission response:', result);
            
            if (result.success) {
                Utils.showToast('Leave request submitted successfully!', 'ok');
                setTimeout(() => {
                    App.navigateTo('myLeaves');
                }, 1500);
            } else {
                Utils.showToast(result.error || 'Failed to submit leave request', 'err');
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Leave submission error:', error);
            Utils.showToast(error.message || 'Failed to submit leave request', 'err');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    },

    async myLeaves(user) {
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading leave history...</p>
                </div>
            </div>
        `;
        
        try {
            const result = await API.getMyLeaves();
            const leaves = result?.data || [];
            
            if (leaves.length === 0) {
                document.getElementById('mainContent').innerHTML = `
                    <div class="bg-white rounded-2xl p-8 text-center">
                        <i class="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">No Leave Records</h3>
                        <p class="text-gray-500">You haven't submitted any leave requests yet.</p>
                        <button onclick="App.navigateTo('applyLeave')" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Apply for Leave</button>
                    </div>
                `;
                return;
            }
            
            let rows = '';
            for (const l of leaves) {
                const dateRange = l.fromDate === l.toDate 
                    ? Utils.formatDate(l.fromDate)
                    : `${Utils.formatDate(l.fromDate)} → ${Utils.formatDate(l.toDate)}`;
                
                const cancelButton = l.status === 'pending' 
                    ? `<button onclick="Leave.cancelLeave('${l.id}')" class="text-red-500 hover:text-red-700 transition" title="Cancel Request">
                            <i class="fas fa-times-circle"></i> Cancel
                       </button>`
                    : '-';
                
                rows += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3">${l.leaveType}${l.durationType === 'half' ? ' (Half)' : ''}</td>
                        <td class="p-3">${dateRange}</td>
                        <td class="p-3">${l.days} day(s)</td>
                        <td class="p-3">${Utils.statusBadge(l.status)}</td>
                        <td class="p-3 max-w-xs truncate" title="${Utils.escapeHtml(l.reason)}">${Utils.escapeHtml(l.reason.substring(0, 50))}${l.reason.length > 50 ? '...' : ''}</td>
                        <td class="p-3">${cancelButton}</td>
                    </tr>
                `;
            }
            
            const html = `
                <div class="bg-white rounded-2xl p-5 animate-fade-in">
                    <h3 class="font-bold text-xl mb-4">My Leave History</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="p-3 text-left">Leave Type</th>
                                    <th class="p-3 text-left">Date Range</th>
                                    <th class="p-3 text-left">Days</th>
                                    <th class="p-3 text-left">Status</th>
                                    <th class="p-3 text-left">Reason</th>
                                    <th class="p-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading leaves:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Leave History</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="Leave.myLeaves(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },

    async balance(user) {
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading leave balance...</p>
                </div>
            </div>
        `;
        
        try {
            const result = await API.getLeaveBalance();
            const balance = result?.data;
            
            if (!balance) {
                document.getElementById('mainContent').innerHTML = `
                    <div class="bg-white rounded-2xl p-8 text-center">
                        <i class="fas fa-chart-pie text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">No Balance Data</h3>
                        <p class="text-gray-500">Unable to load leave balance.</p>
                        <button onclick="Leave.balance(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                    </div>
                `;
                return;
            }
            
            const leaveTypes = [
                { name: 'Casual Leave', remaining: balance.casualLeaveRemaining || 0 },
                { name: 'Earned Leave', remaining: balance.earnedLeaveRemaining || 0 },
                { name: 'Maternity Leave', remaining: balance.maternityLeaveRemaining || 0 },
                { name: 'Paternity Leave', remaining: balance.paternityLeaveRemaining || 0 },
                { name: 'Study Leave', remaining: balance.studyLeaveRemaining || 0 },
                { name: 'Extra Ordinary Leave', remaining: balance.extraOrdinaryLeaveRemaining || 0 },
                { name: 'Bereavement Leave', remaining: balance.bereavementLeaveRemaining || 0 }
            ];
            
            let html = '<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">';
            
            for (const type of leaveTypes) {
                html += `
                    <div class="bg-white p-6 rounded-2xl text-center shadow-sm border hover:shadow-md transition">
                        <div class="text-4xl font-bold text-primary-600">${type.remaining}</div>
                        <div class="font-medium text-gray-800 mt-2">${type.name}</div>
                    </div>
                `;
            }
            
            html += `</div>`;
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading balance:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Leave Balance</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="Leave.balance(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },

    async colleaguesOnLeave(user) {
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading colleagues on leave...</p>
                </div>
            </div>
        `;
        
        try {
            const result = await API.getColleaguesOnLeave();
            const onLeave = result?.data || [];
            
            if (onLeave.length === 0) {
                document.getElementById('mainContent').innerHTML = `
                    <div class="bg-white rounded-2xl p-8 text-center">
                        <i class="fas fa-smile-wink text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">No employees on leave today</p>
                        <p class="text-xs text-gray-400 mt-2">Check back another day!</p>
                    </div>
                `;
                return;
            }
            
            let listHtml = `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th class="p-4 text-left font-semibold text-gray-600">Employee</th>
                                <th class="p-4 text-left font-semibold text-gray-600">Department</th>
                                <th class="p-4 text-left font-semibold text-gray-600">Leave Type</th>
                                <th class="p-4 text-left font-semibold text-gray-600">Duration</th>
                                <th class="p-4 text-left font-semibold text-gray-600">Date Range</th>
                                <th class="p-4 text-left font-semibold text-gray-600">Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${onLeave.map(l => `
                                <tr class="border-b">
                                    <td class="p-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm">
                                                <i class="fas fa-user"></i>
                                            </div>
                                            <div class="font-medium text-gray-800">${l.employeeName || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td class="p-4">${l.department || 'N/A'}</td>
                                    <td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">${l.leaveType}</span></td>
                                    <td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-medium ${l.durationType === 'half' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">${l.durationType === 'half' ? 'Half Day' : 'Full Day'}</span></td>
                                    <td class="p-4 text-gray-600"><i class="fas fa-calendar-alt text-gray-400 mr-1 text-xs"></i> ${Utils.formatDate(l.fromDate)} → ${Utils.formatDate(l.toDate)}</td>
                                    <td class="p-4"><span class="font-semibold text-gray-700">${l.days}</span> <span class="text-xs text-gray-400">day(s)</span></td>
                                 </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            const html = `
                <div class="bg-white rounded-2xl shadow-sm animate-fade-in overflow-hidden">
                    <div class="border-b border-gray-200 p-5 bg-gradient-to-r from-blue-50 to-white">
                        <div class="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h3 class="font-bold text-xl text-gray-800">
                                    <i class="fas fa-calendar-day text-blue-500 mr-2"></i>
                                    Employees on Leave Today
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div class="bg-blue-100 rounded-full px-4 py-2">
                                <span class="text-sm font-semibold text-blue-700">
                                    <i class="fas fa-users mr-1"></i>
                                    Total: ${onLeave.length} employee(s) on leave
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="p-0">${listHtml}</div>
                </div>
            `;
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading colleagues:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="Leave.colleaguesOnLeave(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },

    async openEditModal(leaveId) {
    try {
        const result = await API.getMyLeaves();
        const leaves = result?.data || [];
        const leave = leaves.find(l => l.id === leaveId);
        
        if (!leave) {
            Utils.showToast('Leave request not found', 'err');
            return;
        }
        
        if (leave.status !== 'pending') {
            Utils.showToast('Only pending leave requests can be edited', 'warn');
            return;
        }
        
        const balanceResult = await API.getLeaveBalance();
        const balance = balanceResult?.data;
        
        const leaveOptions = LEAVE_TYPES.map(type => {
            let remaining = 0;
            switch(type) {
                case 'Casual Leave': remaining = balance?.casualLeaveRemaining || 0; break;
                case 'Earned Leave': remaining = balance?.earnedLeaveRemaining || 0; break;
                case 'Maternity Leave': remaining = balance?.maternityLeaveRemaining || 0; break;
                case 'Paternity Leave': remaining = balance?.paternityLeaveRemaining || 0; break;
                case 'Study Leave': remaining = balance?.studyLeaveRemaining || 0; break;
                case 'Extra Ordinary Leave': remaining = balance?.extraOrdinaryLeaveRemaining || 0; break;
                case 'Bereavement Leave': remaining = balance?.bereavementLeaveRemaining || 0; break;
                default: remaining = 0;
            }
            const isDisabled = remaining <= 0 && type !== leave.leaveType;
            const selected = type === leave.leaveType ? 'selected' : '';
            
            return `<option value="${type}" ${selected} ${isDisabled ? 'disabled style="color: #9ca3af; background-color: #f3f4f6;"' : ''}>
                        ${type} (${remaining} days left)
                    </option>`;
        }).join('');
        
        const modalHtml = `
            <div class="p-6">
                <h3 class="font-bold text-xl mb-4 flex items-center gap-2">
                    <i class="fas fa-edit text-primary-600"></i>
                    Edit Leave Request
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Leave Type</label>
                        <select id="editLeaveType" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                            ${leaveOptions}
                        </select>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Duration Type</label>
                        <div class="flex gap-3">
                            <label class="flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="editDuration" value="full" ${leave.durationType === 'full' ? 'checked' : ''}> Full Day
                            </label>
                            <label class="flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="editDuration" value="half" ${leave.durationType === 'half' ? 'checked' : ''}> Half Day
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Start Date</label>
                        <input type="date" id="editStartDate" value="${leave.fromDate}" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">End Date</label>
                        <input type="date" id="editEndDate" value="${leave.toDate}" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-700 block mb-1">Reason</label>
                        <textarea id="editReason" rows="4" class="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200">${Utils.escapeHtml(leave.reason)}</textarea>
                    </div>
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div class="flex items-center gap-2 text-yellow-700 text-sm">
                            <i class="fas fa-info-circle"></i>
                            <span>Current days: ${leave.days} day(s)</span>
                        </div>
                        <p class="text-xs text-yellow-600 mt-1">Changing dates will recalculate the number of days</p>
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button onclick="Leave.updateLeave(${leave.id})" 
                                class="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button onclick="Utils.closeModal()" 
                                class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Utils.openModal(modalHtml);
        
    } catch (error) {
        console.error('Error loading leave for edit:', error);
        Utils.showToast('Error loading leave details', 'err');
    }
},

async updateLeave(leaveId) {
    const leaveType = document.getElementById('editLeaveType').value;
    const durationRadio = document.querySelector('input[name="editDuration"]:checked');
    const durationType = durationRadio ? durationRadio.value : 'full';
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    const reason = document.getElementById('editReason').value.trim();
    
    if (!startDate || !endDate) {
        Utils.showToast('Please select both start and end dates', 'warn');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        Utils.showToast('End date must be after start date', 'err');
        return;
    }
    
    if (!reason) {
        Utils.showToast('Please provide a reason', 'warn');
        return;
    }
    
    let days = 0;
    if (durationType === 'half') {
        days = 0.5;
    } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const updateData = {
        leaveType: leaveType,
        durationType: durationType,
        fromDate: startDate,
        toDate: endDate,
        reason: reason,
        days: days
    };
    
    try {
        const response = await fetch(`http://localhost:8080/leave/${leaveId}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            Utils.closeModal();
            Utils.showToast('Leave request updated successfully', 'ok');
            await this.myLeaves(App.currentUser);
        } else {
            Utils.showToast(result.error || 'Failed to update leave request', 'err');
        }
    } catch (error) {
        console.error('Error updating leave:', error);
        Utils.showToast(error.message || 'Failed to update leave request', 'err');
    }
},

    async cancelLeave(leaveId) {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;
        
        try {
            const result = await API.cancelLeave(leaveId);
            if (result.success) {
                Utils.showToast('Leave request cancelled successfully', 'ok');
                await this.myLeaves(App.currentUser);
            } else {
                Utils.showToast(result.error || 'Failed to cancel leave', 'err');
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to cancel leave', 'err');
        }
    }
};