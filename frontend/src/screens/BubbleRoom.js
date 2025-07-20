import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { FiHome } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';
//import { MdOutlineCoPresent } from 'react-icons/md';
import { TbLayoutKanban } from 'react-icons/tb';
import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import { PiStackSimpleLight } from 'react-icons/pi';
import './BubbleRoom.css';
import Stack from '../components/Stack'; // <-- Add this import if not there


import Chat from '../components/Chat';
import ParticipantsPanel from './ParticipantsPanel';
import ProjectBoard from './ProjectBoard';
import MoreButton from '../components/MoreButton';

const BubbleRoom = () => {
  const { roomId, bubbleId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [bubble, setBubble] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [liveOn, setLiveOn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
 

  const token = localStorage.getItem('gvle_token');

  useEffect(() => {
    const fetchRoomAndBubble = async () => {
      try {
        const [roomRes, bubbleRes, userRes] = await Promise.all([
          fetch(`http://localhost:4000/api/rooms/by-id/${roomId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:4000/api/bubbles/single/${bubbleId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:4000/api/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const roomData = await roomRes.json();
        const bubbleData = await bubbleRes.json();
        const userData = await userRes.json();

        setRoom(roomData);
        setBubble(bubbleData);
        setUserRole(userData.user?.role);
        setUserId(userData.user?.id);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching room or bubble:', err);
        setLoading(false);
      }
    };

    fetchRoomAndBubble();
  }, [roomId, bubbleId, token]);  // <-- This is where the effect hook goes

  const handleExit = () => navigate(-1);

  const handleHome = () => {
    fetch('http://localhost:4000/api/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const email = data.user?.email || '';
        if (email.endsWith('@st.gimpa.edu.gh')) {
          navigate('/student-dashboard');
        } else {
          navigate('/lecturer-dashboard');
        }
      })
      .catch(() => navigate('/'));
  };

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  if (loading) return <p>Loading bubble room...</p>;
  if (!room || !bubble) return <p>Bubble or room not found.</p>;

  return (
    <div className="bubble-room-container">
      <header className="virtual-room-header">
        <div className="header-left">
          <h1 className="room-header-title">
            {room.courseCode} - {room.courseName} | {bubble.name}
          </h1>
        </div>
        <div className="header-right horizontal-buttons">
          <button onClick={handleExit} className="exit-btn">
            <LuLogOut style={{ marginRight: '6px' }} /> Exit
          </button>
          <button onClick={handleHome} className="home-btn">
            <FiHome style={{ marginRight: '6px' }} /> Home
          </button>
        </div>
      </header>

      <div className="room-tools-bottom">
        <div className="tool-icon" onClick={() => setShowChat(!showChat)} style={{ position: 'relative' }}>
          <BsChatDots /> <span>Chat</span>
          {unreadCount > 0 && (
            <div className="chat-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>

        <div className="tool-icon" onClick={() => setShowStack(!showStack)}>
          <PiStackSimpleLight /> <span>Stack</span>
        </div>

        <div className="tool-icon" onClick={() => setShowKanban(!showKanban)}>
          <TbLayoutKanban /> <span>Kanban</span>
        </div>
        <div className="tool-icon" onClick={() => setLiveOn(!liveOn)}>
          {liveOn ? <FaVideo /> : <FaVideoSlash />} <span>Live</span>
        </div>
      </div>

        {showStack && (
  <div className="stack-panel">
    <Stack
      bubbleId={bubbleId}
      token={token}
      onOpenFolders={(stackId) => navigate(`/stack/${stackId}/folders`)}
    />
  </div>
)}



      {showChat && (
        <div className="chat-panel">
          <Chat
            roomId={roomId}
            bubbleId={bubbleId}
            userId={userId}
            role={userRole}
            token={token}
            scope="bubble"
            chatVisible={showChat}
            onUnreadCountChange={setUnreadCount}
          />
        </div>
      )}

      {showParticipants && (
        <ParticipantsPanel
          lecturer={room.creator}
          supervisors={bubble.supervisors}
          students={bubble.students}
          context="bubble"
          onClose={() => setShowParticipants(false)}
        />
      )}

      {showKanban && <ProjectBoard bubbleId={bubbleId} token={token} />}

      <MoreButton />
    </div>
  );
};

export default BubbleRoom;
