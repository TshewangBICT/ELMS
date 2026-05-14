// Authentication Module
const LoginPage = {
    render() {
        return `
            <div class="min-h-screen flex flex-col">
                <header class="unified-header-footer py-4 px-6 shadow-lg">
                    <div class="max-w-7xl mx-auto">
                        <div class="grid grid-cols-3 items-center">
                            <div class="flex justify-start">
                                <div class="w-12 h-12 rounded-full overflow-hidden shadow-lg bg-white flex items-center justify-center">
                                    <img src="assets/images/logo1.png" alt="Logo" class="w-full h-full object-cover" onerror="this.style.display='none'">
                                </div>
                            </div>
                            <div class="text-center">
                                <h1 class="text-white text-xl font-bold tracking-wide">Employee Leave Management System</h1>
                            </div>
                            <div class="flex justify-end">
                                <div class="w-12"></div>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="flex-1 flex items-center justify-center px-4 py-12">
                    <div class="w-full max-w-md mx-auto">
                        <!-- Login/Register Container -->
                        <div id="authContainer" class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
                            <div class="bg-gradient-to-r from-elms-navy to-primary-800 px-6 py-5 text-center">
                                <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white text-2xl mb-2 border border-white/30">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                                <h2 class="text-white text-xl font-bold">Welcome to ELMS</h2>
                            </div>
                            
                            <div class="flex border-b border-gray-200">
                                <button id="tabLoginBtn" class="flex-1 py-3.5 text-sm font-semibold transition-all text-primary-600 border-b-2 border-primary-600 bg-gray-50/40">Login</button>
                                <button id="tabRegBtn" class="flex-1 py-3.5 text-sm font-semibold transition-all text-gray-500 border-b-2 border-transparent">Register</button>
                            </div>

                            <!-- Login Form -->
                            <div id="loginForm" class="p-8">
                                <div class="space-y-5">
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">EMAIL ADDRESS</label>
                                        <input type="email" id="loginEmail" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" placeholder="admin@elms.com">
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">PASSWORD</label>
                                        <div class="relative">
                                            <input type="password" id="loginPass" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" placeholder="••••••">
                                            <button type="button" onclick="Utils.togglePassword('loginPass', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <i class="far fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <button onclick="LoginPage.handleLogin()" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                                        <i class="fas fa-sign-in-alt"></i> Sign in
                                    </button>
                                    <div class="text-center">
                                        <a href="#" onclick="LoginPage.showForgotPassword()" class="text-sm text-primary-600 hover:text-primary-800 hover:underline transition">
                                            Forgot your password?
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Register Form -->
                            <div id="registerForm" class="p-8 hidden">
                                <div class="space-y-4">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-xs font-semibold text-gray-600 block mb-1">First name</label>
                                            <input id="regFname" class="w-full px-3 py-2 border rounded-xl">
                                        </div>
                                        <div>
                                            <label class="text-xs font-semibold text-gray-600 block mb-1">Last name</label>
                                            <input id="regLname" class="w-full px-3 py-2 border rounded-xl">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 block mb-1">Employee ID</label>
                                        <input id="regEmployeeId" class="w-full px-3 py-2 border rounded-xl" placeholder="e.g., EMP010">
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                                        <input id="regEmail" type="email" class="w-full px-3 py-2 border rounded-xl">
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 block mb-1">Password (min 4)</label>
                                        <div class="relative">
                                            <input id="regPass" type="password" class="w-full px-3 py-2 border rounded-xl">
                                            <button type="button" onclick="Utils.togglePassword('regPass', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <i class="far fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 block mb-1">Confirm Password</label>
                                        <div class="relative">
                                            <input id="regConfirmPass" type="password" class="w-full px-3 py-2 border rounded-xl">
                                            <button type="button" onclick="Utils.togglePassword('regConfirmPass', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <i class="far fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-xs font-semibold text-gray-600 block mb-1">Department</label>
                                            <select id="regDept" class="w-full px-3 py-2 border rounded-xl bg-white">
                                                <option value="">Select</option>
                                                <option>Information Technology</option>
                                                <option>Human Resources</option>
                                                <option>Finance</option>
                                                <option>Operations</option>
                                                <option>Marketing</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-xs font-semibold text-gray-600 block mb-1">Position</label>
                                            <input id="regPos" class="w-full px-3 py-2 border rounded-xl">
                                        </div>
                                    </div>
                                    <button onclick="LoginPage.handleRegister()" class="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2">
                                        <i class="fas fa-user-plus"></i> Register
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Forgot Password Container (hidden by default) -->
                        <div id="forgotPasswordContainer" class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in hidden">
                            <div class="bg-gradient-to-r from-elms-navy to-primary-800 px-6 py-5 text-center">
                                <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white text-2xl mb-2 border border-white/30">
                                    <i class="fas fa-key"></i>
                                </div>
                                <h2 class="text-white text-xl font-bold">Reset Password</h2>
                            </div>
                            
                            <div class="p-8">
                                <div class="space-y-5">
                                    <div>
                                        <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">EMAIL ADDRESS</label>
                                        <input type="email" id="resetEmail" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" placeholder="Enter your registered email">
                                    </div>
                                    <button onclick="LoginPage.sendResetLink()" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                                        <i class="fas fa-paper-plane"></i> Send Reset Link
                                    </button>
                                    <div class="text-center">
                                        <a href="#" onclick="LoginPage.backToLogin()" class="text-sm text-primary-600 hover:text-primary-800 hover:underline transition">
                                            <i class="fas fa-arrow-left"></i> Back to Login
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer class="unified-header-footer py-6 px-6 mt-auto">
    <div class="max-w-7xl mx-auto">
        <div class="flex flex-col lg:flex-row justify-between items-center gap-5">
            <!-- Left Section - Copyright -->
            <div class="text-center lg:text-left order-3 lg:order-1">
                <p class="text-white/70 text-xs tracking-wide">
                    <i class="far fa-copyright mr-1"></i> 2025 Employee Leave Management System. All rights reserved.
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
        `;
    },

    attachEvents() {
        document.getElementById('tabLoginBtn')?.addEventListener('click', () => this.switchTab('login'));
        document.getElementById('tabRegBtn')?.addEventListener('click', () => this.switchTab('register'));
    },

    switchTab(tab) {
        const isLogin = tab === 'login';
        document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
        document.getElementById('registerForm').classList.toggle('hidden', isLogin);
        
        const loginBtn = document.getElementById('tabLoginBtn');
        const regBtn = document.getElementById('tabRegBtn');
        
        if (isLogin) {
            loginBtn.className = 'flex-1 py-3.5 text-sm font-semibold text-primary-600 border-b-2 border-primary-600 bg-gray-50/40';
            regBtn.className = 'flex-1 py-3.5 text-sm font-semibold text-gray-500 border-b-2 border-transparent';
        } else {
            loginBtn.className = 'flex-1 py-3.5 text-sm font-semibold text-gray-500 border-b-2 border-transparent';
            regBtn.className = 'flex-1 py-3.5 text-sm font-semibold text-primary-600 border-b-2 border-primary-600 bg-gray-50/40';
        }
    },

    showForgotPassword() {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('forgotPasswordContainer').classList.remove('hidden');
    },

    backToLogin() {
        document.getElementById('forgotPasswordContainer').classList.add('hidden');
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('resetEmail').value = '';
    },

    async sendResetLink() {
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            Utils.showToast('Please enter your email address', 'warn');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8080/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            
            if (result.success) {
                Utils.showToast('Password reset link sent to your email!', 'ok');
                setTimeout(() => {
                    this.backToLogin();
                }, 2000);
            } else {
                Utils.showToast(result.error || 'Email not found', 'err');
            }
        } catch (error) {
            Utils.showToast('Failed to send reset link', 'err');
        }
    },

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;
        
        if (!email || !password) {
            Utils.showToast('Please enter email and password', 'warn');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const employeeId = result.data.employeeId;
                let profilePic = null;
                
                try {
                    const empResponse = await fetch(`http://localhost:8080/employee/${employeeId}`, {
                        credentials: 'include'
                    });
                    const empResult = await empResponse.json();
                    if (empResult.success && empResult.data) {
                        profilePic = empResult.data.profilePic || empResult.data.profile_pic;
                    }
                } catch (err) {
                    console.error('Error fetching profile pic:', err);
                }
                
                App.currentUser = {
                    ...result.data,
                    profilePic: profilePic || result.data.profilePic || null
                };
                
                Utils.showToast(`Welcome ${result.data.firstName}!`, 'ok');
                App.loadApp();
            } else {
                Utils.showToast(result.error || 'Login failed', 'err');
            }
        } catch (error) {
            Utils.showToast('Login failed: ' + error.message, 'err');
        }
    },

    async handleRegister() {
        const firstName = document.getElementById('regFname').value.trim();
        const lastName = document.getElementById('regLname').value.trim();
        const employeeId = document.getElementById('regEmployeeId').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;
        const confirmPassword = document.getElementById('regConfirmPass').value;
        const department = document.getElementById('regDept').value;
        const position = document.getElementById('regPos').value.trim();
        
        if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword || !department || !position) {
            Utils.showToast('All fields are required', 'warn');
            return;
        }
        
        if (password.length < 4) {
            Utils.showToast('Password must be at least 4 characters', 'warn');
            return;
        }
        
        if (password !== confirmPassword) {
            Utils.showToast('Passwords do not match', 'warn');
            return;
        }
        
        const registerData = {
            employeeId: employeeId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            department: department,
            position: position,
            phone: "",
            dob: ""
        };
        
        try {
            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(registerData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                Utils.showToast('Registration successful! Please login.', 'ok');
                
                document.getElementById('regFname').value = '';
                document.getElementById('regLname').value = '';
                document.getElementById('regEmployeeId').value = '';
                document.getElementById('regEmail').value = '';
                document.getElementById('regPass').value = '';
                document.getElementById('regConfirmPass').value = '';
                document.getElementById('regDept').value = '';
                document.getElementById('regPos').value = '';
                
                this.switchTab('login');
                document.getElementById('loginEmail').value = email;
            } else {
                Utils.showToast(result.error || 'Registration failed', 'err');
            }
        } catch (error) {
            Utils.showToast('Registration failed: ' + error.message, 'err');
        }
    }
};