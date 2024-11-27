// src/components/LiveFeeds.js
import React from "react";
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

const getUserMedia = async (transport,isWebcam) => {
  if(!device.canProduce('video') ){
    console.error('cannot produce any media');
    return;
  }
  let stream;
  try {
    stream = isWebcam? 
    await navigator.mediaDevices.getUserMedia({video:true,audio:true}):
    await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
  } catch (error) {
    console.error('Error accessing media devices',error);
    return;
  }
  return stream;
}

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
  transport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
    const messsage = {
    type: 'produce',
    transportId: transport.id,
    kind,
    rtpParameters
    };
    const resp = JSON.stringify(messsage);
    socket.send(resp);
    socket.addEventListener('published',(resp)=>{
      callback(resp.data.id);
    })
  });

  // end transport producer
  //connection state change
  transport.on('coonectionstatechange',(state)=>{
    switch(state){
      case 'connecting':
        console.log('connecting');
        //add an elemnt on the page to show the status
        break;
      case 'connected':
        console.log('connected');
        //localVideo.srcObject = stream;
        break;
      case 'disconnected':
        console.log('disconnected');
        break;
      case 'failed':
        console.log('failed');
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
    stream = await getUserMedia(transport,isWebcam);
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

const connect = (webSocketUrl) => {
  socket = new WebSocket(webSocketUrl);
  socket.onopen = () => {
    console.log("Connected to the server");
    const msg = {
      type: "getRouterRtpCapabilities",
    };
    const resp = JSON.stringify(msg);
    socket.send(resp);
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
      default:
        console.error("Invalid message");
        break;
    }
  };
};

connect();

const LiveFeeds = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid2 container spacing={2}>
        {feeds.map((feed, index) => (
          <Grid2 key={index} size={{ xs: 12, md: 4, sm: 6 }}>
            <LiveFeed
              location={feed.location}
              isOverspeeding={feed.isOverspeeding}
              publish={publish}
            />
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
};

export default LiveFeeds;
