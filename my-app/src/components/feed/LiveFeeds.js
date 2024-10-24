// src/components/LiveFeeds.js
import React from 'react';
import LiveFeed from './LiveFeed';
import { Grid2, Container } from '@mui/material';

const feeds = [
    { location: 'Location 1', isOverspeeding: false },
    { location: 'Location 2', isOverspeeding: true },
    { location: 'Location 3', isOverspeeding: false },
    { location: 'Location 4', isOverspeeding: true },
    { location: 'Location 5', isOverspeeding: false },
    { location: 'Location 6', isOverspeeding: true },
    { location: 'Location 7', isOverspeeding: false },
    { location: 'Location 8', isOverspeeding: true },
];

const LiveFeeds = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid2 container spacing={2}>
        {feeds.map((feed, index) => (
          <Grid2 key={index} size={{xs:12,md:4, sm:6}}>
            <LiveFeed location={feed.location} isOverspeeding={feed.isOverspeeding} />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default LiveFeeds;
