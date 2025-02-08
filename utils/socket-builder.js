import { Server } from 'socket.io';

let io = {};
const getSocketInstance = (httpServer) => {
    if (io.socket) return io;
    if(httpServer) {
        io.socket = new Server(httpServer);
    }
    return io;
}

export { getSocketInstance };

