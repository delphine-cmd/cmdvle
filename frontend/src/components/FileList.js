import React, { useEffect, useState, useRef } from 'react';
import './FileList.css'; 

const FileList = ({ folderId, token, showInput = false, onFileCreated, onFileClick }) => {
const [files, setFiles] = useState([]);
const [newFileName, setNewFileName] = useState('');
const [hoveredFileId, setHoveredFileId] = useState(null);
const [uploadedFile, setUploadedFile] = useState(null);
const [uploadProgress, setUploadProgress] = useState(null);
const [successMessage, setSuccessMessage] = useState('');
const inputRef = useRef(null);

  const fetchFiles = () => {
    if (!folderId) return;

    fetch(`http://localhost:4000/api/files/${folderId}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setFiles)
      .catch(console.error);
  };

  useEffect(() => {
    fetchFiles();
  }, [folderId, token]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (inputRef.current && !inputRef.current.contains(event.target)) {
      setUploadedFile(null);
      setNewFileName('');
    }
  };

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);


  const handleCreateFile = async () => {
  if (!newFileName.trim()) return;

  let response;

  if (uploadedFile) {
    // File upload mode
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('name', newFileName);

  response = await new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `http://localhost:4000/api/files/${folderId}/upload`, true);
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(percent);
    }
  };

  xhr.onload = () => {
    const res = new Response(xhr.responseText, {
      status: xhr.status,
      statusText: xhr.statusText,
    });
    resolve(res);
  };

  xhr.onerror = () => {
  setSuccessMessage('❌ Failed to upload');
  setTimeout(() => setSuccessMessage(''), 3000);
  reject(new Error('Upload failed'));
};

  xhr.send(formData);
});

  } else {
    // Manual name mode
    response = await fetch(`http://localhost:4000/api/files/${folderId}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newFileName, content: '' }),
    });
  }

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || 'Error creating file');
    return;
  }

fetchFiles();
setNewFileName('');
setUploadedFile(null); // Reset upload state
setSuccessMessage('Upload successful!');
setUploadProgress(0); // Reset progress bar
setTimeout(() => setSuccessMessage(''), 3000); // Hide after 3s
if (onFileCreated) onFileCreated();
};


  const handleFileAction = async (action, file) => {
    const fileId = file.id;

    switch (action) {
      case 'delete':
        const confirmDelete = window.confirm("Are you sure you want to delete this file?");
        if (!confirmDelete) return;

        const response = await fetch(`http://localhost:4000/api/files/file/${fileId}`, {
          method: 'DELETE',
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchFiles();
        } else {
          alert('Error deleting file');
        }
        break;

      case 'rename':
        const newName = prompt('Enter new file name:');
        if (newName) {
          await fetch(`http://localhost:4000/api/files/file/${fileId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newName }),
      });

        }
        break;

      case 'lock':
      case 'unlock':
        const lockStatus = action === 'lock'; // true for lock, false for unlock

        const lockResponse = await fetch(`http://localhost:4000/api/files/file/${fileId}/lock`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isLocked: lockStatus }),
        });

        if (lockResponse.ok) {
          fetchFiles();
        } else {
          alert('Error locking/unlocking file');
        }
        break;

      case 'request-access':
        const accessResponse = await fetch(`http://localhost:4000/api/files/file/${file.id}/access-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (accessResponse.ok) {
          alert('Access request sent successfully');
        } else {
          const data = await accessResponse.json();
          alert(data.message || 'Error requesting access');
        }
        break;

      default:
        return;
    }

    fetchFiles();
  };

return (
  <div className="file-list" ref={inputRef}>
       {successMessage && (
    <div className="success-message">
        {successMessage}
    </div>
    )}


      {showInput && (
  <div className="new-file-input">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <strong>Add File</strong>
     <span
  style={{ cursor: 'pointer', color: '#888', fontSize: '15px' }}
  onClick={() => {
    setUploadedFile(null);
    setNewFileName('');
    if (typeof onFileCreated === 'function') {
      onFileCreated(); // Tell Folder.js to hide the input
    }
  }}
>
  ✖
</span>

    </div>


    <input
      type="text"
      placeholder="Enter file name"
      value={newFileName}
      onChange={(e) => setNewFileName(e.target.value)}
    />
    
    {uploadedFile && (
    <div className="upload-progress">
        <span>Uploading: {uploadProgress}%</span>
        <progress value={uploadProgress} max="100" />
    </div>
    )}

    <input
  type="file"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFileName(file.name);
      setUploadedFile(file);
    }
    }}
    style={{
        marginTop: '8px',
        color: uploadedFile ? 'inherit' : '#999'
    }}
    />
        <button onClick={handleCreateFile}>Create</button>
        {uploadProgress > 0 && uploadProgress < 100 && (
    <div className="upload-progress-bar">
        <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
        {uploadProgress}%
        </div>
    </div>
    )}
    </div>
    )}


      <ul>
        {files.map((file) => (
          <li
            key={file.id}
            className="file-item"
            onMouseEnter={() => setHoveredFileId(file.id)}
            onMouseLeave={() => setHoveredFileId(null)}
            style={{ position: 'relative', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}
            >
            {/* File Name Section */}
            <div className="file-name-container" style={{ marginBottom: '5px' }}>
                <span
                className="file-name"
                style={{ cursor: 'pointer', color: '#003366', textDecoration: 'underline' }}
                onClick={() => onFileClick?.(file.id)}

              >
                {file.name}
              </span>

            </div>

            {/* Combined Metadata and Actions Section */}
            {hoveredFileId === file.id && (
                <div className="file-details" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  {/* Metadata Section */}
  <div className="file-meta-container">
    <div className="file-meta" style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ display: 'block' }}>Creator: {file.creatorName}</span>
      <span style={{ display: 'block' }}>
      Date: {new Date(file.creationDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).replace(/\//g, '-')}
    </span>

      <span style={{ display: 'block' }}>Time: {file.creationTime}</span>
    </div>
  </div>

  {/* File Actions BELOW metadata now */}
  <div
    className="file-actions"
    style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '10px',
    }}
  >
    <button onClick={() => handleFileAction('rename', file)}>Rename</button>
    <button onClick={() => handleFileAction('delete', file)}>Delete</button>
    <button onClick={() => handleFileAction(file.isLocked ? 'unlock' : 'lock', file)}>
      {file.isLocked ? 'Unlock' : 'Lock'}
    </button>
    {file.isLocked && (
      <button onClick={() => handleFileAction('request-access', file)}>
        Request Access
      </button>
    )}
  </div>
</div>
     )}
   </li>
    ))}
    </ul>
    </div>
    );
   };
 export default FileList;
