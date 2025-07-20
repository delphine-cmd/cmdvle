import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function VerifyEmailScreen() {
  const { token } = useParams();
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${API}/api/verify-email/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setMessage(data.message || 'Verification failed.');
        } else {
          setMessage('Email verified! Redirecting to login...');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setMessage('An error occurred while verifying.');
      }
    };

    verify();
  }, [token, API, navigate]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h2>{message}</h2>
    </div>
  );
}

export default VerifyEmailScreen;
