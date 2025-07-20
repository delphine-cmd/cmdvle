import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import './AddUserScreen.css';
import gimpaLogo from '../assets/gimpa.png';

function AddUserScreen() {
  const [adminEmail, setAdminEmail] = useState('');
  const [role, setRole] = useState('');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('gvle_token');
    if (!token) {
      navigate('/');
      return;
    }

    fetch(`${API}/api/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role !== 'admin') {
          navigate('/');
        } else {
          setAdminEmail(data.user.email);
        }
      })
      .catch(err => {
        console.error(err);
        navigate('/');
      });
  }, [navigate, API]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage('');

  if (password !== confirmPassword) {
    setMessage('Password Mismatch');
    return;
  }

  const token = localStorage.getItem('gvle_token');

  if (!token) {
    setMessage('Unauthorized: Missing token.');
    return;
  }

  try {
    const res = await fetch(`${API}/api/admin/add-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ✅ safely used
      },
      body: JSON.stringify({
      name,
      email,
      password,
      role,
      ...(role === 'student' && studentId ? { studentId } : {})
    }),


    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || 'Error adding user');
      return;
    }

    setMessage('User added and verification email sent!');
    setRole('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  } catch (err) {
    console.error(err);
    setMessage('Server error');
  }
};


  const handleLogout = () => {
    localStorage.removeItem('gvle_token');
    navigate('/');
  };

  return (
    <div className="add-user-container">
      <header className="add-user-header">
        <div className="header-left">
          <img src={gimpaLogo} alt="GIMPA Logo" className="header-logo" />
          <h1 className="header-title">GIMPA Virtual Learning Environment</h1>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </header>

      <div className="admin-info">Logged in as: {adminEmail}</div>

      <form className="add-user-form" onSubmit={handleSubmit}>
        <h2>Add User</h2>

        <select
          className="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="">Select user role</option>
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
          <option value="admin">Admin</option>
        </select>
                
        <input
        type="text"
        placeholder="Full Name"
        className="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        />
        {role === 'student' && (
        <input
          type="text"
          placeholder="Student ID"
          className="student-id-input"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      )}

        <input
          type="email"
          placeholder="Email"
          className="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            className="confirm-password-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowConfirmPassword(prev => !prev)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit">Save</button>
        {message && <div className="message">{message}</div>}
      </form>

      <button className="bottom-left-icon">
        <FaPlus />
      </button>
    </div>
  );
}

export default AddUserScreen;
