import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';  // Import useParams
import { PiStackPlus } from 'react-icons/pi';  // Correctly import PiStackPlus from react-icons
import './Stack.css';  // Importing the CSS file
import Folder from './Folder';
import Editor from './Editor'; 

import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { LuContrast } from 'react-icons/lu';

const Stack = ({ token, bubbleId, onOpenFolders }) => {
  const [stacks, setStacks] = useState([]);
  const [stackName, setStackName] = useState('');
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stackOptionsModal, setStackOptionsModal] = useState(null);
  const [openStackId, setOpenStackId] = useState(null);
  const [hoveredStackId, setHoveredStackId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [activeFile, setActiveFile] = useState(null);
  const [theme, setTheme] = useState('light');

  // Fetch all stacks for the bubble
  useEffect(() => {
    fetch(`http://localhost:4000/api/bubbles/${bubbleId}/stacks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
  if (Array.isArray(data)) {
    setStacks(data);
  } else {
    setStacks([]); 
  }
})

      .catch(err => {
  console.error(err);
  setError('Failed to fetch stacks');
  setStacks([]); 
});

  }, [bubbleId, token]);

  // Handle creating a new stack
  const handleCreateStack = async () => {
    if (!stackName) return;

    const response = await fetch(`http://localhost:4000/api/bubbles/${bubbleId}/stack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: stackName }),
    });

    const data = await response.json();
    if (response.ok) {
      setStacks((prevStacks) => [...prevStacks, data]);
      setStackName('');
      setShowModal(false);
    } else {
      setError(data.message || 'Error creating stack');
    }
  };

  // Handle stack options modal (when clicked)
  const handleStackClick = (stack) => {
    setStackOptionsModal(stack);
  };

  // Close stack options modal
  const closeStackOptionsModal = () => {
    setStackOptionsModal(null);
  };

  // Close modal when clicking outside
  const closeModalOnClickOutside = (e) => {
    if (e.target.className === 'modal-overlay') {
      setShowModal(false);
      setStackOptionsModal(null);
    }
  };

  // Handle stack deletion
 const handleRenameStack = (stack) => {
  setStackName(stack.name);
  setStackOptionsModal(stack); // store which stack you're renaming
  setShowModal(true);
};


const handleDeleteStack = async (stack) => {
  const response = await fetch(
    `http://localhost:4000/api/bubbles/${bubbleId}/stack/${stack.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    setStacks((prev) => prev.filter((s) => s.id !== stack.id));
    setStackOptionsModal(null);
  } else {
    setError(data.message || 'Error deleting stack');
  }
};

const handleFileClick = async (fileId) => {
  console.log('🧪 fileId being clicked:', fileId); // 🔍 Step 1: Is fileId defined?

  try {
    const res = await fetch(`http://localhost:4000/api/files/file/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log('📁 File loaded from backend:', data);

    if (data.content || data.filePath) {
      setActiveFile(data);
      setEditorContent(data.content || '');
      setEditorOpen(true);
    } else {
      console.error('⚠️ File has no content or filePath:', data);
    }
  } catch (err) {
    console.error('Error loading file:', err);
  }
};





const submitRenameStack = async () => {
  const response = await fetch(
    `http://localhost:4000/api/bubbles/${bubbleId}/stack/${stackOptionsModal.id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: stackName }),
    }
  );

  const data = await response.json();
  if (response.ok) {
    setStacks((prevStacks) =>
      prevStacks.map((s) =>
        s.id === stackOptionsModal.id ? { ...s, name: stackName } : s
      )
    );
    setShowModal(false);
    setStackOptionsModal(null);
    setStackName('');
  } else {
    setError(data.message || 'Error renaming stack');
  }
};

  // Placeholder functions for other options (add more functionality as needed)
  const handleNewFolder = () => {
    console.log('New Folder option clicked');
    // Implement functionality for creating a new folder
  };

  const handleNewFile = () => {
    console.log('New File option clicked');
    // Implement functionality for creating a new file
  };

  const handleCopyContent = () => {
    console.log('Copy Content option clicked');
    // Implement functionality for copying content
  };

  const handleCopyPath = () => {
    console.log('Copy Path option clicked');
    // Implement functionality for copying path
  };

  // Handle creating a new folder
  



  return (
    
  <div className={`stack-layout ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
    <div className="stack-container">
      {error && <div className="error-message">{error}</div>}
      <div className="theme-toggle">
  <LuContrast
    className="theme-toggle-icon"
    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    style={{
      cursor: 'pointer',
      fontSize: '1.2rem',
      color: theme === 'dark' ? '#908888' : '#333',
      transition: 'color 0.3s ease'
    }}
    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
  />
</div>

      {/* Main Stack Page Header with Create Stack icon */}
     
      <div className="stack-page-header">
        <h1>Stacks <PiStackPlus onClick={() => setShowModal(true)} /></h1>
      </div>


      <div>
        {stacks.length === 0 ? (
          <h3>No Stacks Available</h3>
        ) : (
         
        <ul>
  {stacks.map((stack) => (
    <div key={stack.id}>
      <li className="stack-item">
        <div
          className="stack-header-toggle"
          onClick={() =>
            setOpenStackId((prev) => (prev === stack.id ? null : stack.id))
          }
        >
          {openStackId === stack.id ? (
            <BsChevronDown className="chevron-icon" />
          ) : (
            <BsChevronRight className="chevron-icon" />
          )}
         
         <div
        className="stack-name-container"
        onMouseEnter={() => setHoveredStackId(stack.id)}
        onMouseLeave={() => setHoveredStackId(null)}
      >
        <span>{stack.name}</span>
       {hoveredStackId === stack.id && (
      <div
        className="stack-actions"
        onMouseEnter={() => setHoveredStackId(stack.id)}
        onMouseLeave={() => setHoveredStackId(null)}
      >
        <CiEdit
          className="stack-icon edit-icon"
          onClick={() => handleRenameStack(stack)}
        />
        <RiDeleteBin6Line
          className="stack-icon delete-icon"
          onClick={() => handleDeleteStack(stack)}
        />
      </div>
    )}

      </div>


        </div>
      </li>

      {openStackId === stack.id && (
        <div className="inline-folder-container">
         <Folder
          token={token}
          stackId={stack.id}
          onFileClick={handleFileClick}
        />

        </div>
      )}
        </div>
      ))}
      </ul>
        )}
      </div>

      {/* Modal for creating or renaming a stack */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModalOnClickOutside}>
          <div className="modal-content">
            <h3>{stackOptionsModal ? 'Rename Stack' : 'Create New Stack'}</h3>
            <input
              type="text"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              placeholder="Enter stack name"
            />
            {stackOptionsModal ? (
            <button onClick={submitRenameStack}>Rename Stack</button>
          ) : (
            <button onClick={handleCreateStack}>Create Stack</button>
          )}
         </div>
        </div>
      )}
     </div>
    {editorOpen && activeFile && (
  <div className="stack-editor-panel">
    <Editor
  file={activeFile}
  content={editorContent}
  onChange={(newContent) => setEditorContent(newContent)}
/>
  </div>
)}


     </div> 
    );
  };
  export default Stack;
