// src/pages/SuperviseRoom.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';

import './SuperviseRoom.css';


function SuperviseRoom() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [supervisorKey, setSupervisorKey] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef();
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
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'lecturer') {
          setUser(data.user);
          fetchSupervisedRooms(token);
        } else {
          navigate('/');
        }
      });
  }, [navigate]);

  const fetchSupervisedRooms = async (token) => {
    try {
      const res = await fetch('http://localhost:4000/api/rooms/supervised', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch supervised rooms:', err);
    }
  };

  const handleJoinAsSupervisor = async () => {
    setError('');
    const token = localStorage.getItem('gvle_token');

    try {
      const res = await fetch('http://localhost:4000/api/rooms/supervise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ supervisorKey }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to join as supervisor');
      }

      setSupervisorKey('');
      setShowModal(false);
      fetchSupervisedRooms(token);
      alert('✅ Successfully joined room as supervisor!');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showModal && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowModal(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showModal]);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="supervise-room-container">
      {/* Header */}
      <DashboardHeader userEmail={user.email} />


      <div className="user-info-bar">
        <div className="welcome-msg">Welcome, {user.email.split('@')[0]}</div>
        <div className="user-email">{user.email}</div>
      </div>

      {/* Supervise Room Button */}
      <div className="supervise-room-btn-container">
        <button className="supervise-room-link-btn" onClick={() => setShowModal(true)}>
          Supervise Room
        </button>
      </div>

      {/* List of Supervised Rooms */}
      <div className="supervise-rooms-list">
        {rooms.length === 0 ? (
          <p className="supervise-no-rooms-msg">You are not supervising any rooms yet.</p>
        ) : (
          rooms.map((room, index) => (
  <div
    key={index}
    className="supervise-room-card"
    onClick={() => navigate(`/virtual-room/${room.id}`)}
    style={{ cursor: 'pointer' }}
  >
    <h3>{room.courseCode} - {room.courseName}</h3>
    <p><strong>Lecturer:</strong> {room.titles?.join(' ')} {room.name}</p>
    {room.supervisors?.length > 0 && (
      <p><strong>Supervisors:</strong> {room.supervisors.map(s => s.name).join(', ')}</p>
    )}
    <p><strong>Supervisor Key:</strong> {room.supervisorKey}</p>
  </div>
))

        )}
      </div>

      {/* Supervisor Key Modal */}
      {showModal && (
        <div className="supervise-modal-overlay">
          <div className="supervise-modal-content" ref={modalRef}>
            <h2 className="supervise-modal-title">Supervisor Key</h2>
            <label>Enter supervisor key</label>
            <input
              type="text"
              className="supervise-modal-input"
              value={supervisorKey}
              onChange={(e) => setSupervisorKey(e.target.value)}
              placeholder="Enter key provided by the lecturer"
            />
            <p className="supervise-modal-helper">
              Use the supervisor key to gain access to a virtual room as a supervisor.
            </p>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="supervise-modal-buttons">
              <button className="supervise-create-btn" onClick={handleJoinAsSupervisor}>
                Join
              </button>
              <button className="supervise-cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperviseRoom;
