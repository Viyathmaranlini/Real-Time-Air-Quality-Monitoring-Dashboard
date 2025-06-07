const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '../login.html';
}

// ------------------- Logout -------------------
document.getElementById('adminLogout')?.addEventListener('click', () => {
  fetch('http://127.0.0.1:8000/api/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  });
});

// ------------------- Dashboard Stats -------------------
function loadDashboardStats() {
  Promise.all([
    fetch('http://127.0.0.1:8000/api/admin/users/count', { headers: { Authorization: `Bearer ${token}` }}),
    fetch('http://127.0.0.1:8000/api/admin/sensors/count', { headers: { Authorization: `Bearer ${token}` }}),
    fetch('http://127.0.0.1:8000/api/admin/alerts/count', { headers: { Authorization: `Bearer ${token}` }}),
    fetch('http://127.0.0.1:8000/api/admin/aqi/high-events', { headers: { Authorization: `Bearer ${token}` }})
  ])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([userCount, sensorCount, alertCount, highAQI]) => {
    document.getElementById('totalUsers').textContent = userCount.total || 0;
    document.getElementById('totalSensors').textContent = sensorCount.total || 0;
    document.getElementById('totalAlerts').textContent = alertCount.total || 0;
    document.getElementById('highAqiEvents').textContent = highAQI.total || 0;
  });

  // AQI Chart
  fetch('http://127.0.0.1:8000/api/aqi-data?sensor_id=1&from=2025-04-01&to=2025-04-11', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const ctx = document.getElementById('aqiChart')?.getContext('2d');
      if (!ctx) return;

      const labels = data.map(d => new Date(d.recorded_at).toLocaleDateString());
      const values = data.map(d => d.aqi_value);

      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'AQI Over Time',
            data: values,
            borderColor: '#2d89ef',
            backgroundColor: 'rgba(45,137,239,0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }},
          scales: {
            y: { beginAtZero: true },
            x: { title: { display: true, text: 'Date' }}
          }
        }
      });
    });
}

// ------------------- Load Users -------------------
function loadAdminUsers() {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
  
    fetch('http://127.0.0.1:8000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(users => {
        tableBody.innerHTML = '';
        users.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role === 'admin' ? 'Admin' : 'User'}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
              <button class="edit-btn" onclick='editUser(${JSON.stringify(user)})'>Edit</button>
              <button class="delete-btn" onclick='deleteUser(${user.id})'>Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(err => console.error('Failed to load users:', err));
  }
  
  // ------------------- Add/Edit/Delete User -------------------
  document.getElementById('addUserBtn')?.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add User';
    document.getElementById('userId').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = 'user';
    document.getElementById('userModal').classList.remove('hidden');
  });
  
  function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
  }
  
  document.getElementById('userForm')?.addEventListener('submit', e => {
    e.preventDefault();
  
    const id = document.getElementById('userId').value;
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
  
    const url = id
      ? `http://127.0.0.1:8000/api/admin/users/${id}`
      : 'http://127.0.0.1:8000/api/admin/users';
    const method = id ? 'PUT' : 'POST';
  
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password, role }),
    })
      .then(res => res.json())
      .then(() => {
        closeUserModal();
        loadAdminUsers();
      });
  });
  
  function editUser(user) {
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = user.role || 'user';
    document.getElementById('userModal').classList.remove('hidden');
  }
  
  function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
  
    fetch(`http://127.0.0.1:8000/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => loadAdminUsers());
  }

// ------------------- Load Sensors -------------------
function loadSensors(filter = '') {
    const tbody = document.getElementById('sensorTableBody');
    if (!tbody) return;
  
    fetch('http://127.0.0.1:8000/api/admin/sensors', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(sensors => {
        window.allSensors = sensors;
        displaySensors(sensors, filter);
      });
  }
  
  function displaySensors(sensors, filter = '') {
    const tbody = document.getElementById('sensorTableBody');
    tbody.innerHTML = '';
  
    const searchText = filter.toLowerCase();
    const filtered = sensors.filter(s =>
      s.name.toLowerCase().includes(searchText) ||
      (s.location_description || '').toLowerCase().includes(searchText)
    );
  
    filtered.forEach(sensor => {
      const status = sensor.status === 'active' ? 'Online' : 'Offline';
      const statusClass = sensor.status === 'active' ? 'success' : 'danger';
      const aqiStatus = getAQIStatus(sensor.latest_aqi ?? 0);
  
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${sensor.id}</td>
        <td>${sensor.name}</td>
        <td>${sensor.latitude}</td>
        <td>${sensor.longitude}</td>
        <td>${sensor.location_description || '—'}</td>
        <td><span class="badge ${statusClass}">${status}</span></td>
        <td><span class="badge aqi">${aqiStatus}</span></td>
        <td>
          <button class="edit-btn" onclick='editSensor(${JSON.stringify(sensor)})'>Edit</button>
          <button class="delete-btn" onclick='deleteSensor(${sensor.id})'>Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  function getAQIStatus(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Very Unhealthy';
    return 'Hazardous';
  }
  
  // ------------------- Search Filter -------------------
  document.getElementById('sensorSearch')?.addEventListener('input', e => {
    loadSensors(e.target.value);
  });
    
    // Open Add Sensor Modal
    document.getElementById('addSensorBtn')?.addEventListener('click', () => {
        document.getElementById('sensorForm').reset();
        document.getElementById('sensorId').value = '';
        document.getElementById('sensorModalTitle').textContent = 'Add Sensor';
        document.getElementById('sensorModal').classList.remove('hidden');
    });
    
    // Close Modal
    function closeSensorModal() {
        document.getElementById('sensorModal').classList.add('hidden');
    }
    
    // Save Sensor
    document.getElementById('sensorForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('sensorId').value;
        const payload = {
        name: document.getElementById('sensorName').value,
        location_description: document.getElementById('sensorLocation').value,
        latitude: parseFloat(document.getElementById('sensorLat').value),
        longitude: parseFloat(document.getElementById('sensorLng').value),
        };
    
        const url = id
        ? `http://127.0.0.1:8000/api/admin/sensors/${id}`
        : 'http://127.0.0.1:8000/api/admin/sensors';
    
        fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        }).then(() => {
        closeSensorModal();
        loadSensors();
        });
    });
    
    // Edit Sensor
    function editSensor(sensor) {
        document.getElementById('sensorId').value = sensor.id;
        document.getElementById('sensorName').value = sensor.name;
        document.getElementById('sensorLat').value = sensor.latitude;
        document.getElementById('sensorLng').value = sensor.longitude;
        document.getElementById('sensorLocation').value = sensor.location_description;
        document.getElementById('sensorModalTitle').textContent = 'Edit Sensor';
        document.getElementById('sensorModal').classList.remove('hidden');
    }
    
    // Delete Sensor
    function deleteSensor(id) {
        if (!confirm('Delete this sensor?')) return;
    
        fetch(`http://127.0.0.1:8000/api/admin/sensors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
        }).then(() => loadSensors());
    }
    
    // Filters
    document.getElementById('sensorSearch')?.addEventListener('input', () => {
        displaySensors(window.allSensors || []);
    });
    document.getElementById('statusFilter')?.addEventListener('change', () => {
        displaySensors(window.allSensors || []);
    });

    // ------------------- Load Logs -------------------
function loadLogs() {
    const logTableBody = document.getElementById('logTableBody');
    const typeFilter = document.getElementById('logTypeFilter')?.value.toLowerCase();
    const dateFilter = document.getElementById('logDateFilter')?.value;
  
    fetch('http://127.0.0.1:8000/api/admin/logs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(logs => {
        logTableBody.innerHTML = '';
  
        const filteredLogs = logs.filter(log => {
          const matchType = !typeFilter || log.type.toLowerCase().includes(typeFilter);
          const matchDate = !dateFilter || new Date(log.created_at).toISOString().split('T')[0] === dateFilter;
          return matchType && matchDate;
        });
  
        if (filteredLogs.length === 0) {
          logTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No logs found</td></tr>`;
          return;
        }
  
        filteredLogs.forEach(log => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${log.id}</td>
            <td>${log.type}</td>
            <td>${log.description || '—'}</td>
            <td>${new Date(log.created_at).toLocaleString()}</td>
          `;
          logTableBody.appendChild(row);
        });
      })
      .catch(err => console.error('Error loading logs:', err));
  }
  
  // Trigger logs filtering on input change
  document.getElementById('logTypeFilter')?.addEventListener('input', loadLogs);
  document.getElementById('logDateFilter')?.addEventListener('change', loadLogs);
 
  // ------------------- Init -------------------
  if (document.getElementById('totalUsers')) loadDashboardStats();
  if (document.getElementById('userTableBody')) loadAdminUsers();
  if (document.getElementById('sensorTableBody')) loadSensors();
  if (document.getElementById('logTableBody')) loadLogs();

  document.getElementById('sensorSearch')?.addEventListener('input', e => {
    displaySensors(window.allSensors || [], e.target.value);
  });