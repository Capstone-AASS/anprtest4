// src/components/Alerts.js
import React from 'react';
import Alert from './Alert';
import { Grid2,Container } from '@mui/material';

const alerts = [
  { vehicleNumber: 'AB123CD', speed: 80, location: 'Area 1', timestamp: '2024-08-23 10:00' },
  { vehicleNumber: 'EF456GH', speed: 95, location: 'Area 2', timestamp: '2024-08-23 10:05' },
  // Add more alerts as needed
];

const Alerts = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid2 container spacing={2}>
        {alerts.map((alert, index) => (
          <Grid2 key={index} xs={12}>
            <Alert {...alert} />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default Alerts;
