import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5005/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);

      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'FACULTY') navigate('/faculty');
      else navigate('/student');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <CalendarDays size={48} color="var(--primary)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>ITMS Login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Intelligent Timetable Management System</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '0.75rem' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
