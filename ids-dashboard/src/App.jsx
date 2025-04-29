import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie,
  ResponsiveContainer
} from 'recharts';

const App = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/eve.json');
        const text = await res.text();

        const lines = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        const parsed = lines
          .map(line => {
            try {
              return JSON.parse(line);
            } catch (e) {
              console.warn('Skipping malformed line:', line);
              return null;
            }
          })
          .filter(item => item && item.event_type === 'alert');

        setAlerts(parsed);
      } catch (err) {
        console.error('Error loading eve.json:', err);
      }
    };

    loadData();
  }, []);

  // Aggregations
  const portCounts = {};
  const ipCounts = {};
  const timeCounts = {};
  const sigCounts = {};

  alerts.forEach(alert => {
    const port = alert.dest_port;
    const ip = alert.src_ip;
    const time = alert.timestamp?.slice(0, 13); // Group by hour
    const sig = alert.alert?.signature || 'Unknown';

    if (port) portCounts[port] = (portCounts[port] || 0) + 1;
    if (ip) ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    if (time) timeCounts[time] = (timeCounts[time] || 0) + 1;
    sigCounts[sig] = (sigCounts[sig] || 0) + 1;
  });

  // Format for Recharts
  const portData = Object.entries(portCounts).map(([port, count]) => ({ port, count }));
  const ipData = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const timeData = Object.entries(timeCounts)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));
  const sigData = Object.entries(sigCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const sectionStyle = {
    marginBottom: '3rem'
  };

  return (
    <div style={{ backgroundColor: '#1e1e1e', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Network Alert Dashboard</h1>

      {/* Destination Port Chart */}
      <div style={sectionStyle}>
        <h2>Alerts by Destination Port</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={portData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="port" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Source IPs */}
      <div style={sectionStyle}>
        <h2>Top 10 Source IPs</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ipData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ip" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#ff6666" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts Over Time */}
      <div style={sectionStyle}>
        <h2>Alerts Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alert Signature Pie Chart */}
      <div style={sectionStyle}>
        <h2>Top Alert Signatures</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sigData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#ffc658"
              label
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default App;
