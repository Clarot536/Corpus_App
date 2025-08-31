// LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        'https://api.corpus.swecha.org/api/v1/auth/login',
        { phone, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { access_token } = response.data; // adjust as per actual response
      localStorage.setItem('access_token', access_token);
      console.log('Login successful, token:', access_token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response || err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.heading}>Login</h2>
        <label style={styles.label}>
          Phone Number:
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
            required
          />
        </label>
        <label style={styles.label}>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </label>
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  form: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  heading: { marginBottom: '1.5rem', textAlign: 'center' },
  label: { display: 'block', marginBottom: '1rem' },
  input: { width: '100%', padding: '0.5rem', marginTop: '0.25rem' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', marginBottom: '1rem' },
};

export default LoginPage;
