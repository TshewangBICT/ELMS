// Notifications Module - No Auto Toast Notifications
const Notifications = {
    async render(user) {
        console.log('Notifications.render called for user:', user);
        
        if (!user) {
            Utils.showToast('User data not available', 'err');
            App.navigateTo('dashboard');
            return;
        }
        
        document.getElementById('mainContent').innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                    <p class="mt-2 text-gray-500">Loading notifications...</p>
                </div>
            </div>
        `;
        
        try {
            const result = await API.getNotifications();
            let notifications = result?.data || [];
            
            await App.updateNotificationBadges();
            
            let notificationsHtml = '';
            let unreadCount = 0;
            
            if (notifications.length === 0) {
                notificationsHtml = `
                    <div class="text-center py-12">
                        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <i class="fas fa-bell-slash text-3xl text-gray-400"></i>
                        </div>
                        <h4 class="text-lg font-semibold text-gray-700 mb-1">No Notifications</h4>
                        <p class="text-gray-400 text-sm">You're all caught up!</p>
                    </div>
                `;
            } else {
                const sortedNotifications = [...notifications].sort((a, b) => {
                    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
                    return 0;
                });
                
                notificationsHtml = sortedNotifications.map(notif => {
                    if (!notif.isRead) unreadCount++;
                    
                    let iconClass = 'fa-info-circle';
                    let bgColor = 'bg-blue-50';
                    let textColor = 'text-blue-600';
                    
                    if (notif.type === 'ok' || notif.type === 'approved') {
                        iconClass = 'fa-check-circle';
                        bgColor = 'bg-green-50';
                        textColor = 'text-green-600';
                    } else if (notif.type === 'err' || notif.type === 'cancelled' || notif.type === 'rejected') {
                        iconClass = 'fa-exclamation-circle';
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-600';
                    }
                    
                    const unreadClass = !notif.isRead ? `${bgColor} border-l-4 border-blue-400` : 'hover:bg-gray-50';
                    const unreadBadge = !notif.isRead ? '<span class="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>' : '';
                    
                    let cleanMessage = notif.message || '';
                    cleanMessage = cleanMessage.replace(/T\d{2}:\d{2}:\d{2}Z?/g, '');
                    cleanMessage = cleanMessage.replace(/T00:00:00/g, '');
                    
                    return `
                        <div class="notification-item border-b border-gray-100 p-4 transition-all duration-200 cursor-pointer ${unreadClass}" 
                             data-id="${notif.id}" 
                             data-read="${notif.isRead}"
                             onclick="Notifications.markAsReadAndView(${notif.id}, this)">
                            <div class="flex gap-3">
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 rounded-full ${bgColor} flex items-center justify-center">
                                        <i class="fas ${iconClass} ${textColor} text-lg"></i>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center flex-wrap gap-2">
                                        <p class="text-sm text-gray-800 flex-1">${Utils.escapeHtml(cleanMessage)}</p>
                                        ${unreadBadge}
                                    </div>
                                </div>
                                <div class="flex-shrink-0">
                                    <button onclick="event.stopPropagation(); Notifications.deleteNotification(${notif.id})" 
                                            class="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                                            title="Delete">
                                        <i class="fas fa-trash-alt text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            const html = `
                <div class="bg-white rounded-2xl shadow-sm animate-fade-in overflow-hidden">
                    <div class="border-b border-gray-200 p-5 bg-gradient-to-r from-gray-50 to-white">
                        <div class="flex justify-between items-center flex-wrap gap-3">
                            <div>
                                <h3 class="font-bold text-xl flex items-center gap-2">
                                    <i class="fas fa-bell text-primary-600"></i>
                                    Notifications
                                    ${unreadCount > 0 ? `<span class="unread-badge bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">${unreadCount} new</span>` : ''}
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">Stay updated with your leave requests and approvals</p>
                            </div>
                            <div class="flex gap-2">
                                ${notifications.length > 0 && unreadCount > 0 ? `
                                    <button onclick="Notifications.markAllAsRead()" 
                                            class="mark-all-read-btn px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 transition bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1">
                                        <i class="fas fa-check-double text-xs"></i>
                                        <span>Mark all read</span>
                                    </button>
                                ` : ''}
                                ${notifications.length > 0 ? `
                                    <button onclick="Notifications.deleteAllNotifications()" 
                                            class="clear-all-btn px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1">
                                        <i class="fas fa-trash-alt text-xs"></i>
                                        <span>Clear all</span>
                                    </button>
                                ` : ''}
                                <button onclick="Notifications.refreshNotifications()" 
                                        class="refresh-btn px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1">
                                    <i class="fas fa-sync-alt text-xs"></i>
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="notifications-list divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                        ${notificationsHtml}
                    </div>
                    
                    ${notifications.length > 0 ? `
                        <div class="footer-stats border-t border-gray-100 p-3 bg-gray-50 text-center">
                            <p class="text-xs text-gray-400">
                                <i class="far fa-bell mr-1"></i>
                                ${unreadCount} unread • ${notifications.length - unreadCount} read
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Notifications</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="Notifications.refreshNotifications()" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Try Again</button>
                </div>
            `;
        }
    },
    
    async refreshNotifications() {
        Utils.showToast('Refreshing notifications...', 'info');
        await this.render(App.currentUser);
        await App.updateNotificationBadges();
        Utils.showToast('Notifications refreshed', 'ok');
    },
    
    async markAsReadAndView(id, element) {
        if (element && element.getAttribute('data-read') === 'true') {
            return;
        }
        
        element.style.opacity = '0.6';
        
        try {
            const result = await API.markAsRead(id);
            
            if (result.success) {
                if (element) {
                    element.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-400', 'bg-green-50', 'border-green-400', 'bg-red-50', 'border-red-400');
                    element.classList.add('bg-white');
                    
                    const dotSpan = element.querySelector('.inline-block.w-2.h-2');
                    if (dotSpan) dotSpan.remove();
                    
                    element.setAttribute('data-read', 'true');
                }
                
                await App.updateNotificationBadges();
                await this.updateUnreadCount();
                Utils.showToast('Marked as read', 'ok');
            } else {
                Utils.showToast(result.error || 'Failed to mark as read', 'err');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            Utils.showToast('Failed to mark as read', 'err');
        } finally {
            element.style.opacity = '1';
        }
    },
    
    async updateUnreadCount() {
        try {
            const result = await API.getUnreadCount();
            const unreadCount = result?.unread || 0;
            
            const headerBadge = document.querySelector('.unread-badge');
            if (headerBadge) {
                if (unreadCount > 0) {
                    headerBadge.textContent = `${unreadCount} new`;
                } else {
                    headerBadge.remove();
                }
            }
            
            const markAllBtn = document.querySelector('.mark-all-read-btn');
            if (unreadCount === 0 && markAllBtn) {
                markAllBtn.remove();
            }
            
            const totalItems = document.querySelectorAll('.notification-item').length;
            const footerStats = document.querySelector('.footer-stats');
            if (footerStats && totalItems > 0) {
                footerStats.innerHTML = `
                    <p class="text-xs text-gray-400">
                        <i class="far fa-bell mr-1"></i>
                        ${unreadCount} unread • ${totalItems - unreadCount} read
                    </p>
                `;
            }
            
            await App.updateNotificationBadges();
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    },
    
    async markAllAsRead() {
        const unreadCount = document.querySelectorAll('.notification-item[data-read="false"]').length;
        if (unreadCount === 0) {
            Utils.showToast('No unread notifications', 'info');
            return;
        }
        
        if (!confirm(`Mark ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read?`)) return;
        
        const markAllBtn = document.querySelector('.mark-all-read-btn');
        const originalText = markAllBtn?.innerHTML;
        if (markAllBtn) {
            markAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Processing...';
            markAllBtn.disabled = true;
        }
        
        try {
            const result = await API.markAllAsRead();
            
            if (result.success) {
                const notificationItems = document.querySelectorAll('.notification-item');
                notificationItems.forEach(item => {
                    item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-400', 'bg-green-50', 'border-green-400', 'bg-red-50', 'border-red-400');
                    item.classList.add('bg-white');
                    
                    const dotSpan = item.querySelector('.inline-block.w-2.h-2');
                    if (dotSpan) dotSpan.remove();
                    
                    item.setAttribute('data-read', 'true');
                });
                
                const headerBadge = document.querySelector('.unread-badge');
                if (headerBadge) headerBadge.remove();
                
                if (markAllBtn) markAllBtn.remove();
                
                const totalItems = document.querySelectorAll('.notification-item').length;
                const footerStats = document.querySelector('.footer-stats');
                if (footerStats) {
                    footerStats.innerHTML = `
                        <p class="text-xs text-gray-400">
                            <i class="far fa-bell mr-1"></i>
                            0 unread • ${totalItems} read
                        </p>
                    `;
                }
                
                await App.updateNotificationBadges();
                Utils.showToast('All notifications marked as read', 'ok');
            } else {
                Utils.showToast(result.error || 'Failed to mark all as read', 'err');
                if (markAllBtn) {
                    markAllBtn.innerHTML = originalText;
                    markAllBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            Utils.showToast('Failed to mark all as read', 'err');
            if (markAllBtn) {
                markAllBtn.innerHTML = originalText;
                markAllBtn.disabled = false;
            }
        }
    },
    
    async deleteNotification(id) {
        if (!confirm('Delete this notification?')) return;
        
        try {
            const result = await API.deleteNotification(id);
            
            if (result.success) {
                const element = document.querySelector(`.notification-item[data-id="${id}"]`);
                if (element) {
                    const wasUnread = element.getAttribute('data-read') === 'false';
                    element.remove();
                    
                    if (wasUnread) {
                        await this.updateUnreadCount();
                        await App.updateNotificationBadges();
                    }
                }
                
                Utils.showToast('Notification deleted', 'ok');
                
                if (document.querySelectorAll('.notification-item').length === 0) {
                    await this.render(App.currentUser);
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            Utils.showToast('Failed to delete notification', 'err');
        }
    },
    
    async deleteAllNotifications() {
        const count = document.querySelectorAll('.notification-item').length;
        if (count === 0) {
            Utils.showToast('No notifications to delete', 'info');
            return;
        }
        
        if (!confirm(`Delete ALL ${count} notifications?`)) return;
        
        try {
            const result = await API.deleteAllNotifications();
            
            if (result.success) {
                Utils.showToast('All notifications deleted', 'ok');
                await this.render(App.currentUser);
                await App.updateNotificationBadges();
            }
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            Utils.showToast('Failed to delete notifications', 'err');
        }
    }
};