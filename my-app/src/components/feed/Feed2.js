import React, { useEffect, useRef, useState } from 'react';
import { Container, Grid2 } from '@mui/material';
import { Device } from 'mediasoup-client';
import LiveFeed from './LiveFeed';

const LiveFeeds = () => {
    const [feeds, setFeeds] = useState([
        { feedId: 'feed1', location: 'Location 1', isOverspeeding: false, videoSrc: null },
        { feedId: 'feed2', location: 'Location 2', isOverspeeding: true, videoSrc: null },
        // Add more feeds as needed
    ]);

    const socketRef = useRef(null);
    const deviceRef = useRef(null);
    const consumerTransportRef = useRef(null);

    // Utility function to validate JSON strings
    const isJsonString = (str) => {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    };

    // Load Mediasoup Device with router RTP capabilities
    const loadDevice = async (routerRtpCapabilities) => {
        try {
            deviceRef.current = new Device();
            await deviceRef.current.load({ routerRtpCapabilities });
            console.log('Device loaded with RTP capabilities:', deviceRef.current);
        } catch (error) {
            console.error('Failed to load device:', error);
        }
    };

    // Start the consumer transport and handle RTP connection
    const startConsumerTransport = async (transportData) => {
        try {
            consumerTransportRef.current = deviceRef.current.createRecvTransport(transportData);

            consumerTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
                const message = {
                    type: 'connectConsumerTransport',
                    data: { dtlsParameters },
                };
                socketRef.current.send(JSON.stringify(message));

                socketRef.current.onmessage = (event) => {
                    const response = JSON.parse(event.data);
                    if (response.type === 'consumerTransportConnected') {
                        callback();
                    } else if (response.type === 'error') {
                        errback(response.data.message);
                    }
                };
            });

            consumerTransportRef.current.on('connectionstatechange', (state) => {
                console.log('Consumer transport state:', state);
                if (state === 'failed') {
                    console.error('Consumer transport failed');
                    consumerTransportRef.current.close();
                }
            });
        } catch (error) {
            console.error('Error starting consumer transport:', error);
        }
    };

    // Subscribe to a video feed
    const subscribeToFeed = async (feedId) => {
        const message = {
            type: 'startFeed',
            data: { feedId },
        };
        socketRef.current.send(JSON.stringify(message));

        socketRef.current.onmessage = async (event) => {
            const response = JSON.parse(event.data);
            if (response.type === 'consumerCreated') {
                const consumer = await consumerTransportRef.current.consume({
                    id: response.data.id,
                    producerId: response.data.producerId,
                    kind: response.data.kind,
                    rtpParameters: response.data.rtpParameters,
                });

                const stream = new MediaStream();
                stream.addTrack(consumer.track);

                // Update the video source for the appropriate feed
                setFeeds((prevFeeds) =>
                    prevFeeds.map((feed) =>
                        feed.feedId === feedId ? { ...feed, videoSrc: stream } : feed
                    )
                );

                consumer.on('trackended', () => {
                    console.log('Track ended');
                });

                consumer.on('transportclose', () => {
                    console.log('Transport closed');
                });
            }
        };
    };

    // Stop the feed and reset video source
    const stopFeed = (feedId) => {
        const message = {
            type: 'stopFeed',
            data: { feedId },
        };
        socketRef.current.send(JSON.stringify(message));

        setFeeds((prevFeeds) =>
            prevFeeds.map((feed) =>
                feed.feedId === feedId ? { ...feed, videoSrc: null } : feed
            )
        );
    };

    // Initialize WebSocket connection and handle server events
    useEffect(() => {
        socketRef.current = new WebSocket('ws://localhost:8000/ws');
        socketRef.current.onopen = () => {
            console.log('WebSocket connected');
            socketRef.current.send(JSON.stringify({ type: 'getRouterRtpCapabilities' }));
        };

        socketRef.current.onmessage = (message) => {
            if (!isJsonString(message.data)) return;
            const response = JSON.parse(message.data);

            switch (response.type) {
                case 'routerRtpCapabilities':
                    loadDevice(response.data);
                    break;
                case 'consumerTransportCreated':
                    startConsumerTransport(response.data);
                    break;
                default:
                    console.error('Unknown WebSocket message type:', response.type);
                    break;
            }
        };

        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    return (
        <Container>
            <Grid2 container spacing={2}>
                {feeds.map((feed) => (
                    <Grid2 item xs={12} md={6} key={feed.feedId}>
                        <LiveFeed
                            {...feed}
                            startFeed={() => subscribeToFeed(feed.feedId)}
                            stopFeed={() => stopFeed(feed.feedId)}
                        />
                    </Grid2>
                ))}
            </Grid2>
        </Container>
    );
};

export default LiveFeeds;
