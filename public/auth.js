// Check if user is logged in
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/protected', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Update UI for logged-in user
            const authOption = document.getElementById('authOption');
            authOption.innerHTML = `
                <div class="user-menu">
                    <span>${user.username}</span>
                    <button onclick="logout()" class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;

            // Enable all booking buttons when logged in
            const bookButtons = document.querySelectorAll('.book-btn');
            bookButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });

            // Store user data in localStorage for client-side access
            localStorage.setItem('userProfile', JSON.stringify({
                id: user.id,
                username: user.username,
                userType: user.userType
            }));
        } else {
            // User is not logged in
            const authOption = document.getElementById('authOption');
            authOption.innerHTML = '<a href="signin.html">Log In</a>';

            // Disable booking buttons when not logged in
            const bookButtons = document.querySelectorAll('.book-btn');
            bookButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.7';
                btn.style.cursor = 'not-allowed';
                btn.onclick = function(e) {
                    e.preventDefault();
                    alert('Please log in to book a service');
                    window.location.href = 'signin.html';
                };
            });

            // Clear any stored user data
            localStorage.removeItem('userProfile');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

// Update navigation menu
function updateNavigation(isLoggedIn) {
    const navItems = document.querySelectorAll('.nav-bar ul li a');
    navItems.forEach(item => {
        if (item.getAttribute('data-auth-required') === 'true') {
            item.style.display = isLoggedIn ? 'block' : 'none';
        }
    });
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            localStorage.removeItem('userProfile');
            window.location.href = 'index.html';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Handle login form submission
async function handleLogin(username, password) {
    try {
        const response = await fetch('/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data
            localStorage.setItem('userProfile', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Export functions for use in other files
window.handleLogin = handleLogin;
window.logout = logout;
window.checkAuthStatus = checkAuthStatus; 