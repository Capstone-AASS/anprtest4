// src/components/Sidebar.js
import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ setActiveSection }) => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleItemClick = (section) => {
    setActiveItem(section);
    setActiveSection(section);
  };

  return (
    <aside className="sidebar">
      <ul>
        <li
          className={activeItem === 'dashboard' ? 'active' : ''}
          onClick={() => handleItemClick('dashboard')}
        >
          Home
        </li>
        <li
          className={activeItem === 'liveFeeds' ? 'active' : ''}
          onClick={() => handleItemClick('liveFeeds')}
        >
          Live Feeds
        </li>
        <li
          className={activeItem === 'alerts' ? 'active' : ''}
          onClick={() => handleItemClick('alerts')}
        >
          Alerts
        </li>
        <li
          className={activeItem === 'registeredVehicles' ? 'active' : ''}
          onClick={() => handleItemClick('registeredVehicles')}
        >
          Registered Vehicles
        </li>
        <li
          className={activeItem === 'trafficStats' ? 'active' : ''}
          onClick={() => handleItemClick('trafficStats')}
        >
          Traffic Stats
        </li>
        <li
          className={activeItem === 'overspeedingReports' ? 'active' : ''}
          onClick={() => handleItemClick('overspeedingReports')}
        >
          Overspeeding Reports
        </li>
        <li
          className={activeItem === 'settings' ? 'active' : ''}
          onClick={() => handleItemClick('settings')}
        >
          Settings
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
