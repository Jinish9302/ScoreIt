import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import redisClient from "../redis.js";

export default ( role, _id ) => {
    let tokenId = uuidv4();
    redisClient.set(`tokens:${role}_${_id}`, tokenId);
    return jwt.sign({ role, _id, tokenId }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
};
