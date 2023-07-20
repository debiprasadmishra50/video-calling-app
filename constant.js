// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBQxRsu56FkcagAXftkQ2d_SJ80bPJ79sk",
  authDomain: "video-streaming-3a6ea.firebaseapp.com",
  projectId: "video-streaming-3a6ea",
  storageBucket: "video-streaming-3a6ea.appspot.com",
  messagingSenderId: "556990121320",
  appId: "1:556990121320:web:e90da37cfce991d02502dd",
  measurementId: "G-R82VYL4KHW",
};

export const servers = {
  iceServers: [{ urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }],
  iceCandidatePoolSize: 10,
};

// HTML elements
export const webcamButton = document.getElementById("webcamButton");
export const webcamVideo = document.getElementById("webcamVideo");
export const callButton = document.getElementById("callButton");
export const callInput = document.getElementById("callInput");
export const answerButton = document.getElementById("answerButton");
export const remoteVideo = document.getElementById("remoteVideo");
export const hangupButton = document.getElementById("hangupButton");
