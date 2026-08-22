import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5005/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const { token, user } = data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('email', user.email);
      localStorage.setItem('userId', user.id);

      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'FACULTY') navigate('/faculty');
      else navigate('/student');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <CalendarDays size={40} />
        </div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to Intelligent Timetable Management System</p>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <Lock size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <div className="search-input-wrapper">
              <Mail size={15} />
              <input type="email" id="email" className="form-input search-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@itms.edu" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="search-input-wrapper">
              <Lock size={15} />
              <input type="password" id="password" className="form-input search-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '0.75rem', fontSize: '0.95rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Default: admin@itms.edu / admin123
        </p>
      </div>
    </div>
  );
};

export default Login;
