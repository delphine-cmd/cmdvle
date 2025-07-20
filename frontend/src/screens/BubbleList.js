// 👇 BubbleList.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import './BubbleList.css';
import axios from 'axios';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const BubbleList = ({ userRole, userId }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [bubbles, setBubbles] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBubble, setEditingBubble] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null); // ✅ Add this line
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);



  const assignedStudentIds = bubbles.flatMap(b => b.students.map(s => s.id));
  const unassignedStudents = room?.joinedBy?.map(j => j.student)?.filter(s => !assignedStudentIds.includes(s.id)) || [];

  useEffect(() => {
    const fetchBubbles = async () => {
      try {
        const token = localStorage.getItem("gvle_token");
        const res = await axios.get(`/api/bubbles/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBubbles(res.data);
      } catch (err) {
        console.error('❌ Error fetching bubbles:', err);
      }
    };
    if (roomId) fetchBubbles();
  }, [roomId]);

    useEffect(() => {
        const fetchRoom = async () => {
    try {
        const token = localStorage.getItem("gvle_token");
        const res = await axios.get(`http://localhost:4000/api/rooms/by-id/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        setRoom(res.data);
        console.log("🧪 room.joinedBy sample:", res.data.joinedBy); // 👈 add this line
        setLoading(false);
    } catch (err) {
        console.error("❌ Failed to fetch room", err);
        setLoading(false);
    }
    };

    if (roomId) fetchRoom();
  }, [roomId]);

  const visibleBubbles = userRole === 'supervisor'
    ? bubbles.filter(bubble =>
        Array.isArray(bubble.supervisors) &&
        bubble.supervisors.some(s => String(s.id) === String(userId))
      )
    : bubbles;

  const handleSaveEdit = async (bubbleId) => {
  const token = localStorage.getItem("gvle_token");

 
  console.log("Saving bubble:", {
    students: editingBubble.students.map(s => s.id),
    supervisors: editingBubble.supervisors.map(s => s.id),
  });

  try {
    const res = await axios.put(
      `/api/bubbles/${roomId}/${bubbleId}`,
      {
        students: editingBubble.students.map(s => s.id),
        supervisors: editingBubble.supervisors.map(s => s.id),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

      const updatedBubble = res.data;
      setBubbles(prev => prev.map(b => (b.id === bubbleId ? updatedBubble : b)));
      setEditingBubble(null);
    } catch (err) {
      console.error("❌ Failed to update bubble:", err);
    }
  };



// Excel Loader
    const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

  // ✅ Add course info at the top
  const courseInfo = [
    ['Course Code:', room?.courseCode || 'N/A'],
    ['Course Name:', room?.courseName || 'N/A'],
    [],
  ];
  const courseSheet = XLSX.utils.aoa_to_sheet(courseInfo);

  // ✅ Add bubble data below
  visibleBubbles.forEach((bubble, index) => {
  const rows = [];

  // Add course info at the top of each bubble tab
  rows.push([`Course Code:`, room?.courseCode || 'N/A']);
  rows.push([`Course Name:`, room?.courseName || 'N/A']);
  rows.push([]); // blank line

  rows.push([`Bubble: ${bubble.name}`]);
  rows.push([]);
  rows.push(['Student ID', 'Name', 'Email']);
  bubble.students.forEach(student => {
    rows.push([student.studentId || '', student.name, student.email]);
  });

  rows.push([]);
  rows.push(['Supervisors']);
  bubble.supervisors.forEach(supervisor => {
    rows.push([`${supervisor.name} (${supervisor.email})`]);
  });

  rows.push([]);
  rows.push([]);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, sheet, `Bubble ${index + 1}`);
});

  // ✅ Insert the course sheet first
 // XLSX.utils.book_append_sheet(wb, courseSheet, 'Course Info');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const fileName = `${room?.courseCode || 'course'}-${room?.courseName || 'name'}-bubble.xlsx`;
saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
};
       // Excel loade ends her 

  const handleCardClick = (bubbleId) => {
  navigate(`/bubble-room/${roomId}/${bubbleId}`);
};





  if (loading) return <p>Loading room data...</p>;

  if (!visibleBubbles?.length) {
    return (
      <div>
        {room && (
          <header className="virtual-room-header">
            <div className="header-left">
              <h1 className="room-header-title">{room.courseCode} - {room.courseName}</h1>
            </div>
          </header>
        )}
        <p>No bubbles available.</p>
      </div>
    );
  }

  return (
    <div>
      {room && (
        <header className="virtual-room-header">
          <div className="header-left">
            <h1 className="room-header-title">{room.courseCode} - {room.courseName}</h1>
          </div>
          <div className="header-right">
            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: 'white',
                border: 'none',
                color: '#002a75',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              <LuLogOut style={{ marginRight: '6px', color: '#002a75' }} /> Exit
            </button>
          </div>
        </header>
      )}

            <div className="bubble-list-container">
                {visibleBubbles.length > 0 && (
                <div className="download-excel-wrapper">
          <button className="download-excel-btn" onClick={handleDownloadExcel}>
            Download Excel
          </button>
        </div>
        )}

        {visibleBubbles.map((bubble) => (
          <div
            className="bubble-card"
            key={bubble.id}
            onClick={() => handleCardClick(bubble.id)}
            style={{ cursor: (userRole === 'lecturer' || userRole === 'creator' || userRole === 'supervisor') ? 'pointer' : 'default' }}
            >

            <div className="bubble-header">
            <h3>{bubble.name}</h3>
            {editingBubble?.id !== bubble.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 🛑 Prevent card click from firing
                  setEditingBubble({ ...bubble });
                }}
                className="edit-bubble-btn"
              >
                Edit Bubble
              </button>
            )}
          </div>



            <div>
              <strong>Students:</strong>
              {bubble.students?.length ? (
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bubble.students.map((stu) => (
                      <tr key={stu.id}>
                        <td>{stu.studentId || '—'}</td>
                        <td>{stu.name}</td>
                        <td>{stu.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No students</p>}
            </div>

            <div>
              <strong>Supervisors:</strong>
              <ul className="supervisor-list">
                {(bubble.supervisors ?? []).map((sup) => (
                  <li key={sup.id}>{sup.name} ({sup.email})</li>
                ))}
              </ul>
            </div>

            {editingBubble?.id === bubble.id && (
              <div className="bubble-edit-panel">
                <h4>Edit Mode</h4>

                <div className="edit-section">
                  <strong>Remove Student:</strong>
                  <ul>
                    {editingBubble.students.map((stu) => (
                      <li key={stu.id}>
                        {stu.name} ({stu.email}){' '}
                        <button onClick={() =>
                          setEditingBubble(prev => ({
                            ...prev,
                            students: prev.students.filter(s => s.id !== stu.id)
                          }))
                        }>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="edit-section">
                  <strong>Remove Supervisor:</strong>
                  <ul>
                    {editingBubble.supervisors.map((sup) => (
                      <li key={sup.id}>
                        {sup.name} ({sup.email}){' '}
                        <button onClick={() =>
                          setEditingBubble(prev => ({
                            ...prev,
                            supervisors: prev.supervisors.filter(s => s.id !== sup.id)
                          }))
                        }>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="edit-section">
                  <strong>Add Unassigned Student:</strong>
                  <button onClick={() => setShowStudentModal(true)}>Add Student</button>
                </div>

                <div className="edit-section">
                  <strong>Add Supervisor:</strong>
                  <button onClick={() => setShowSupervisorModal(true)}>Add Supervisor</button>
                </div>

                <div className="edit-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleSaveEdit(bubble.id)}>Save</button>
                  <button onClick={() => setEditingBubble(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Student Modal */}
      {showStudentModal && (
        <div className="modal">
          <div className="modal-content">
            <h4>Select Student</h4>
           <Select
  isMulti
  options={unassignedStudents.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.email})`
  }))}
  value={selectedStudentIds.map(id => {
    const student = unassignedStudents.find(s => s.id === id);
    return {
      value: id,
      label: `${student?.name} (${student?.email})`
    };
  })}
  onChange={(selectedOptions) => {
    setSelectedStudentIds(selectedOptions.map(opt => opt.value));
  }}
  placeholder="Select one or more students..."
/>

            <div className="modal-actions">
    <button
    onClick={() => {
      const selectedStudents = unassignedStudents.filter(s =>
        selectedStudentIds.includes(s.id) &&
        !editingBubble.students.some(existing => existing.id === s.id)
      );

      if (selectedStudents.length === 0) return;

      setEditingBubble(prev => ({
        ...prev,
        students: [...prev.students, ...selectedStudents]
      }));

      setSelectedStudentIds([]);
      setShowStudentModal(false);
    }}
    disabled={selectedStudentIds.length === 0}
  >
    Save
  </button>


  <button onClick={() => {
    setSelectedStudentId(null);
    setShowStudentModal(false);
  }}>
    Cancel
  </button>
</div>

          </div>
        </div>
      )}

      {/* Supervisor Modal */}
      {/* Supervisor Modal */}
{showSupervisorModal && (
  <div className="modal">
    <div className="modal-content">
      <h4>Select Supervisor</h4>
      <select
  value={selectedSupervisorId !== null ? String(selectedSupervisorId) : ''}
  onChange={(e) => {
    setSelectedSupervisorId(e.target.value);
  }}
>
  <option value="">-- Select Supervisor --</option>
  {(room?.supervisors || [])
    .filter(s => !editingBubble?.supervisors?.some(sup => sup.id === s.id))
    .map((s) => (
      <option key={`${s.id}-${s.email}`} value={s.id}>
        {s.name} ({s.email})
      </option>
    ))}
</select>

<div className="modal-actions">
  <button
  onClick={() => {
    if (!selectedSupervisorId) return;

    const selected = room?.supervisors?.find(s => String(s.id) === String(selectedSupervisorId));
    if (!selected) return;

    // ✅ Prevent duplicate supervisors
    const alreadyAdded = editingBubble.supervisors.some(s => s.id === selected.id);
    if (alreadyAdded) return;

    // ✅ Add selected supervisor
    console.log("✅ Adding supervisor:", selected);
    setEditingBubble(prev => ({
      ...prev,
      supervisors: [...prev.supervisors, selected],
    }));

    setSelectedSupervisorId(null);
    setShowSupervisorModal(false);
  }}
  disabled={!selectedSupervisorId}
>
  Save
</button>



        <button
            onClick={() => {
            setSelectedSupervisorId(null);
            setShowSupervisorModal(false);
            }}
        >
            Cancel
        </button>
        </div>

    </div>
  </div>
)}

    </div>
  );
};

export default BubbleList;
