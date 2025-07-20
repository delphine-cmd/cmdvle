// components/DashboardHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { CiHome } from 'react-icons/ci'; // Switched to match original Home icon
import MoreButton from './MoreButton';
import gimpaLogo from '../assets/gimpa.png';
import './DashboardHeader.css';

function DashboardHeader({ userEmail }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('gvle_token');
    navigate('/');
  };

  const handleHome = () => {
    navigate('/lecturer-dashboard');
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <img src={gimpaLogo} alt="GIMPA Logo" className="header-logo" />
        <h1 className="header-title">GIMPA Virtual Learning Environment</h1>
      </div>

      <div className="header-right">
        <button onClick={handleHome} className="home-btn" type="button">
          <CiHome size={20} style={{ marginRight: '4px' }} /> Home
        </button>

        <button onClick={handleLogout} className="logout-btn" type="button">
          <LuLogOut size={20} style={{ marginRight: '4px' }} /> Logout
        </button>

        <MoreButton />
      </div>
    </header>
  );
}

export default DashboardHeader;
