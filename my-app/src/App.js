// src/App.js
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainSection from './components/MainSection';
import Footer from './components/Footer';
import './App.css';
import { Box } from '@mui/material';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className="app">
      <Header toggleSidebar={toggleSidebar} />

      {/* Main layout container */}
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar */}
        <Box display={isSidebarOpen?'block':'none'}>
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setActiveSection={setActiveSection} activeSection={activeSection} />
        </Box>
        <MainSection activeSection={activeSection} />
      </Box>
      <Footer />
    </div>
  );
}

export default App;
