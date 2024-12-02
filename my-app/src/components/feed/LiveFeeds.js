// src/components/LiveFeeds.js
import React, { useState, useEffect, useRef } from "react";
import LiveFeed from "./LiveFeed";
import { Grid2, Container, Button } from "@mui/material";
import { Device } from "mediasoup-client"; // Correct import

const LiveFeeds = () => {
  const [feeds, setFeeds] = useState([{location:'Location 1', isOverspeeding:'false',videoSrc:null}
    ,{location:'Location 2', isOverspeeding:'true',videoSrc:null},
    {location:'Location 3', isOverspeeding:'false',videoSrc:null},,
    {location:'Location 4', isOverspeeding:'true',videoSrc:null},
  ]); // State to manage feeds
  const isWebcam = false; // Flag to determine webcam usage

  // Refs to manage mutable variables
  const deviceRef = useRef(null);
  const socketRef = useRef(null);
  const producerRef = useRef(null);
  const consumerTransportRef = useRef(null);
  const selectedFeedIndexRef = useRef(null);

  // Utility function to validate JSON strings
  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (error) {
      return false;
    }
    return true;
  };

  // Function to load mediasoup device with router RTP capabilities
  const loadDevice = async (routerRtpCapabilities) => {
    try {
      deviceRef.current = new Device();
    } catch (error) {
      if (error.name === "UnsupportedError") {
        console.error("Browser not supported");
        return;
      }
      console.error("Device creation error:", error);
      return;
    }

    try {
      await deviceRef.current.load({ routerRtpCapabilities });
      console.log("Device loaded with RTP capabilities," , deviceRef.current);
    } catch (error) {
      console.error("Failed to load device:", error);
    }
  };

  // Handler for router RTP capabilities
  const onRouterCapabilities = (resp) => {
    loadDevice(resp.data);
  };

  // Handler for producer transport creation
  const onProducerTransportCreated = async (event) => {
    if (!event || !event.data) {
      console.error("Invalid event structure:", event);
      return;
  }
    if (event.error) {
      console.error("Error creating producer transport:", event.error);
      return;
    }
    const transport = deviceRef.current.createSendTransport(event.data);
    
    // Handle transport connection
    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      const message = {
        type: "connectProducerTransport",
        dtlsParameters,
      };
      socketRef.current.send(JSON.stringify(message));

      // Listen for producer connection confirmation
      const handleMessage = (event) => {
        if (!isJsonString(event.data)) {
          console.error("Invalid JSON");
          return;
        }
        let resp = JSON.parse(event.data);
        if (resp.type === "producerConnected") {
          console.log("Producer connected!");
          callback();
          socketRef.current.removeEventListener("message", handleMessage);
        }
      };

      socketRef.current.addEventListener("message", handleMessage);
    });

    // Handle produce event
    transport.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
        const message = {
          type: "produce",
          transportId: transport.id,
          kind,
          rtpParameters,
        };
        socketRef.current.send(JSON.stringify(message));

        // Listen for producer creation confirmation
        const handleMessage = (event) => {
          if (!isJsonString(event.data)) {
            console.error("Invalid JSON");
            return;
          }
          let resp = JSON.parse(event.data);
          if (resp.type === "producerCreated") {
            callback(resp.data.id);
            socketRef.current.removeEventListener("message", handleMessage);
          }
        };

        socketRef.current.addEventListener("message", handleMessage);
      }
    );

    // Handle transport state changes
    transport.on("connectionstatechange", (state) => {
      switch (state) {
        case "connecting":
          console.log("Connecting producer transport...");
          break;
        case "connected":
          console.log("Producer transport connected");
          break;
        case "disconnected":
          console.log("Producer transport disconnected");
          break;
        case "failed":
          console.log("Producer transport failed");
          transport.close();
          break;
        default:
          break;
      }
    });

    // Access user media and create producer
    let stream;
    try {
      stream = await getUserMedia(isWebcam);
      if (!stream) {
        console.error("No media stream available");
        return;
      }
      const track = stream.getVideoTracks()[0];
      const params = { track };
      producerRef.current = await transport.produce(params);
      console.log("Producer created");
    } catch (error) {
      console.error("Error creating producer:", error);
    }
  };

  // Function to initiate publishing to a selected feed
  const publish = (index) => {
    selectedFeedIndexRef.current = index;
    const message = {
      type: "createProducerTransport",
      forceTcp: false,
      rtpCapabilities: deviceRef.current.rtpCapabilities,
    };
    socketRef.current.send(JSON.stringify(message));
  };

  // Handler for consumer transport creation
  const onSubTransportCreated = (event) => {
    if (event.error) {
      console.error("Error creating consumer transport:", event.error);
      return;
    }
    consumerTransportRef.current = deviceRef.current.createRecvTransport(event.data);
    
    // Handle consumer transport connection
    consumerTransportRef.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
      console.log(consumerTransportRef.current);
      const message = {
        type: "connectConsumerTransport",
        transportId: consumerTransportRef.current.id,
        dtlsParameters,
      };
      socketRef.current.send(JSON.stringify(message));

      // Listen for consumer transport connection confirmation
      const handleMessage = (event) => {
        if (!isJsonString(event.data)) {
          console.error("Invalid JSON");
          return;
        }
        let resp = JSON.parse(event.data);
        if (resp.type === "subConnected") {
          console.log("Consumer transport connected!");
          callback();
          socketRef.current.removeEventListener("message", handleMessage);
        }
      };

      socketRef.current.addEventListener("message", handleMessage);
    });

    // Handle consumer transport state changes
    consumerTransportRef.current.on("connectionstatechange", async (state) => {
      switch (state) {
        case "connecting":
          console.log("Subscribing...");
          break;
        case "connected":
          const msg = { type: "resume" };
          socketRef.current.send(JSON.stringify(msg));
          console.log("Subscribed");
          break;
        case "disconnected":
          console.log("Consumer transport disconnected");
          break;
        case "failed":
          console.log("Consumer transport failed");
          consumerTransportRef.current.close();
          break;
        default:
          break;
      }
    });

    // Initiate consume process
    consume(consumerTransportRef.current);
  };

  // Function to send consume request
  const consume = async (transport) => {
    const { rtpCapabilities } = deviceRef.current;
    const msg = {
      type: "consume",
      rtpCapabilities,
    };
    socketRef.current.send(JSON.stringify(msg));
  };

  // Function to initiate subscribing to a feed
  const subscribe = () => {
    const msg = {
      type: "createConsumerTransport",
      forceTcp: false,
    };
    socketRef.current.send(JSON.stringify(msg));
  };

  // Handler for successful subscription
  const onSubscribed = async (event) => {
    const { producerId, id, kind, rtpParameters } = event.data;
    let codecOptions = {};
    try {
      const consumer = await consumerTransportRef.current.consume({
        id,
        producerId,
        rtpParameters,
        kind,
        codecOptions,
      });
      const stream = new MediaStream();
      stream.addTrack(consumer.track);

      // Update the feed with the new stream
      if (selectedFeedIndexRef.current !== null) {
        const updatedFeeds = [...feeds];
        // Convert MediaStream to a URL for the video source
        updatedFeeds[selectedFeedIndexRef.current].videoSrc = URL.createObjectURL(stream);
        setFeeds(updatedFeeds);
      }
    } catch (error) {
      console.error("Error consuming:", error);
    }
  };

  // Function to access user media
  const getUserMedia = async (isWebcam) => {
    if (!deviceRef.current.canProduce("video")) {
      console.error("Cannot produce video");
      return null;
    }
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
    return stream;
  };

  // Function to establish WebSocket connection
  const connect = (webSocketUrl) => {
    socketRef.current = new WebSocket(webSocketUrl);
    
    // Handle connection open
    socketRef.current.onopen = () => {
      console.log("Connected to the server");
      const msg = {
        type: "getRouterRtpCapabilities",
      };
      socketRef.current.send(JSON.stringify(msg));

      const feedMsg = {
        type: "getFeeds",
      };
      socketRef.current.send(JSON.stringify(feedMsg));
    };

    // Handle incoming messages
    socketRef.current.onmessage = (event) => {
      console.log("Raw WebSocket message:", event.data);
      if (!isJsonString(event.data)) {
        console.error("Invalid JSON");
        return;
      }

      const resp = JSON.parse(event.data);
      switch (resp.type) {
        case "routerRtpCapabilities":
          onRouterCapabilities(resp);
          break;
        case "producerTransportCreated":
          onProducerTransportCreated(resp);
          break;
        case "feeds":
          setFeeds(resp.data);
          break;
        case "subTransportCreated":
          onSubTransportCreated(resp);
          break;
        case "resumed":
          console.log(resp);
          break;
        case "subscribed":
          onSubscribed(resp);
          break;
        case "videoFrame":
          const updatedFeeds = [...feeds];
            const blob = new Blob([Uint8Array.from(atob(resp.data), c => c.charCodeAt(0))], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);

            if (selectedFeedIndexRef.current !== null) {
                updatedFeeds[selectedFeedIndexRef.current].videoSrc = url;
            } else {
                // Default behavior for unselected feed
                if (updatedFeeds.length > 0) updatedFeeds[0].videoSrc = url;
            }

            setFeeds(updatedFeeds);
          break;
        default:
          console.error("Invalid message type:", resp.type);
          break;
      }
    };

    // Handle errors
    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Handle connection close
    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };
  };

  // Initialize WebSocket connection on component mount
  useEffect(() => {
    connect("ws://localhost:3000/ws");

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      // Cleanup video object URLs to prevent memory leaks
      feeds.forEach((feed) => {
        if (feed.videoSrc && feed.videoSrc.startsWith("blob:")) {
          URL.revokeObjectURL(feed.videoSrc);
        }
      });
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb:4 }}>
      <Grid2 container spacing={2}>
        {feeds.map((feed, index) => (
          <Grid2 key={index} item xs={12} md={4} sm={6}>
            <LiveFeed
              location={feed.location}
              isOverspeeding={feed.isOverspeeding}
              publish={() => publish(index)}
              videoSrc={feed.videoSrc}
            />
          </Grid2>
        ))}
      </Grid2>
      <Button variant="contained" onClick={subscribe}>Fetch Feed</Button>
    </Container>
  );
};

export default LiveFeeds