// src/components/LiveFeeds.js
import React from 'react';
import LiveFeed from './LiveFeed';
import { Grid2, Container } from '@mui/material';

const feeds = [
  { location: 'Location 1', isOverspeeding: false },
  { location: 'Location 2', isOverspeeding: true },
  // Add more feeds as needed
];

const LiveFeeds = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid2 container spacing={2}>
        {feeds.map((feed, index) => (
          <Grid2 key={index} xs={12} sm={6} md={4}>
            <LiveFeed location={feed.location} isOverspeeding={feed.isOverspeeding} />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default LiveFeeds;
