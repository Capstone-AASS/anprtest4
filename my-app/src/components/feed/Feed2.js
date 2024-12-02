// src/components/LiveFeeds.js

import React, { useState, useEffect, useRef } from 'react';
import { Device } from 'mediasoup-client';
import { Container, Grid, Button, Typography } from '@mui/material';
import LiveFeed from './LiveFeed'; // Ensure this path is correct

const LiveFeeds = () => {
  const [feeds, setFeeds] = useState([]); // State to manage feeds
  const [deviceLoaded, setDeviceLoaded] = useState(false); // State to track device readiness
  const [error, setError] = useState(null); // State to handle errors

  // Refs to manage mutable variables
  const deviceRef = useRef(null);
  const socketRef = useRef(null);
  const producerTransportRef = useRef(null);
  const consumerTransportRef = useRef(null);

  // Utility function to validate JSON strings
  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (error) {
      return false;
    }
    return true;
  };

  // Function to send messages to the server
  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  // Function to load Mediasoup device with router RTP capabilities
  const loadDevice = async (routerRtpCapabilities) => {
    try {
      deviceRef.current = new Device();
      await deviceRef.current.load({ routerRtpCapabilities });
      console.log('Mediasoup Device loaded:', deviceRef.current);
      setDeviceLoaded(true);
    } catch (error) {
      if (error.name === 'UnsupportedError') {
        console.error('Browser not supported');
        setError('Browser not supported for Mediasoup');
      } else {
        console.error('Failed to load Mediasoup Device:', error);
        setError('Failed to load Mediasoup Device');
      }
    }
  };

  // Handler for router RTP capabilities
  const onRouterCapabilities = (resp) => {
    if (resp.type === 'routerRtpCapabilities') {
      console.log('Received router RTP Capabilities:', resp.data);
      loadDevice(resp.data.routerRtpCapabilities);
    }
  };

  // Handler for producer transport creation
  const onProducerTransportCreated = (message) => {
    if (message.type === 'producerTransportCreated') {
      createProducerTransport(message.data);
    } else if (message.type === 'error') {
      console.error('Error creating producer transport:', message.data);
      setError(message.data);
    }
  };

  // Function to create producer transport
  const createProducerTransport = async (transportParams) => {
    try {
      const transport = deviceRef.current.createSendTransport(transportParams);
      console.log('Producer transport created:', transport);

      // Handle transport connection
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        const message = {
          type: 'connectProducerTransport',
          transportId: transport.id,
          dtlsParameters,
        };
        sendMessage(message);

        // Listen for server confirmation
        const handleMessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'producerTransportConnected') {
            console.log('Producer transport connected');
            callback();
            socketRef.current.removeEventListener('message', handleMessage);
          } else if (msg.type === 'error') {
            errback(msg.data);
            socketRef.current.removeEventListener('message', handleMessage);
          }
        };

        socketRef.current.addEventListener('message', handleMessage);
      });

      // Handle produce event
      transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        const message = {
          type: 'produce',
          transportId: transport.id,
          kind,
          rtpParameters,
        };
        sendMessage(message);

        const handleMessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'producerCreated') {
            console.log('Producer created:', msg.data.id);
            callback({ id: msg.data.id });
            socketRef.current.removeEventListener('message', handleMessage);
          } else if (msg.type === 'error') {
            errback(msg.data);
            socketRef.current.removeEventListener('message', handleMessage);
          }
        };

        socketRef.current.addEventListener('message', handleMessage);
      });

      // Handle transport state changes
      transport.on('connectionstatechange', (state) => {
        console.log('Producer Transport state:', state);
        switch (state) {
          case 'connected':
            console.log('Producer transport connected');
            break;
          case 'failed':
            console.error('Producer transport connection failed');
            transport.close();
            setError('Producer transport connection failed');
            break;
          default:
            break;
        }
      });

      producerTransportRef.current = transport; // Store the transport reference

      // Access user media and create a producer
      let stream;
      try {
        stream = await getUserMedia();
        if (!stream) {
          console.error('No media stream available');
          setError('No media stream available');
          return;
        }
        const track = stream.getVideoTracks()[0];
        const params = { track };
        const producer = await transport.produce(params);
        console.log('Producer created:', producer.id);
      } catch (error) {
        console.error('Error creating producer:', error);
        setError('Error creating producer');
      }
    } catch (error) {
      console.error('Error in createSendTransport:', error);
      setError('Error creating producer transport');
    }
  };

  // Handler for consumer transport creation
  const onConsumerTransportCreated = (message) => {
    if (message.type === 'consumerTransportCreated') {
      createConsumerTransport(message.data);
    } else if (message.type === 'error') {
      console.error('Error creating consumer transport:', message.data);
      setError(message.data);
    }
  };

  // Function to create consumer transport
  const createConsumerTransport = async (transportParams) => {
    console.log('Consumer Transport Params:', transportParams); // Debug Statement
    try {
        const transport = deviceRef.current.createRecvTransport(transportParams);
        console.log('Consumer transport created:', transport);

        // Handle transport connection
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            const message = {
                type: 'connectConsumerTransport',
                transportId: transport.id,
                dtlsParameters,
            };
            sendMessage(message);

            const handleMessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'consumerTransportConnected') {
                    console.log('Consumer transport connected');
                    callback();
                    socketRef.current.removeEventListener('message', handleMessage);
                } else if (msg.type === 'error') {
                    errback(msg.data);
                    socketRef.current.removeEventListener('message', handleMessage);
                }
            };

            socketRef.current.addEventListener('message', handleMessage);
        });

        // Handle transport state changes
        transport.on('connectionstatechange', (state) => {
            console.log('Consumer Transport state:', state);
            switch (state) {
                case 'connected':
                    console.log('Consumer transport connected');
                    break;
                case 'failed':
                    console.error('Consumer transport connection failed');
                    transport.close();
                    setError('Consumer transport connection failed');
                    break;
                default:
                    break;
            }
        });

        consumerTransportRef.current = transport; // Store the transport reference

        // Initiate consume process
        consume(transport);
    } catch (error) {
        console.error('Error in createRecvTransport:', error);
        setError('Error creating consumer transport');
    }
};

  // Handler for subscribed consumer
  const onSubscribed = (message) => {
    if (message.type === 'consumerSubscribed') {
      const { id, producerId, kind, rtpParameters } = message.data;
      createConsumer(id, producerId, kind, rtpParameters);
    } else if (message.type === 'error') {
      console.error('Error subscribing:', message.data);
      setError(message.data);
    }
  };

  // Function to consume a stream
  const createConsumer = async (consumerId, producerId, kind, rtpParameters) => {
    try {
      const consumer = await consumerTransportRef.current.consume({
        id: consumerId,
        producerId,
        kind,
        rtpParameters,
        paused: false,
      });

      console.log('Consumer created:', consumer.id);

      const stream = new MediaStream();
      stream.addTrack(consumer.track);

      setFeeds((prevFeeds) => [
        ...prevFeeds,
        {
          id: consumer.id,
          producerId,
          kind,
          stream,
        },
      ]);

      consumer.on('trackended', () => {
        console.log('Consumer track ended:', consumer.id);
        consumer.close();
        setFeeds((prevFeeds) => prevFeeds.filter((feed) => feed.id !== consumer.id));
      });

      consumer.on('transportclose', () => {
        console.log('Consumer transport closed:', consumer.id);
        consumer.close();
        setFeeds((prevFeeds) => prevFeeds.filter((feed) => feed.id !== consumer.id));
      });
    } catch (error) {
      console.error('Error consuming stream:', error);
      setError('Error consuming stream');
    }
  };

  // Function to initiate consuming a stream
  const consume = async (transport) => {
    const message = {
      type: 'consume',
      consumerTransportId: transport.id,
      rtpCapabilities: deviceRef.current.rtpCapabilities,
      producerId: '/* Replace with actual producerId */',
    };
    sendMessage(message);
  };

  // Function to access user media
  const getUserMedia = async () => {
    if (!deviceRef.current.canProduce('video')) {
      console.error('Cannot produce video');
      setError('Cannot produce video');
      return null;
    }
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Error accessing media devices');
    }
    return stream;
  };

  // Function to subscribe to a new feed
  const subscribe = () => {
    if (!deviceLoaded) {
      console.warn('Device not loaded yet');
      setError('Device not loaded yet');
      return;
    }
    const message = {
      type: 'createConsumerTransport',
      // Depending on server implementation, you might need to send rtpCapabilities or other data
    };
    sendMessage(message);
  };

  // Handler for incoming messages
  const handleMessage = (event) => {
    if (!isJsonString(event.data)) {
      console.error('Received invalid JSON:', event.data);
      return;
    }

    const message = JSON.parse(event.data);
    const { type, data } = message;

    switch (type) {
      case 'routerRtpCapabilities':
        onRouterCapabilities(message);
        break;
      case 'producerTransportCreated':
        onProducerTransportCreated(message);
        break;
      case 'consumerTransportCreated':
        onConsumerTransportCreated(message);
        break;
      case 'consumerSubscribed':
        onSubscribed(message);
        break;
      case 'error':
        console.error('Server Error:', data);
        setError(data);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  };

  // Function to establish WebSocket connection
  const connect = (webSocketUrl) => {
    socketRef.current = new WebSocket(webSocketUrl);

    socketRef.current.onopen = () => {
      console.log('Connected to the server');
      const msg = {
        type: 'getRouterRtpCapabilities',
      };
      sendMessage(msg);
    };

    socketRef.current.onmessage = handleMessage;

    socketRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('WebSocket connection error');
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  // Initialize WebSocket connection on component mount
  useEffect(() => {
    connect('ws://localhost:3000/ws'); // Update URL if different

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (producerTransportRef.current) {
        producerTransportRef.current.close();
      }
      if (consumerTransportRef.current) {
        consumerTransportRef.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Live Feeds
      </Typography>
      {error && (
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <Grid container spacing={2}>
        {feeds.map((feed) => (
          <Grid item xs={12} md={6} lg={4} key={feed.id}>
            <LiveFeed
              location={`Feed ${feed.id}`}
              videoSrc={feed.stream}
            />
          </Grid>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={subscribe}
        sx={{ mt: 2 }}
        disabled={!deviceLoaded} // Disable until device is loaded
      >
        Subscribe to New Feed
      </Button>
    </Container>
  );
};

export default LiveFeeds;