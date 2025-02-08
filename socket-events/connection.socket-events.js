import printLog from "../utils/printLog.js";
const createConnectionEvents = (io) => {
    io.socket.on('connection', (data) => {
        printLog("INFO", "User connected");
        data.on('disconnect', () => {
            printLog("INFO", "User disconnected");
        });
    });
};

export {createConnectionEvents};