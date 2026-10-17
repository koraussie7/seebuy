import { io, Socket } from "socket.io-client";

// Uses the production tunnel domain. For local development on physical device, 
// replace with your computer's local IPv4 address (e.g., http://192.168.1.x:4000)
const SOCKET_URL = 'https://api.golive.wiki';

const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  // Optional but recommended: Specify transports to avoid long-polling fallback issues in React Native
  //   transports: ['websocket'],
});

export default socket;
