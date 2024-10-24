// src/components/Alerts.js
import React from 'react';
import Alert from './Alert';
import { Grid2,Container } from '@mui/material';

const alerts = [
    { vehicleNumber: 'AB123CD', speed: 80, location: 'Area 1', timestamp: '2024-08-23 10:00' },
    { vehicleNumber: 'EF456GH', speed: 95, location: 'Area 2', timestamp: '2024-08-23 10:05' },
    { vehicleNumber: 'IJ789KL', speed: 110, location: 'Area 3', timestamp: '2024-08-23 10:10' },
    { vehicleNumber: 'MN012OP', speed: 120, location: 'Area 4', timestamp: '2024-08-23 10:15' },
    { vehicleNumber: 'QR345ST', speed: 70, location: 'Area 5', timestamp: '2024-08-23 10:20' },
  ];

const Alerts = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 ,mb:4}}>
      <Grid2 container spacing={2}>
        {alerts.map((alert, index) => (
          <Grid2 key={index} size={{xs:12}}>
            <Alert {...alert} />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default Alerts;
