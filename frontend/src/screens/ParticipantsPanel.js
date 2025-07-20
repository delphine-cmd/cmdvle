import React, { useEffect, useState } from 'react';
//import BubbleModal from './BubbleModal';

const StatusDot = ({ isOnline }) => (
  <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
);

const ParticipantsPanel = ({
  lecturer,
  supervisors = [],
  students = [],
  studentsInBubbles = [],
  nextBubbleNumber = 1,
  onAutoAssignBubbles,
  onlineUsers: initialOnlineUsers = [],
  socket,
  onClose,
  userRole,
  onOpenBubbleModal, // ✅ Add this here
}) => {




  const [onlineUsers, setOnlineUsers] = useState(initialOnlineUsers);
  //const [showBubbleModal, setShowBubbleModal] = useState(false);
  //const unassignedStudents = students.filter(
  //(student) => !studentsInBubbles.includes(student.id)
//);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (userList) => {
      console.log('🟢 Received online users list (IDs):', userList);
      setOnlineUsers(userList);
    };

    socket.on('online-users', handleOnlineUsers);

    return () => {
      socket.off('online-users', handleOnlineUsers);
    };
  }, [socket]);

  const isOnline = (id) => onlineUsers.includes(id);

  return (
    <div className="participants-panel">
      <div className="participants-header">
        <h2>Participants</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="section">
  <h3>Lecturer</h3>
  <div className="participant-item">
    <StatusDot isOnline={isOnline(lecturer?.id)} />
    <span className="participant-name">{lecturer?.title} {lecturer?.name}</span>
  </div>

  {/* Only lecturers/supervisors can see this */}
  {userRole !== 'student' && (
  <button className="bubble-btn" onClick={onOpenBubbleModal}>
  + Bubble
</button>

)}

</div>

      {supervisors.length > 0 && (
        <div className="section">
          <h3>Supervisors</h3>
          {supervisors.map((sup, i) => (
            <div className="participant-item" key={i}>
              <StatusDot isOnline={isOnline(sup.id)} />
              <span className="participant-name">{sup.name}</span>
            </div>
          ))}
        </div>
      )}

           <div className="section">
            <h3>Students</h3>
            {students.length === 0 ? (
            <p>No students have joined yet.</p>
            ) : (
            students.map((stu, i) => (
                <div className="participant-item" key={i}>
                <StatusDot isOnline={isOnline(stu.id)} />
                <span className="participant-name">{stu.name}</span>
                </div>
            ))
            )}

            </div>


      {/* COMMENT THIS OUT in ParticipantsPanel.js */}
{/*
{showBubbleModal && (
  <BubbleModal
    students={unassignedStudents}
    supervisors={supervisors}
    onClose={() => setShowBubbleModal(false)}
    onAutoAssign={(bubbleCount) => {
      onAutoAssignBubbles(unassignedStudents, supervisors, bubbleCount);
      setShowBubbleModal(false);
    }}
    nextBubbleNumber={1}
  />
)}
*/}

    </div> // ← this closes <div className="participants-panel">
  );
};

export default ParticipantsPanel;
