import mongoose from "mongoose";
import printLog from "./utils/printLog.js";
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_CONNECTION_STRING}/${process.env.DB_NAME}`)
        printLog("SUCCESS", `MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        printLog("ERROR", error.message)
    }
}
export default connectDB
