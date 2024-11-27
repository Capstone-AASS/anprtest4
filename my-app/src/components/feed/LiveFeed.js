import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';

const LiveFeed = ({ location, isOverspeeding, publish, videoSrc }) => {
    return (
      <Card sx={{ borderRadius: '12px', boxShadow: 3, overflow: 'hidden', mb: 2 }} onClick={publish}>
        {/* Video feed */}
        <CardMedia
          component="video"
          controls
          sx={{ height: 200, objectFit: 'cover' }}
          src={videoSrc}
          title="Live Feed Video"
        />
  
        {/* Feed Info */}
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {location}
          </Typography>
  
          {/* Alert Indicator */}
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: isOverspeeding ? '#dc3545' : '#28a745', // Red for overspeeding, green otherwise
              animation: isOverspeeding? 'blinking 1s infinite':'none', // Blinking animation for overspeeding
            }}
          />
        </CardContent>
      </Card>
    );
  };

export default LiveFeed;
