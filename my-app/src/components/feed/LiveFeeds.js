// src/components/LiveFeeds.js
import React, { useState, useEffect } from "react";
import LiveFeed from "./LiveFeed";
import { Grid2, Container } from "@mui/material";
import mediasoup from "mediasoup-client";

let device;
let socket;
const feeds = [
  { location: "Location 1", isOverspeeding: false },
  { location: "Location 2", isOverspeeding: true },
  { location: "Location 3", isOverspeeding: false },
  { location: "Location 4", isOverspeeding: true },
  { location: "Location 5", isOverspeeding: false },
  { location: "Location 6", isOverspeeding: true },
  { location: "Location 7", isOverspeeding: false },
  { location: "Location 8", isOverspeeding: true },
];

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
    device = new mediasoup.Device();
  } catch (error) {
    if (error.name === "UnsupportedError") {
      console.error("browser not supported");
    }
  }
  await device.load({ routerRtpCapabilities });
};

const onRouterCapabilities = (resp) => {
  loadDevice(resp.data);
  //btn.disabled = false;
  //btnscreen.disabled = false;
};

const getUserMedia = async (transport, isWebcam) => {
  if (!device.canProduce("video")) {
    console.error("cannot produce any media");
    return;
  }
  let stream;
  try {
    stream = isWebcam
      ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      : await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
  } catch (error) {
    console.error("Error accessing media devices", error);
    return;
  }
  return stream;
};

const onProducerTransportCreated = async (event) => {
  if (event.error) {
    console.error("Error creating producer transport:", event.error);
    return;
  }
  const transport = device.createSendTransport(event.data);
  transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    const message = {
      type: "connectProducerTransport",
      dtlsParameters,
    };
    const resp = JSON.stringify(message);
    socket.send(resp);
    socket.addEventListener("message", (event) => {
      const jsonValidation = isJsonString(event.data);
      if (!jsonValidation) {
        console.error("Invalid JSON");
        return;
      }
      let resp = JSON.parse(event.data);
      if (resp.type === "producerConnected") {
        console.log("got producderConnected!!!");
        callback();
      }
    });
  });
  //begin transport producer
  transport.on(
    "produce",
    async ({ kind, rtpParameters }, callback, errback) => {
      const messsage = {
        type: "produce",
        transportId: transport.id,
        kind,
        rtpParameters,
      };
      const resp = JSON.stringify(messsage);
      socket.send(resp);
      socket.addEventListener("published", (resp) => {
        callback(resp.data.id);
      });
    }
  );

  // end transport producer
  //connection state change
  transport.on("coonectionstatechange", (state) => {
    switch (state) {
      case "connecting":
        console.log("connecting");
        //add an elemnt on the page to show the status
        break;
      case "connected":
        console.log("connected");
        //localVideo.srcObject = stream;
        break;
      case "disconnected":
        console.log("disconnected");
        break;
      case "failed":
        console.log("failed");
        transport.close();
        //tell ui failed
        break;
      default:
        break;
    }
  });
  // connection state change end

  let stream;
  try {
    stream = await getUserMedia(transport, isWebcam);
    const track = stream.getVideoTracks()[0];
    const params = { track };

    producer = await transport.producer(params);
  } catch (error) {
    console.error("Error creating producer:", error);
    //tell ui failed
  }
};

const publish = (e) => {
  const message = {
    type: "createProducerTransport",
    forceTcp: false,
    rtpCapabilities: device.rtpCapabilities,
  };
  const resp = JSON.stringify(message);
  socket.send(resp);
};

const onSubTransportCreated = (event) => {
  if (event.error) {
    console.error("Error creating sub transport:", event.error);
    return;
  }
  const transport = device.createRecvTransport(event.data);
  transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    const message = {
      type: "connectConsumerTransport",
      transportId: transport.id,
      dtlsParameters,
    };
    const msg = JSON.stringify(message);
    socket.send(msg);
    socket.addEventListener("message", (event) => {
      const jsonValidation = isJsonString(event.data);
      if (!jsonValidation) {
        console.error("Invalid JSON");
        return;
      }
      let resp = JSON.parse(event.data);
      if (resp.type === "subConnected") {
        console.log("consumer transport Connected!!!");
        callback();
      }
    });
  });
  transport.on("connectionstatechange", async (state) => {
    switch (state) {
      case "connecting":
        console.log("subscribing");
        // do it in ui
        break;
      case "connected":
        //remoteVideo.srcObject = remoteStream;
        const msg = { type: "resume" };
        const message = JSON.stringify(msg);
        socket.send(message);
        console.log("subscribbed");
        break;
      case "disconnected":
        console.log("disconnected");
        break;
      case "failed":
        console.log("failed");
        //show in ui
        transport.close();
        //btnSub.disbled = false;
        break;
      case 'resumed':
        console.log(event.data);
        break;
      default:
        break;
    }
  });
  const stream = consumer(transport);
};

const consumer = async (transport) => {
  const {rtpCapabilities} = device;
  const msg = {
    type:'consume',
    rtpCapabilities
  }
  const message = JSON.stringify(msg);
  socket.send(message);
}

const subscibe = () => {
  //btnSub.disable = true;
  const msg = {
    type: "createConsumerTransport",
    forceTcp: false,
  };
  const message = JSON.stringify(msg);
  socket.send(message);
};

const onSubscribed = async (event) => {
  const {producerId,
    id,
    kind,
    rtpParameters,
  } = event.data;
  let codecOption = {};
  const consumer = await consumerTransport.consume({
    id,
    producerId,
    rtpParameters,
    kind,
    codecOption,
  });
  const stream = new MediaStream();
  stream.addTrack(consumer.track);
  //remoteStream = stream;
}

const connect = (webSocketUrl) => {
  socket = new WebSocket(webSocketUrl);
  socket.onopen = () => {
    console.log("Connected to the server");
    const msg = {
      type: "getRouterRtpCapabilities",
    };
    const resp = JSON.stringify(msg);
    socket.send(resp);

    // Request feeds
    const feedMsg = {
      type: "getFeeds",
    };
    socket.send(JSON.stringify(feedMsg));
  };
  socket.onmessage = (event) => {
    const jsonValidation = isJsonString(event.data);
    if (!jsonValidation) {
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
      case 'subscribed':
        onSubscribed(resp);
        break;
      default:
        console.error("Invalid message");
        break;
    }
  };
};

const LiveFeeds = () => {
  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    connect("ws://localhost:3000/ws");

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid2 container spacing={2}>
        {feeds.map((feed, index) => (
          <Grid2 key={index} size={{ xs: 12, md: 4, sm: 6 }}>
            <LiveFeed
              location={feed.location}
              isOverspeeding={feed.isOverspeeding}
              publish={publish}
              videoSrc={feed.videoSrc}
            />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default LiveFeeds;
