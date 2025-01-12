import { createClient } from 'redis';
import printLog from './utils/printLog.js';

const redisClient = await createClient({ url: process.env.REDIS_CONNECTION_STRING })
  .on('connect', () => {
    printLog("SUCCESS", "Connected to Redis")
  })
  .connect(process.env.REDIS_CONNECTION_STRING)
  .catch((err) => {
    printLog("ERROR", err.message)
  })
export default redisClient
