// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getDoc,
  collection,
  getFirestore,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import {
  firebaseConfig,
  servers,
  answerButton,
  callButton,
  callInput,
  hangupButton,
  remoteVideo,
  webcamButton,
  webcamVideo,
} from "./constant";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// TODO: https://fireship.io/lessons/webrtc-firebase-video-chat/

// Initialize Firebase
const app = initializeApp(firebaseConfig, "video-streaming");
const fireStore = getFirestore(app);

// GLOBAL STATE: WEB-RTC
let pc = new RTCPeerConnection(servers);
let localStream = null; // my webcam
let remoteStream = null; // others webcam

// 1. setup media sources
webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Push tracks from local stream to remote stream
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
};

// 2. Create an offer
callButton.onclick = async () => {
  // reference Firestore collection
  const docRef = doc(collection(fireStore, "calls"));
  const offerCandidates = collection(docRef, "offerCandidates");
  const answerCandidates = collection(docRef, "answerCandidates");

  callInput.value = docRef.id;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
  };

  // Create Offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  // await callDoc.set({ offer });
  await setDoc(docRef, { offer });

  // Listen for remote server
  onSnapshot(docRef, (doc) => {
    const data = doc.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // Listen for remote ICE candidates
  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  hangupButton.disabled = false;
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  // reference Firestore collection
  const callDoc = doc(collection(fireStore, "calls"), callId);
  const offerCandidates = collection(callDoc, "offerCandidates");
  const answerCandidates = collection(callDoc, "answerCandidates");

  hangupButton.disabled = false;

  pc.onicecandidate = (event) => {
    event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
  };

  const callData = (await getDoc(callDoc)).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(callDoc, { answer });

  // Listen for remote server
  onSnapshot(offerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // console.log(change);
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
};

// 4. Function to hang up the call
hangupButton.onclick = async () => {
  localStream.getTracks().forEach((track) => track.stop());
  remoteStream.getTracks().forEach((track) => track.stop());
  pc.close();
  callButton.disabled = false;
  answerButton.disabled = false;
  hangupButton.disabled = true;
  webcamVideo.srcObject = null;
  remoteVideo.srcObject = null;
};
