// src/components/Header.js
import React from 'react';
import './Header.css';
import thaparLogo from './assets/thapar_logo.png'; // Adjust the path if necessary

const Header = () => {
  return (
    <header className="header">
      <div className="logo-container">
        <img src={thaparLogo} alt="TIET Logo" className="logo-image" />
        <span className="logo-text">TIET Vehicle Surveillance Dashboard</span>
      </div>
      <div className="current-datetime">{new Date().toLocaleString()}</div>
      <div className="admin-profile">
        {/* <button className="settings-button">Settings</button> */}
        <button className="logout-button">Logout</button>
      </div>
    </header>
  );
};

export default Header;
