// components/CreateStackForm.js

import React, { useState } from 'react';
import axios from 'axios';

const CreateStackForm = ({ bubbleId, onStackCreated }) => {
  const [stackName, setStackName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken'); // or get from wherever you're storing JWT
      const response = await axios.post(
        `/api/bubbles/${bubbleId}/stack`,
        { name: stackName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Call the parent function to refresh the stack list
      onStackCreated(response.data);
      setStackName('');
      setError('');
    } catch (err) {
      setError('Failed to create stack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-stack-form">
      <h2>Create a New Stack</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Stack Name"
          value={stackName}
          onChange={(e) => setStackName(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Stack'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default CreateStackForm;
