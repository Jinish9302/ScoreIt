import mongoose from "mongoose";
import printLog from "./utils/printLog.js";
import { createClient } from 'redis';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_CONNECTION_STRING}/${process.env.DB_NAME}`)
        printLog("SUCCESS", `MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        printLog("ERROR", error.message)
    }
}

const redisClient = await createClient({ url: process.env.REDIS_CONNECTION_STRING })
    .on('connect', () => {
        printLog("SUCCESS", "Connected to Redis")
    })
    .connect(process.env.REDIS_CONNECTION_STRING)
    .catch((err) => {
        printLog("ERROR", err.message)
    })

export { connectDB, redisClient };
