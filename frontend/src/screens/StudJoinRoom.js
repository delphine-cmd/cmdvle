import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gimpaLogo from '../assets/gimpa.png';
import './LecturerJoinRoom.css'; // reuse styles
import MoreButton from '../components/MoreButton';
import { LuLogOut } from 'react-icons/lu';
import { FaHome } from 'react-icons/fa';

function StudJoinRoom() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState('');
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
        if (data.user && data.user.role === 'student') {
          setUser(data.user);
          fetchJoinedRooms(token);
        } else {
          navigate('/');
        }
      });
  }, [navigate]);

  const fetchJoinedRooms = async (token) => {
    try {
      const res = await fetch('http://localhost:4000/api/rooms/joined', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch joined rooms:', err);
    }
  };

  const handleJoinRoom = async () => {
    const token = localStorage.getItem('gvle_token');
    try {
      const res = await fetch('http://localhost:4000/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessKey: accessKeyInput }),
      });

      if (!res.ok) throw new Error('Join failed');

      setAccessKeyInput('');
      setShowModal(false);
      fetchJoinedRooms(token);
      alert('✅ Room joined successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ Invalid or duplicate access key');
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
    <div className="lecturer-join-room-container">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={gimpaLogo} alt="GIMPA Logo" className="header-logo" />
          <h1 className="header-title">GIMPA Virtual Learning Environment</h1>
        </div>
        <div className="header-right">
  <button className="logout-btn" onClick={() => navigate('/student-dashboard')}>
    <FaHome style={{ marginRight: '5px' }} /> Home
  </button>
  <button
    className="logout-btn"
    onClick={() => {
      localStorage.removeItem('gvle_token');
      navigate('/');
    }}
  >
    <LuLogOut style={{ marginLeft: '-60px' }} /> Logout
  </button>
  <MoreButton />
</div>


      </header>

      <div className="user-info-bar">
        <div className="welcome-msg">Welcome, {user.email.split('@')[0]}</div>
        <div className="user-email">{user.email}</div>
      </div>

      <div style={{ paddingLeft: '40px', marginTop: '20px' }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Room
        </button>
      </div>

      <div style={{ paddingLeft: '40px', marginTop: '30px' }}>
        {rooms.length === 0 ? (
          <p>No joined rooms yet.</p>
        ) : (
         rooms.map((room, index) => (
  <div
    key={index}
    className="room-card"
    onClick={() => navigate(`/virtual-room/${room.id}`)}
    style={{ cursor: 'pointer' }}
  >
    <h3>{room.courseCode} - {room.courseName}</h3>
    <p><strong>Lecturer:</strong> {room.titles?.join(' ')} {room.name}</p>
    {room.supervisors?.length > 0 && (
      <p><strong>Supervisor:</strong> {room.supervisors.map(s => s.name).join(', ')}</p>
    )}
    <p><strong>Access Key:</strong> {room.accessKey}</p>
  </div>
))

        )}
      </div>

      {/* Join Room Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Access Key</h2>
            <label style={{ fontWeight: 'bold' }}>Enter access key</label>
            <input
              type="text"
              value={accessKeyInput}
              onChange={(e) => setAccessKeyInput(e.target.value)}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Enter access key provided by the lecturer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="create-room-btn" onClick={handleJoinRoom}>
                Join
              </button>
              <button className="cancel-room-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudJoinRoom;
