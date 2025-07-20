import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import MoreButton from '../components/MoreButton'; // assuming you want the same button
import gimpaLogo from '../assets/gimpa.png';
import './LecturerDashboard.css'; // create styles similar to StudentDashboard.css

function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('gvle_token');
    if (!token) {
      navigate('/');
      return;
    }

    fetch('http://localhost:4000/api/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Verification failed');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          throw new Error('Invalid user');
        }
      })
      .catch((err) => {
        console.error('[Lecturer Dashboard Error]', err);
        localStorage.removeItem('gvle_token');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('gvle_token');
    navigate('/');
  };

  if (loading) return <p className="loading-text">Loading...</p>;
  if (!user) return <p className="error-text">User not found.</p>;
  console.log('User data:', user);


const fullName = user.name?.trim() || '';
const words = fullName.split(/\s+/); // split by any whitespace
const firstName = words[0] || '';
const initials = words.map((word) => word[0]?.toUpperCase()).join('');

 

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <img src={gimpaLogo} alt="GIMPA Logo" className="header-logo" />
          <h1 className="header-title">GIMPA Virtual Learning Environment</h1>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn" type="button">
            <LuLogOut /> Logout
          </button>
          <MoreButton onClick={() => alert('More options clicked')} />
        </div>
      </header>

      {/* Welcome + Email */}
      <div className="user-info-bar">
        <div className="welcome-msg">
       Welcome, {firstName}
       </div>


        <div className="user-email">{user.email}</div>
      </div>

      {/* Initials + Virtual Collaboration */}
      <div className="avatar-container">
        <div className="avatar-circle">{initials}</div>

        <div className="collab-box">
          <p className="collab-title">Virtual Collaboration</p>
          <button
            className="join-btn"
            onClick={() => navigate('/lecturer-dashboard/join-room')}
          >
            Join Room
          </button>
        </div>
      </div>

      {/* Floating MoreButton bottom-left */}
      <div className="floating-more-button">
        <MoreButton onClick={() => alert('More options clicked')} />
      </div>
    </div>
  );
}

export default LecturerDashboard;
