// Notifications Module
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
            console.log('Notifications response:', result);
            
            let notifications = result?.data || [];
            
            await App.updateNotificationBadges();
            
            let notificationsHtml = '';
            let unreadCount = 0;
            
            if (notifications.length === 0) {
                notificationsHtml = `
                    <div class="text-center py-12">
                        <i class="fas fa-bell-slash text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-400">No notifications yet</p>
                    </div>
                `;
            } else {
                notificationsHtml = notifications.map(notif => {
                    if (!notif.isRead) unreadCount++;
                    
                    let iconClass = 'fa-info-circle text-blue-500';
                    if (notif.type === 'ok' || notif.type === 'approved') {
                        iconClass = 'fa-check-circle text-green-500';
                    } else if (notif.type === 'err' || notif.type === 'cancelled') {
                        iconClass = 'fa-exclamation-circle text-red-500';
                    }
                    
                    const unreadClass = !notif.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : '';
                    const unreadDot = !notif.isRead ? '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>' : '';
                    
                    return `
                        <div class="notification-item border-b border-gray-100 p-4 hover:bg-gray-50 transition group cursor-pointer ${unreadClass}" 
                             data-id="${notif.id}" 
                             data-read="${notif.isRead}"
                             onclick="Notifications.markAsReadAndView(${notif.id}, this)">
                            <div class="flex gap-3">
                                <div class="flex-shrink-0">
                                    <i class="fas ${iconClass} text-lg"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <p class="text-sm text-gray-800 flex-1">${Utils.escapeHtml(notif.message)}</p>
                                        ${unreadDot}
                                    </div>
                                    <p class="text-xs text-gray-400 mt-1">${Utils.formatDateTime(notif.createdAt)}</p>
                                </div>
                                <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                                    <button onclick="event.stopPropagation(); Notifications.deleteNotification(${notif.id})" 
                                            class="text-gray-400 hover:text-red-500 transition p-1" title="Delete">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            const html = `
                <div class="bg-white rounded-2xl shadow-sm animate-fade-in">
                    <div class="border-b p-5 flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-xl">
                                <i class="fas fa-bell text-primary-600 mr-2"></i>
                                Notifications
                            </h3>
                            <p class="text-sm text-gray-500 mt-1">
                                ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}
                                ${unreadCount > 0 ? `<span class="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">${unreadCount} unread</span>` : ''}
                            </p>
                        </div>
                        <div class="flex gap-3">
                            ${notifications.length > 0 && unreadCount > 0 ? `
                                <button onclick="Notifications.markAllAsRead()" 
                                        class="text-sm text-blue-500 hover:text-blue-700 transition">
                                    <i class="fas fa-check-double mr-1"></i> Mark All Read
                                </button>
                            ` : ''}
                            ${notifications.length > 0 ? `
                                <button onclick="Notifications.deleteAllNotifications()" 
                                        class="text-sm text-red-500 hover:text-red-700 transition">
                                    <i class="fas fa-trash-alt mr-1"></i> Delete All
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        ${notificationsHtml}
                    </div>
                </div>
            `;
            
            document.getElementById('mainContent').innerHTML = html;
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="bg-white rounded-2xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error Loading Notifications</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="Notifications.render(App.currentUser)" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">Retry</button>
                </div>
            `;
        }
    },
    
    async markAsReadAndView(id, element) {
        try {
            const result = await API.markAsRead(id);
            
            if (result.success) {
                if (element) {
                    element.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
                    const dotSpan = element.querySelector('.inline-block.w-2.h-2');
                    if (dotSpan) dotSpan.remove();
                    element.setAttribute('data-read', 'true');
                }
                
                await this.updateUnreadCount();
                await App.updateNotificationBadges();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },
    
    async updateUnreadCount() {
        const unreadItems = document.querySelectorAll('.notification-item[data-read="false"]');
        const unreadCount = unreadItems.length;
        
        const unreadSpan = document.querySelector('.bg-blue-500.text-white.text-xs');
        if (unreadSpan) {
            if (unreadCount > 0) {
                unreadSpan.textContent = `${unreadCount} unread`;
            } else {
                unreadSpan.remove();
            }
        }
        
        const markAllBtn = document.querySelector('button[onclick*="markAllAsRead"]');
        if (unreadCount === 0 && markAllBtn) {
            markAllBtn.remove();
        }
    },
    
    async markAllAsRead() {
        try {
            const result = await API.markAllAsRead();
            
            if (result.success) {
                const notificationItems = document.querySelectorAll('.notification-item');
                notificationItems.forEach(item => {
                    item.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500');
                    const dotSpan = item.querySelector('.inline-block.w-2.h-2');
                    if (dotSpan) dotSpan.remove();
                    item.setAttribute('data-read', 'true');
                });
                
                const unreadSpan = document.querySelector('.bg-blue-500.text-white.text-xs');
                if (unreadSpan) unreadSpan.remove();
                
                const markAllBtn = document.querySelector('button[onclick*="markAllAsRead"]');
                if (markAllBtn) markAllBtn.remove();
                
                await App.updateNotificationBadges();
                Utils.showToast('All notifications marked as read', 'ok');
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to mark all as read', 'err');
        }
    },
    
    async deleteNotification(id) {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        try {
            const result = await API.deleteNotification(id);
            if (result.success) {
                const notificationElement = document.querySelector(`.notification-item[data-id="${id}"]`);
                if (notificationElement) {
                    const wasUnread = notificationElement.getAttribute('data-read') === 'false';
                    notificationElement.remove();
                    
                    if (wasUnread) {
                        await this.updateUnreadCount();
                        await App.updateNotificationBadges();
                    }
                }
                
                Utils.showToast('Notification deleted', 'ok');
                
                const remainingNotifications = document.querySelectorAll('.notification-item');
                if (remainingNotifications.length === 0) {
                    await this.render(App.currentUser);
                }
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to delete notification', 'err');
        }
    },
    
    async deleteAllNotifications() {
        if (!confirm('Are you sure you want to delete all notifications?')) return;
        
        try {
            const result = await API.deleteAllNotifications();
            if (result.success) {
                Utils.showToast('All notifications deleted', 'ok');
                await this.render(App.currentUser);
            }
        } catch (error) {
            Utils.showToast(error.message || 'Failed to delete notifications', 'err');
        }
    }
};