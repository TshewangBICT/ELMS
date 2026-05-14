// Utility Functions
const Utils = {
    generateId(prefix) {
        return prefix + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
    },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(dt) {
        if (!dt) return '-';
        return new Date(dt).toLocaleString();
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    },

    showToast(msg, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        const icons = { 
            ok: 'fa-circle-check text-green-500', 
            err: 'fa-circle-exclamation text-red-500', 
            warn: 'fa-triangle-exclamation text-amber-500', 
            info: 'fa-info-circle text-blue-500' 
        };
        
        const borderColors = {
            ok: 'border-green-500',
            err: 'border-red-500',
            warn: 'border-amber-500',
            info: 'border-blue-500'
        };
        
        toast.className = `bg-white border-l-4 ${borderColors[type]} shadow-lg rounded-xl p-3 flex items-center gap-3 min-w-[260px] animate-fade-in`;
        toast.innerHTML = `<i class="fas ${icons[type]} text-lg"></i><span class="text-sm text-gray-700 flex-1">${msg}</span><button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
    },

    togglePassword(fieldId, btn) {
        let inp = document.getElementById(fieldId);
        if (inp) {
            inp.type = inp.type === 'password' ? 'text' : 'password';
            btn.innerHTML = `<i class="far fa-eye${inp.type === 'password' ? '' : '-slash'}"></i>`;
        }
    },

    statusBadge(status) {
        const map = { 
            Approved: 'bg-green-100 text-green-700', 
            Pending: 'bg-yellow-100 text-yellow-700', 
            Cancelled: 'bg-red-100 text-red-700',
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-gray-100 text-gray-700'
        };
        return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}">${status}</span>`;
    },

    statCard(icon, label, value, color) {
        return `
            <div class="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4 hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style="background:${color}20; color:${color}">
                    <i class="fas ${icon}"></i>
                </div>
                <div>
                    <div class="text-2xl font-bold">${value}</div>
                    <div class="text-xs text-gray-500">${label}</div>
                </div>
            </div>
        `;
    },

    openModal(html) {
        let modal = document.getElementById('globalModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'globalModal';
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 pointer-events-none transition-all';
            modal.innerHTML = '<div id="modalBody" class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform scale-95 transition-all max-h-[90vh] overflow-auto"></div>';
            document.body.appendChild(modal);
        }
        document.getElementById('modalBody').innerHTML = html;
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');
    },

    closeModal() {
        const modal = document.getElementById('globalModal');
        if (modal) {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.classList.remove('opacity-100', 'pointer-events-auto');
        }
    },

    closeMobileSidebar() {
        const sidebar = document.getElementById('mainSidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.add('hidden');
    }
};

// Leave Types Configuration
const LEAVE_TYPES = [
    "Casual Leave", "Earned Leave", "Maternity Leave", 
    "Paternity Leave", "Study Leave", "Extra Ordinary Leave", "Bereavement Leave"
];

const DEFAULT_LEAVE_BALANCES = {
    "Casual Leave": 12,
    "Earned Leave": 15,
    "Maternity Leave": 90,
    "Paternity Leave": 15,
    "Study Leave": 10,
    "Extra Ordinary Leave": 5,
    "Bereavement Leave": 5
};