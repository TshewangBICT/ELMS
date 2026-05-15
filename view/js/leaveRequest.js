// Leave Requests Module (Admin)
const LeaveRequests = {
    async render() {
        console.log('LeaveRequests.render called');
        
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading leave requests...</p>
                </div>
            </div>
        `;
        
        try {
            const result = await API.getPendingLeaves();
            console.log('Pending leaves response:', result);
            
            const leaves = result?.data || [];
            const currentUserId = App.currentUser?.employeeId;
            
            if (leaves.length === 0) {
                document.getElementById('mainContent').innerHTML = `
                    <div class="bg-white rounded-2xl shadow-sm p-8 text-center">
                        <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">No Pending Requests</h3>
                        <p class="text-gray-500">All leave requests have been processed.</p>
                    </div>
                `;
                return;
            }
            
            let html = `
                <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div class="border-b p-5 bg-gradient-to-r from-blue-50 to-white">
                        <h2 class="font-bold text-xl flex items-center gap-2">
                            <i class="fas fa-clipboard-list text-primary-600"></i>
                            Pending Leave Approvals
                        </h2>
                        <p class="text-sm text-gray-500 mt-1">${leaves.length} request(s) awaiting your action</p>
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
                                        <span class="text-gray-400 text-xs" title="You cannot approve your own leave request">
                                            <i class="fas fa-lock"></i> Cannot self-approve
                                        </span>
                                    ` : `
                                        <div class="flex gap-2">
                                            <button onclick="LeaveRequests.approve(${leave.id})" 
                                                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition">
                                                <i class="fas fa-check"></i> Approve
                                            </button>
                                            <button onclick="LeaveRequests.reject(${leave.id})" 
                                                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition">
                                                <i class="fas fa-times"></i> Reject
                                            </button>
                                        </div>
                                    `;
                                    
                                    return `
                                    <tr class="border-b hover:bg-gray-50 ${isSelf ? 'bg-amber-50' : ''}">
                                        <td class="p-4 font-medium">
                                            ${leave.employeeName || 'N/A'}
                                            ${isSelf ? '<span class="ml-2 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">You</span>' : ''}
                                            <div class="text-xs text-gray-400">${leave.employeeId || ''}</div>
                                        </td>
                                        <td class="p-4">${leave.department || 'N/A'}</td>
                                        <td class="p-4">
                                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                ${leave.leaveType}
                                            </span>
                                        </td>
                                        <td class="p-4">${Utils.formatDate(leave.fromDate)}</td>
                                        <td class="p-4">${Utils.formatDate(leave.toDate)}</td>
                                        <td class="p-4">${leave.days}</td>
                                        <td class="p-4 max-w-xs truncate" title="${leave.reason}">${leave.reason}</td>
                                        <td class="p-4">${actionButtons}</td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading leave requests:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="LeaveRequests.render()" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },
    
    async approve(leaveId) {
        console.log('Approving leave:', leaveId);
        
        try {
            const result = await API.approveLeave(leaveId, 'approved');
            console.log('Approve response:', result);
            
            if (result.success) {
                Utils.showToast('Leave request approved successfully!', 'ok');
                await this.render();
                App.updateNotificationBadges();
            } else {
                Utils.showToast(result.error || 'Failed to approve leave', 'err');
            }
        } catch (error) {
            console.error('Error approving leave:', error);
            Utils.showToast(error.message || 'Failed to approve leave', 'err');
        }
    },
    
    async reject(leaveId) {
        console.log('Rejecting leave:', leaveId);
        
        if (!confirm('Are you sure you want to reject this leave request?')) return;
        
        try {
            // IMPORTANT: Use 'cancelled' instead of 'rejected' for backend
            const result = await API.approveLeave(leaveId, 'cancelled');
            console.log('Reject response:', result);
            
            if (result.success) {
                Utils.showToast('Leave request rejected successfully', 'ok');
                await this.render();
                App.updateNotificationBadges();
            } else {
                Utils.showToast(result.error || 'Failed to reject leave', 'err');
            }
        } catch (error) {
            console.error('Error rejecting leave:', error);
            Utils.showToast(error.message || 'Failed to reject leave', 'err');
        }
    }
};