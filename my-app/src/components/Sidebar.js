// src/components/Sidebar.js
import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Home, LiveTv, Notifications, DirectionsCar, BarChart, Report, Settings } from '@mui/icons-material';
import './Sidebar.css';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const Sidebar = ({ isSidebarOpen, toggleSidebar,setActiveSection,activeSection }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleItemClick = (section) => {
    setActiveSection(section);
    if (isMobile) toggleSidebar(); // Auto-close sidebar on mobile after selection
  };

  const menuItems = [
    { text: 'Home', section: 'dashboard', icon: <Home /> },
    { text: 'Live Feeds', section: 'liveFeeds', icon: <LiveTv /> },
    { text: 'Alerts', section: 'alerts', icon: <Notifications /> },
    { text: 'Registered Vehicles', section: 'registeredVehicles', icon: <DirectionsCar /> },
    { text: 'Traffic Stats', section: 'trafficStats', icon: <BarChart /> },
    { text: 'Overspeeding Reports', section: 'overspeedingReports', icon: <Report /> },
    { text: 'Settings', section: 'settings', icon: <Settings /> },
  ];

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isSidebarOpen}
      onClose={toggleSidebar}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          top: '64px', // Ensure it appears below the header
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={activeSection === item.section}
            onClick={() => handleItemClick(item.section)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
