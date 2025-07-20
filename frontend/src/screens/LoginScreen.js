import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './LoginScreen.css';
import gimpaLogo from '../assets/gimpa.png';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      console.log('Raw response text:', text);

      if (!res.ok) {
        setError('Server error. See console for details.');
        return;
      }

      const data = JSON.parse(text);

      if (!data.token) {
        setError('No token returned. Please try again.');
        return;
      }

      localStorage.setItem('gvle_token', data.token);
      setSuccess('Login successful!');

      // Check user role and redirect accordingly
      const verifyRes = await fetch(`${API}/api/verify`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });

      const verifyData = await verifyRes.json();
      const user = verifyData.user;

      console.log('[Logged In User]', user);

      if (user.role === 'student') {
        navigate('/student-dashboard');
        return;
      }

      if (user.role === 'lecturer') {
        navigate('/lecturer-dashboard');
        return;
      }

      // Default: Admin
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.error('[Login Error]', err);
      setError('Server error. Please try again.');
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    navigate('/reset-password');
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <img src={gimpaLogo} alt="GIMPA Logo" className="logo" />
        <h2>GIMPA VLE</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '30px' }}
            />
            <span
              className="show-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#3478d8',
                fontSize: '18px',
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit">Login</button>
          <p>
            <button
  onClick={handleReset}
  className="reset-link"
  type="button"
  style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: '6px' }}
  onMouseEnter={e => e.preventDefault()}
  onMouseLeave={e => e.preventDefault()}
>
  Password Reset
</button>

          </p>
        </form>

        {error && <p style={{ color: '#cc3300', marginTop: '10px' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}
      </div>
    </div>
  );
}

export default LoginScreen;
