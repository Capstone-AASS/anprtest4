// src/components/LiveFeeds.js

import React, { useEffect, useRef, useState } from "react";
import { Container, Grid2 } from "@mui/material";
import { Device } from "mediasoup-client";
import LiveFeed from "./LiveFeed";

const LiveFeeds = () => {
  const [feeds, setFeeds] = useState([
    {
      feedId: "feed1",
      location: "Location 1",
      isOverspeeding: false,
      videoSrc: null,
    },
    {
      feedId: "feed2",
      location: "Location 2",
      isOverspeeding: false,
      videoSrc: null,
    },
    // Add more feeds as needed
  ]);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const consumerTransportRef = useRef(null);
  const selectedFeedIndexRef = useRef(null);

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (error) {
      return false;
    }
    return true;
  };

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
      console.log("Device loaded with RTP capabilities:", deviceRef.current);
    } catch (error) {
      console.error("Failed to load device:", error);
    }
  };

  const onRouterCapabilities = (resp) => {
    loadDevice(resp.data);
  };

  const onCreateConsumerTransport = async (resp) => {
    if (!resp || !resp.data) {
      console.error("Invalid event structure:", resp);
      return;
    }
    if (resp.error) {
      console.error("Error creating consumer transport:", resp.error);
      return;
    }
    consumerTransportRef.current = deviceRef.current.createRecvTransport(
      resp.data
    );

    consumerTransportRef.current.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        const message = {
          type: "connectConsumerTransport",
          data: { dtlsParameters },
        };
        socketRef.current.send(JSON.stringify(message));

        const handleConnectMessage = (messageEvent) => {
          if (!isJsonString(messageEvent.data)) return;
          const response = JSON.parse(messageEvent.data);
          if (response.type === "consumerTransportConnected") {
            callback();
            socketRef.current.removeEventListener(
              "message",
              handleConnectMessage
            );
          } else if (response.type === "error") {
            errback(response.data.message);
            socketRef.current.removeEventListener(
              "message",
              handleConnectMessage
            );
          }
        };

        socketRef.current.addEventListener("message", handleConnectMessage);
      }
    );

    consumerTransportRef.current.on("connectionstatechange", (state) => {
      switch (state) {
        case "connecting":
          break;
        case "connected":
          console.log("Consumer transport connected");
          break;
        case "failed":
          consumerTransportRef.current.close();
          break;
        default:
          break;
      }
    });
  };

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

      if (selectedFeedIndexRef.current !== null) {
        const updatedFeeds = [...feeds];
        updatedFeeds[selectedFeedIndexRef.current].videoSrc =
          URL.createObjectURL(stream);
        setFeeds(updatedFeeds);
      }
    } catch (error) {
      console.error("Error consuming:", error);
    }
  };

  // Define the publish function
  const publish = (feedId) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "startFeed",
        data: { feedId },
      };
      socketRef.current.send(JSON.stringify(message));
      console.log(`Publish request sent for feedId: ${feedId}`);
    } else {
      console.error("WebSocket is not connected");
    }
  };

  const connect = (webSocketUrl) => {
    socketRef.current = new WebSocket(webSocketUrl);

    socketRef.current.onopen = () => {
      console.log("Connected to the server");
      const msg = {
        type: "getRouterRtpCapabilities",
      };
      socketRef.current.send(JSON.stringify(msg));
    };

    socketRef.current.onmessage = (message) => {
      if (!isJsonString(message.data)) {
        console.error("Invalid JSON");
        return;
      }

      const resp = JSON.parse(message.data);
      switch (resp.type) {
        case "routerRtpCapabilities":
          onRouterCapabilities(resp);
          break;
        case "producerTransportCreated":
          onCreateConsumerTransport(resp); // Changed to handle consumer transport
          break;
        case "feeds":
          setFeeds(resp.data);
          break;
        case "subscribed":
          onSubscribed(resp);
          break;
        case "feedStarted":
          console.log(`Feed started: ${resp.data.feedId}`);
          break;
        case "videoFrame":
          const { feedId, frame } = resp.data;

          // Update the video source for the appropriate feed
          setFeeds((prevFeeds) =>
            prevFeeds.map((feed) =>
              feed.feedId === feedId
                ? { ...feed, videoSrc: frame } // Update `videoSrc` with the frame
                : feed
            )
          );
          break;
        default:
          console.error("Unknown message type:", resp.type);
          break;
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };
  };

  useEffect(() => {
    connect("ws://localhost:8000/ws");

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      feeds.forEach((feed) => {
        if (feed.videoSrc) {
          URL.revokeObjectURL(feed.videoSrc);
        }
      });
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="lg" sx={{ mt: 0, mb: 0 ,textAlign:'center'}}>
      <h1>Live Feeds</h1>
      </Container>
      <Grid2 container spacing={2}>
        {feeds.map((feed, index) => (
          <Grid2 key={index} item xs={12} md={4} sm={6}>
            <LiveFeed
              feedId={feed.feedId}
              location={feed.location}
              isOverspeeding={feed.isOverspeeding}
              videoSrc={feed.videoSrc}
              publish={() => publish(feed.feedId)} // Pass the publish function
            />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default LiveFeeds;
