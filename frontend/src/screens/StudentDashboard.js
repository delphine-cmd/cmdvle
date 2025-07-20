import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import MoreButton from '../components/MoreButton';
import gimpaLogo from '../assets/gimpa.png';
import './StudentDashboard.css';

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skippedAvatar, setSkippedAvatar] = useState(false);

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
          return fetch('http://localhost:4000/api/student/avatar', {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          throw new Error('Invalid user');
        }
      })
      .then((res) => {
        if (!res.ok) {
          // If avatar not found or error, return empty object to prevent JSON parsing error
          return {};
        }
        return res.json();
      })
      .then((data) => {
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
      })
      .catch((err) => {
        console.error('[Dashboard Error]', err);
        localStorage.removeItem('gvle_token');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('gvle_token');
    navigate('/');
  };

  const handleMoreClick = () => {
    alert('More options clicked');
  };

  if (loading) return <p className="loading-text">Loading...</p>;
  if (!user) return <p className="error-text">User not found.</p>;

const fullName = user.name?.trim() || '';
const words = fullName.split(/\s+/); // split by spaces
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
          <MoreButton onClick={handleMoreClick} />
        </div>
      </header>

      {/* Welcome + Email */}
      <div className="user-info-bar">
        <div className="welcome-msg">
        Welcome, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}
        </div>

        <div className="user-email">{user.email}</div>
      </div>

      {/* Avatar Section */}
      <div className="avatar-container">
        {avatarUrl && !skippedAvatar ? (
          <>
            <model-viewer
              src={avatarUrl}
              alt="Student Avatar"
              auto-rotate
              camera-controls
              ar
              className="model-viewer"
            />

            {/* Virtual Collaboration Box */}
            <div className="collab-box">
              <p className="collab-title">Virtual Collaboration</p>
              <button
                className="join-btn"
                onClick={() => navigate('/student-dashboard/join-room')}
              >
                Join Room
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="avatar-circle">{initials}</div>

            {!skippedAvatar && (
              <div className="avatar-buttons-wrapper">
  <div className="customise-avatar-btn-wrapper">
    <button
      className="customise-avatar-btn"
      onClick={() => navigate('/student-dashboard/avatar-create')}
    >
      Customise Avatar
    </button>
  </div>
  <div className="skip-avatar-btn-wrapper">
    <button
      className="skip-avatar-btn"
      onClick={() => setSkippedAvatar(true)}
    >
      Skip
    </button>
  </div>
</div>

            )}

            {skippedAvatar && (
              <div className="collab-box skipped-collab-box">
                <p className="collab-title">Virtual Collaboration</p>
                <button
                  className="join-btn"
                  onClick={() => navigate('/student-dashboard/join-room')}
                >
                  Join Room
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating MoreButton bottom-left */}
      <div className="floating-more-button">
        <MoreButton onClick={handleMoreClick} />
      </div>
    </div>
  );
}

export default StudentDashboard;
