// VirtualRoom.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { FiHome } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';
import { MdOutlineCoPresent } from 'react-icons/md';
import { TbLayoutKanban } from 'react-icons/tb';
import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import { RiGroupLine } from 'react-icons/ri';
import './VirtualRoom.css';

import RoomChat from './RoomChat';
import ProjectBoard from './ProjectBoard';
import MoreButton from '../components/MoreButton';
import ParticipantsPanel from './ParticipantsPanel';
import BubbleList from './BubbleList';
import BubbleModal from './BubbleModal';

import { io } from 'socket.io-client';

function VirtualRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showProjectBoard, setShowProjectBoard] = useState(false);
  //const [showBubble, setShowBubble] = useState(false);
  const [liveOn, setLiveOn] = useState(false);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [bubbles, setBubbles] = useState([]); // all created bubbles
  const [userId, setUserId] = useState(null);
  const [showBubbleModal, setShowBubbleModal] = useState(false);


  // Get all student IDs already in bubbles
  const studentsInBubbles = bubbles
  .flatMap((bubble) =>
    Array.isArray(bubble.students) ? bubble.students.map((s) => s.id) : []
  );

  console.log("🧮 Students already in bubbles:", studentsInBubbles);

  // Determine the next bubble number to use
  const nextBubbleNumber = bubbles.length + 1;




  const token = localStorage.getItem("gvle_token");

  useEffect(() => {
    fetch(`http://localhost:4000/api/rooms/by-id/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setRoom(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch room", err);
        setLoading(false);
      });
  }, [roomId, token]);

    useEffect(() => {
    fetch(`http://localhost:4000/api/bubbles/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setBubbles(data);
        console.log('🫧 Loaded bubbles:', data);
      })
      .catch(err => {
        console.error('❌ Failed to fetch bubbles:', err);
      });
  }, [roomId, token]);


  useEffect(() => {
  let socketInstance;

  // Step 1: Get the student's ID from the token
  fetch('http://localhost:4000/api/verify', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
    const userId = data.user?.id;
    const role = data.user?.role;
    setUserId(userId);  // ✅ Save userId to state
    setUserRole(role);



  if (!userId) {
    console.error('❌ No user ID found.');
    return;
  }

  socketInstance = io('http://localhost:4000', {
    auth: { userId }, // ←✅ this is correct now
    transports: ['websocket'],
  });


      socketInstance.on('connect', () => {
        console.log('✅ Connected with userId:', userId);
      });

      socketInstance.on('online-users', (userList) => {
        console.log('🟢 Online users updated:', userList);
        setOnlineUsers(userList);
      });

      socketInstance.on('status-changed', (update) => {
        console.log('🟢 Status changed:', update);
      });

      setSocket(socketInstance);
    });




  return () => {
    if (socketInstance) {
      socketInstance.disconnect();
    }
  };
}, [roomId, token]);


  useEffect(() => {
    if (!showParticipants) return;

    fetch(`http://localhost:4000/api/rooms/${roomId}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setParticipants)
      .catch(err => console.error("Failed to fetch participants", err));
  }, [showParticipants, roomId, token]);

  const handleExitRoom = () => {
    navigate(-1);
  };

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

  if (loading) return <p>Loading room...</p>;
  if (!room) return <p>Room not found.</p>;



const handleAutoAssignBubbles = async (students, supervisors, bubbleCount) => {
  // ✅ Ensure we only use unassigned students here (extra safety)
  const unassignedStudents = students.filter(
    (student) => !studentsInBubbles.includes(student.id)
  );

  // Shuffle students randomly
  const shuffledStudents = [...unassignedStudents].sort(() => Math.random() - 0.5);

  // Create empty bubble objects with names
  const newBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
    name: `Bubble ${nextBubbleNumber + i}`,
    students: [],
    supervisors: [],
  }));

  // Assign students to bubbles evenly (round-robin)
  shuffledStudents.forEach((student, index) => {
    const bubbleIndex = index % bubbleCount;
    newBubbles[bubbleIndex].students.push(student.id); // only push the student ID
  });

  // Assign supervisors randomly to each bubble (by ID)
  newBubbles.forEach((bubble) => {
    const shuffledSupes = [...supervisors].sort(() => Math.random() - 0.5);
    const assignedSupes = shuffledSupes.slice(0, Math.ceil(Math.random() * shuffledSupes.length));
    bubble.supervisors = assignedSupes.map(s => s.id); // map to IDs only
  });

  try {
    // Send bubbles to backend with students and supervisors as arrays of IDs
    const res = await fetch(`http://localhost:4000/api/bubbles/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bubbles: newBubbles }),
    });

    if (!res.ok) throw new Error('Failed to save bubbles to DB');

    const savedBubbles = await res.json();

    // Append the saved bubbles to local state so UI updates
    setBubbles((prev) => [...prev, ...savedBubbles]);
    console.log('🎉 Appended Bubbles:', savedBubbles);
  } catch (err) {
    console.error('❌ Failed to save bubbles:', err);
  }
};



//console.log('🧪 showBubble:', showBubble);
console.log('🧪 bubbles:', bubbles);
console.log('🧪 userRole:', userRole);
console.log('🧪 userId:', userId);



  return (
    <div className="virtual-room-container">
      <header className="virtual-room-header">
        <div className="header-left">
          <h1 className="room-header-title">{room.courseCode} - {room.courseName}</h1>
        </div>
        <div className="header-right horizontal-buttons">
          <button
            onClick={handleExitRoom}
            style={{
              backgroundColor: 'white',
              border: 'none',
              color: '#002a75',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            <LuLogOut style={{ marginRight: '6px', color: '#002a75' }} /> Exit
          </button>

          <button
            onClick={handleHome}
            style={{
              backgroundColor: 'white',
              border: 'none',
              color: '#002a75',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              padding: '4px 28px',
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            <FiHome style={{ marginRight: '6px', color: '#002a75' }} /> Home
          </button>
        </div>
      </header>

      <div className="room-meta-row">
        <div className="lecturer-meta">
          <h2>{room.titles ? room.titles.split(',').join(' ') : ''} {room.name}</h2>
        </div>
        {room.supervisors?.length > 0 && (
          <div className="supervisor-meta">
            <h3>
              Supervisor{room.supervisors.length > 1 ? 's' : ''}:{' '}
              {room.supervisors.map((sup, i) => (
                <span key={i}>
                  {sup.name}
                  {i < room.supervisors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </h3>
          </div>
        )}
      </div>

      <div className="room-tools-bottom">
        <div
  className="tool-icon"
  onClick={() => {
    if (userRole === "student") {
      const studentBubble = bubbles.find(b =>
        b.students.some(s => String(s.id) === String(userId))
      );

      if (studentBubble) {
        navigate(`/bubble-room/${roomId}/${studentBubble.id}`);
      } else {
        alert("You have not been assigned to any bubble yet.");
      }
    } else {
      navigate(`/virtual-room/${roomId}/bubbles`);
    }
  }}
>
  <RiGroupLine /> <span>Bubble</span>
</div>


        <div className="tool-icon" onClick={() => setShowParticipants(!showParticipants)}>
          <MdOutlineCoPresent /> <span>Participants</span>
        </div>
        <div className="tool-icon" onClick={() => setShowChat(!showChat)}>
          <BsChatDots /> <span>Chat</span>
        </div>
        <div className="tool-icon" onClick={() => setShowProjectBoard(!showProjectBoard)}>
          <TbLayoutKanban /> <span>Project Board</span>
        </div>
        <div className="tool-icon" onClick={() => setLiveOn(!liveOn)}>
          {liveOn ? <FaVideo /> : <FaVideoSlash />} <span>Live</span>
        </div>
      </div>

      {showChat && <RoomChat roomId={roomId} token={token} />}
      
      {showParticipants && participants && (
      <ParticipantsPanel
      lecturer={participants.lecturer}
      supervisors={participants.supervisors}
      students={participants.students}
      studentsInBubbles={studentsInBubbles}
      nextBubbleNumber={nextBubbleNumber}
      onAutoAssignBubbles={handleAutoAssignBubbles}
      onlineUsers={onlineUsers}
      socket={socket}
      userRole={userRole}
      onClose={() => setShowParticipants(false)}
      onOpenBubbleModal={() => setShowBubbleModal(true)} // ✅ HERE
    />
    )}



      {showProjectBoard && <ProjectBoard roomId={roomId} token={token} />}


    {showBubbleModal && (
      <BubbleModal
        students={participants.students.filter(
          (student) => !studentsInBubbles.includes(student.id)
        )}
        supervisors={participants.supervisors}
        onClose={() => setShowBubbleModal(false)}
        onAutoAssign={(bubbleCount) => {
          const unassignedStudents = participants.students.filter(
            (student) => !studentsInBubbles.includes(student.id)
          );
          handleAutoAssignBubbles(unassignedStudents, participants.supervisors, bubbleCount);
          setShowBubbleModal(false);
        }}
        nextBubbleNumber={nextBubbleNumber}
      />
    )}
    {userRole && userId && (
  <BubbleList
    userRole={userRole}
    userId={userId}
  />
)}


          <MoreButton />
        </div>
      );
    }

export default VirtualRoom;
