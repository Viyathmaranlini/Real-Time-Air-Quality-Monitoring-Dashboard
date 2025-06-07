const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

document.getElementById('logoutBtn').onclick = () => {
  fetch('http://127.0.0.1:8000/api/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });
};

document.getElementById('simulateBtn').onclick = () => {
  fetch('http://127.0.0.1:8000/api/simulate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadSensors();
    });
};

const map = L.map('map').setView([7.8731, 80.7718], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

function loadSensors() {
  fetch('http://127.0.0.1:8000/api/sensors', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(renderSensors);
}

function renderSensors(sensors) {
  const list = document.getElementById('sensorList');
  list.innerHTML = '';
  map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });

  const statusFilter = document.getElementById('statusFilter').value;
  const locationFilter = document.getElementById('locationFilter').value.toLowerCase();
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);

  sensors.forEach(sensor => {
    if (locationFilter && !sensor.location_description?.toLowerCase().includes(locationFilter)) return;

    // Add marker
    if (sensor.latitude && sensor.longitude) {
      L.marker([sensor.latitude, sensor.longitude])
        .addTo(map)
        .bindPopup(`<b>${sensor.name}</b><br>${sensor.location_description || 'No location'}`);
    }

    // Sensor card
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="sensor-card">
        <h6>${sensor.name}</h6>
        <p class="mb-1"><strong>Location:</strong> ${sensor.location_description || 'N/A'}</p>
        <p class="mb-1"><strong>Coordinates:</strong> ${sensor.latitude}, ${sensor.longitude}</p>
        <p><strong>AQI:</strong> <span id="aqi-${sensor.id}" class="badge badge-aqi badge-na">Loading...</span></p>
        <canvas id="chart-${sensor.id}" height="120"></canvas>
      </div>
    `;
    list.appendChild(col);

    // Fetch AQI history
    fetch(`http://127.0.0.1:8000/api/sensors/${sensor.id}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(history => {
        const filtered = history.filter(h => {
          const d = new Date(h.recorded_at);
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        });

        const values = filtered.map(h => h.aqi_value);
        const labels = filtered.map(h =>
          new Date(h.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );

        if (values.length > 0) {
          const latest = values[values.length - 1];
          const badge = document.getElementById(`aqi-${sensor.id}`);
          badge.textContent = latest;

          if (latest > 150) {
            badge.className = 'badge badge-aqi badge-unhealthy';
            if (statusFilter === 'Unhealthy' || !statusFilter) col.style.display = '';
            else col.style.display = 'none';
          } else if (latest > 50) {
            badge.className = 'badge badge-aqi badge-moderate';
            if (statusFilter === 'Moderate' || !statusFilter) col.style.display = '';
            else col.style.display = 'none';
          } else {
            badge.className = 'badge badge-aqi badge-good';
            if (statusFilter === 'Good' || !statusFilter) col.style.display = '';
            else col.style.display = 'none';
          }
        }

        const ctx = document.getElementById(`chart-${sensor.id}`).getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'AQI',
              data: values,
              borderColor: '#3f66ff',
              backgroundColor: 'rgba(63, 102, 255, 0.1)',
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            scales: {
              y: { beginAtZero: true },
              x: { title: { display: true, text: 'Time' }}
            },
            plugins: { legend: { display: false } }
          }
        });
      });
  });
}

document.getElementById('statusFilter').addEventListener('change', loadSensors);
document.getElementById('locationFilter').addEventListener('input', loadSensors);
document.getElementById('startDate').addEventListener('change', loadSensors);
document.getElementById('endDate').addEventListener('change', loadSensors);

loadSensors();