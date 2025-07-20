import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { CiHome } from 'react-icons/ci';
import Select from 'react-select';
import gimpaLogo from '../assets/gimpa.png';
import './LecturerJoinRoom.css';
import MoreButton from '../components/MoreButton';

function LecturerJoinRoom() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [lecturerName, setLecturerName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [supervisorKey, setSupervisorKey] = useState('');
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);

  const modalRef = useRef();
  const navigate = useNavigate();

  const titleOptions = [
    { value: 'Prof.', label: 'Prof.' },
    { value: 'Assoc. Prof.', label: 'Assoc. Prof.' },
    { value: 'Reader', label: 'Reader' },
    { value: 'Asst. Prof.', label: 'Asst. Prof.' },
    { value: 'Dr.', label: 'Dr.' },
    { value: 'JD', label: 'JD' },
    { value: 'Justice', label: 'Justice' },
    { value: 'Hon. Justice', label: 'Hon. Justice' },
    { value: 'Esq.', label: 'Esq.' },
    { value: 'Barr.', label: 'Barr.' },
    { value: 'Solic.', label: 'Solic.' },
    { value: 'Dean', label: 'Dean' },
    { value: 'VC', label: 'VC' },
    { value: 'Rector', label: 'Rector' },
    { value: 'Dir.', label: 'Dir.' },
    { value: 'HOD', label: 'HOD' },
    { value: 'Co_ord', label: 'Co_ord' },
    { value: 'Hon.', label: 'Hon.' },
    { value: 'H.E.', label: 'H.E.' },
    { value: 'Fr.', label: 'Fr.' },
    { value: 'Rev.', label: 'Rev.' },
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Ms.', label: 'Ms.' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Mx.', label: 'Mx.' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('gvle_token');
    if (!token) {
      navigate('/');
      return;
    }

    fetch('http://localhost:4000/api/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Verification failed');
        return res.json();
      })
      .then(data => {
        if (data.user && data.user.role === 'lecturer') {
          setUser(data.user);
        } else {
          localStorage.removeItem('gvle_token');
          navigate('/');
        }
      })
      .catch(() => {
        localStorage.removeItem('gvle_token');
        navigate('/');
      });
  }, [navigate]);

  useEffect(() => {
    const fetchRooms = async () => {
  try {
    const token = localStorage.getItem('gvle_token');
    const res = await fetch('http://localhost:4000/api/rooms/my-rooms', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch lecturer rooms');
    const data = await res.json();

    const roomsWithTitlesArray = data.map(room => ({
      ...room,
      titles: Array.isArray(room.titles)
        ? room.titles
        : room.titles
        ? room.titles.split(',').map(t => t.trim())
        : [],
    }));

    setRooms(roomsWithTitlesArray);
  } catch (err) {
    console.error('Error fetching lecturer rooms:', err);
  }
};


    fetchRooms();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showForm && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowForm(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showForm]);

  const handleLogout = () => {
    localStorage.removeItem('gvle_token');
    navigate('/');
  };

  const handleHome = () => {
    navigate('/lecturer-dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const roomData = {
      titles: selectedTitles.map(t => t.value).join(', '),
      name: lecturerName,
      courseName,
      courseCode,
      accessKey,
      supervisorKey
    };

    try {
      const token = localStorage.getItem('gvle_token');
      let res;

      if (editingRoom) {
        res = await fetch(`http://localhost:4000/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(roomData),
        });
      } else {
        res = await fetch('http://localhost:4000/api/rooms/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(roomData),
        });
      }

      if (!res.ok) throw new Error('Failed to save room');
      const result = await res.json();

      if (editingRoom) {
        setRooms((prev) =>
          prev.map((room) =>
            room.id === editingRoom.id ? result.room : room
          )
        );
      } else {
        setRooms((prev) => [...prev, result.room]);
      }

      alert(editingRoom ? '✅ Room updated!' : '✅ Room created!');
      setShowForm(false);
      setEditingRoom(null);
      setSelectedTitles([]);
      setLecturerName('');
      setCourseName('');
      setCourseCode('');
      setAccessKey('');
      setSupervisorKey('');
    } catch (err) {
      console.error(err);
      alert('❌ Could not save the room.');
    }
  };

  if (!user) return <p>Loading...</p>;

  const firstName = user.email.split('@')[0].split('.')[0];
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="lecturer-join-room-container">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={gimpaLogo} alt="GIMPA Logo" className="header-logo" />
          <h1 className="header-title">GIMPA Virtual Learning Environment</h1>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn" type="button">
            <LuLogOut /> Logout
          </button>
          <button onClick={handleHome} className="home-btn" type="button" style={{ marginRight: '1px' }}>
            <CiHome size={20} style={{ marginRight: '4px' }} /> Home
          </button>
        </div>
      </header>

      <div className="user-info-bar">
        <div className="welcome-msg">Welcome, {capitalizedFirstName}</div>
        <div className="user-email">{user.email}</div>
      </div>

      <div style={{ paddingLeft: '40px', marginTop: '20px' }}>
       <p
  onClick={() => navigate('/supervise-room')}
  style={{
    color: '#007bff',
    textDecoration: 'underline',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '8px',
    marginRight:'500px'
  }}
>
  Supervise Room
</p>

        <button
          className="btn-primary"
          style={{ fontSize: '18px', padding: '10px 20px' }}
          onClick={() => setShowForm(true)}
        >
          + Room
        </button>
      </div>

      <div style={{ paddingLeft: '40px', marginTop: '30px' }}>
        {rooms.length === 0 ? (
          <p style={{ color: '#666' }}>No rooms created yet.</p>
        ) : (
          rooms.map((room, index) => (
  <div
    key={index}
    className="room-card"
    onClick={() => navigate(`/virtual-room/${room.id}`)}
    style={{ cursor: 'pointer' }}
  >
    <h3>{room.courseCode} - {room.courseName}</h3>
    <p><strong>Lecturer:</strong> {(Array.isArray(room.titles) ? room.titles : room.titles?.split(',')).join(' ')} {room.name}</p>
    <p><strong>Access Key:</strong> {room.accessKey}</p>
    {room.supervisors && room.supervisors.length > 0 && (
      <p>
        <strong>Supervisor{room.supervisors.length > 1 ? 's' : ''}:</strong>{' '}
        {room.supervisors.map((sup, i) => (
          <span key={i}>
            {sup.name}
            {i < room.supervisors.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>
    )}

    <div style={{ marginTop: '10px' }}>
      <button
        className="btn-edit"
        onClick={(e) => {
          e.stopPropagation(); // 🛑 Prevent navigating when clicking edit
          setEditingRoom(room);
          setSelectedTitles(
            (Array.isArray(room.titles) ? room.titles : room.titles?.split(',')).map(t => ({
              value: t.trim(),
              label: t.trim()
            }))
          );
          setLecturerName(room.name);
          setCourseName(room.courseName);
          setCourseCode(room.courseCode);
          setAccessKey(room.accessKey);
          setSupervisorKey(room.supervisorKey);
          setShowForm(true);
        }}
      >
        Edit
      </button>

      <button
        className="btn-delete"
        onClick={async (e) => {
          e.stopPropagation(); // 🛑 Prevent navigating when clicking delete
          const confirmed = window.confirm('Are you sure you want to delete this room?');
          if (!confirmed) return;

          try {
            const token = localStorage.getItem('gvle_token');
            const res = await fetch(`http://localhost:4000/api/rooms/${room.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (!res.ok) {
              throw new Error('Failed to delete room');
            }

            const result = await res.json();
            console.log('Room deleted:', result);

            setRooms(prevRooms => prevRooms.filter(r => r.id !== room.id));
          } catch (err) {
            console.error(err);
            alert('❌ Failed to delete room.');
          }
        }}
        style={{ marginLeft: '10px' }}
      >
        Delete
      </button>
    </div>
  </div>
))

        )}
      </div>

      <div className="floating-more-button">
        <MoreButton />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <h2 style={{ marginBottom: '20px' }}>Add Virtual Room</h2>
            <form onSubmit={handleSubmit}>
              <label>Title</label>
              <Select
                isMulti
                options={titleOptions}
                placeholder="Select Title(s)"
                value={selectedTitles}
                onChange={setSelectedTitles}
                className="react-select-container"
                classNamePrefix="react-select"
              />
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple titles.
              </p>

              <label>Name</label>
              <input
                type="text"
                value={lecturerName}
                onChange={(e) => setLecturerName(e.target.value)}
                placeholder="Must match your registered name."
                style={{ width: '100%', marginBottom: '10px' }}
              />


              <label>Course Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Course Code</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Access Key </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Students will join your room with this key"
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Supervisor Key </label>
              <input
                type="text"
                value={supervisorKey}
                onChange={(e) => setSupervisorKey(e.target.value)}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <div className="room-button-group">
                <button type="submit" className="create-room-btn">
                  {editingRoom ? 'Update' : 'Create'}
                </button>
                <button type="button" className="cancel-room-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerJoinRoom;
