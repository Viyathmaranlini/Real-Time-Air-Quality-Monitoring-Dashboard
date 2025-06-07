const API_BASE = 'http://127.0.0.1:8000/api'; // Laravel API base URL

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Login successful!');

        // ✅ Redirect based on role
        if (data.user.role === 'admin') {
          window.location.href = 'admin/admin-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Error logging in.');
      console.error(err);
    }
  });
}

// Handle Registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Registration successful!');

        // ✅ Redirect based on role
        if (data.user.role === 'admin') {
          window.location.href = 'admin/admin-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Error during registration.');
      console.error(err);
    }
  });
}