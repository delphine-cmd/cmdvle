import React, { useState } from 'react';
import './BubbleModal.css';

const BubbleModal = ({ students, supervisors, onClose, onAutoAssign, nextBubbleNumber }) => {
  const [bubbleCount, setBubbleCount] = useState(1);

  const handleAutoAssign = () => {
    onAutoAssign(bubbleCount);
    onClose();
  };

  return (
    <div className="bubble-modal-overlay">
      <div className="bubble-modal">
        <h2>Create Bubbles</h2>

        <label>Number of bubbles to create:</label>
        <input
          type="number"
          min="1"
          value={bubbleCount}
          onChange={(e) => setBubbleCount(parseInt(e.target.value))}
        />

        <div className="modal-section">
          <h3>Unassigned Students</h3>
          {students.length > 0 ? (
            students.map((stu, i) => (
              <div key={i} className="participant-row">{stu.name}</div>
            ))
          ) : (
            <p>No unassigned students.</p>
          )}
        </div>

        <div className="modal-section">
          <h3>All Supervisors</h3>
          {supervisors.length > 0 ? (
            supervisors.map((sup, i) => (
              <div key={i} className="participant-row">{sup.name}</div>
            ))
          ) : (
            <p>No supervisors in this room.</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="assign-btn" onClick={handleAutoAssign}>Auto Assign Bubbles</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default BubbleModal;
