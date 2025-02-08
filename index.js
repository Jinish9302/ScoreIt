// Import Modules
import express from "express";
import { connectDB } from "./db.js";
import { getSocketInstance } from "./utils/socket-builder.js";
import { createServer } from "http";

// Import Routes
import authRoute from "./routes/authentication.route.js";
import contestRoute from "./routes/contest.route.js";

// Import Utils
import printLog from "./utils/printLog.js";
import declarePrototypes from "./utils/prototypes.js";
import { applyCronJobs } from "./utils/cronJobs.js";

// Import Sockets
import { createConnectionEvents } from "./socket-events/connection.socket-events.js";


const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const io = getSocketInstance(httpServer);

// Connect to mongodb
connectDB();
// Declare prototypes
declarePrototypes();
// Declare Cron Jobs
applyCronJobs();

app.use(express.json());


// attach routes"
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/contest", contestRoute);

// attach socket events
createConnectionEvents(io)

httpServer.listen(PORT, () => {
  printLog("INFO", `Server and Socket.io listening on port ${PORT}`);
});


