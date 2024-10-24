import React, { useState } from 'react'
import LiveFeeds from '../components/feed/LiveFeeds';
import { Box } from '@mui/material';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

function LiveFeedsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
          <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} activeSection='livefeeds' />
          </Box>
          <LiveFeeds />
        </Box>
        <Footer />
      </div>
    );
}

export default LiveFeedsPage
