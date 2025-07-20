import React, { useState, useEffect } from 'react';
import './Folder.css';
import FileList from './FileList';
import {
  BsChevronDown,
  BsChevronRight,
} from 'react-icons/bs';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { HiOutlineDocumentPlus, HiOutlineFolderPlus } from 'react-icons/hi2';
import { LuCopy } from 'react-icons/lu';

const Folder = ({ token, stackId, parentId = null, onUploadSuccess, onFileClick }) => {
  const [allFolders, setAllFolders] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [folderToRename, setFolderToRename] = useState(null);
  const [openFolderId, setOpenFolderId] = useState(null);
  const [showNewFileInputForFolder, setShowNewFileInputForFolder] = useState(null);
  const [hoveredFolderId, setHoveredFolderId] = useState(null);
  const [createInFolderId, setCreateInFolderId] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:4000/api/stacks/${stackId}/folders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch folders');
        return res.json();
      })
      .then(setAllFolders)
      .catch(err => setError(err.message || 'Failed to fetch folders'));
  }, [stackId, token]);

  const filteredFolders = allFolders.filter(f => f.parentId === parentId);

  const handleCreateFolder = async () => {
    if (!folderName) return;

    const response = await fetch(`http://localhost:4000/api/stacks/${stackId}/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: folderName,
        parentId: createInFolderId || parentId || null,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Error creating folder');
      return;
    }

    setAllFolders(prev => [...prev, data]);
    setFolderName('');
    setShowModal(false);
    setCreateInFolderId(null);
  };

  const handleRenameFolder = (folder) => {
    setFolderName(folder.name);
    setFolderToRename(folder);
    setShowModal(true);
  };

  const submitRenameFolder = async () => {
    const response = await fetch(
      `http://localhost:4000/api/stacks/${stackId}/folder/${folderToRename.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Error renaming folder');
      return;
    }

    setAllFolders(prev =>
      prev.map(f => (f.id === folderToRename.id ? { ...f, name: folderName } : f))
    );
    setShowModal(false);
    setFolderToRename(null);
    setFolderName('');
  };

  const handleDeleteFolder = async (folder) => {
    const response = await fetch(
      `http://localhost:4000/api/stacks/${stackId}/folder/${folder.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      setAllFolders(prev => prev.filter(f => f.id !== folder.id));
    } else {
      const data = await response.json();
      setError(data.message || 'Error deleting folder');
    }
  };

  const toggleFolderFiles = (folderId) => {
    setOpenFolderId(prev => (prev === folderId ? null : folderId));
    setShowNewFileInputForFolder(null);
  };

  const openFileInputForFolder = (folderId) => {
    setOpenFolderId(folderId);
    setShowNewFileInputForFolder(folderId);
  };

  const handleCopyPath = (folderId) => {
    const path = `/stacks/${stackId}/folder/${folderId}`;
    navigator.clipboard.writeText(path);
  };

  const closeModalOnClickOutside = (e) => {
    if (e.target.className === 'modal-overlay') {
      setShowModal(false);
      setFolderToRename(null);
      setFolderName('');
    }
  };

  return (
    <div className="folder-wrapper">
      {error && <div className="folder-error-message">{error}</div>}

      {!parentId && (
        <div className="folder-page-header">
          <h1>Folders</h1>
          <HiOutlineFolderPlus
            className="folder-add-icon"
            onClick={() => {
              setShowModal(true);
              setCreateInFolderId(null);
            }}
            title="New Folder"
          />
        </div>
      )}
<div className="folder-scroll-container">
      <ul>
        {filteredFolders.map((folder) => (
          <li
            key={folder.id}
            className="folder-item"
            onMouseEnter={() => setHoveredFolderId(folder.id)}
            onMouseLeave={() => setHoveredFolderId(null)}
          >
            <div className="folder-header-toggle" onClick={() => toggleFolderFiles(folder.id)}>
              {openFolderId === folder.id ? (
                <BsChevronDown className="chevron-icon" />
              ) : (
                <BsChevronRight className="chevron-icon" />
              )}
              <span className="folder-name">{folder.name}</span>

              {hoveredFolderId === folder.id && (
                <div className="folder-actions">
                  <HiOutlineDocumentPlus
                    className="folder-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileInputForFolder(folder.id);
                    }}
                    title="New File"
                  />
                  <HiOutlineFolderPlus
                    className="folder-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateInFolderId(folder.id);
                      setShowModal(true);
                    }}
                    title="New Folder"
                  />
                  <CiEdit
                    className="folder-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameFolder(folder);
                    }}
                    title="Rename"
                  />
                  <RiDeleteBin6Line
                    className="folder-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                    title="Delete"
                  />
                  <LuCopy
                    className="folder-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPath(folder.id);
                    }}
                    title="Copy Path"
                  />
                </div>
              )}
            </div>

            {openFolderId === folder.id && (
              <>
                <div className="file-list-container">
                  <FileList
                  folderId={folder.id}
                  token={token}
                  onFileClick={onFileClick}
                  showInput={showNewFileInputForFolder === folder.id}
                  onFileCreated={() => {
                    setShowNewFileInputForFolder(null);
                    if (onUploadSuccess) onUploadSuccess();
                  }}
                />

                </div>
                <Folder
                token={token}
                stackId={stackId}
                parentId={folder.id}
                onUploadSuccess={onUploadSuccess}
              />
              </>
            )}
          </li>
        ))}
      </ul>
</div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModalOnClickOutside}>
          <div className="folder-modal-content glass" onClick={(e) => e.stopPropagation()}>
            <h3>{folderToRename ? 'Rename Folder' : 'Create New Folder'}</h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
            />
            <button onClick={folderToRename ? submitRenameFolder : handleCreateFolder}>
              {folderToRename ? 'Rename Folder' : 'Create Folder'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Folder;
