// src/components/Dashboard.js
import React from 'react';
import {Grid2, Box, Typography, CardMedia, Container } from '@mui/material';
import thaparLogo from '../../../public/assets/thapar_log.jpg';

const Dashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box 
        sx={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: 2, p: 3 }}
      >
        <Grid2 container spacing={2} alignItems="center">
          <Grid2 xs={12} md={7}>
            <Typography variant="h3" gutterBottom>Vehicle Surveillance System</Typography>
            <Typography variant="subtitle1" gutterBottom>For Enhanced Safety at Thapar University</Typography>
            <Typography variant="body1">
              The Vehicle Surveillance System provides comprehensive monitoring and analysis of vehicular movements. 
              Here, you'll find insights into live feeds, alerts for overspeeding, registered vehicles, traffic statistics, and more.
            </Typography>
          </Grid2>
          <Grid2 xs={12} md={5}>
            <CardMedia 
              component="img" 
              image={thaparLogo} 
              alt="Thapar University" 
              sx={{ borderRadius: '12px', width: '100%' }} 
            />
          </Grid2>
        </Grid2>
      </Box>
    </Container>
  );
};

export default Dashboard;
