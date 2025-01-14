import jwt from "jsonwebtoken";
import { redisClient } from "../db.js";
const parseJWT = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const { _id, tokenId, role } = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const storedTokenId = await redisClient.get(`tokens:${role}_${_id}`);
        if (storedTokenId !== tokenId) {
            return res.status(403).json({ message: "Token has been revoked or unauthorized" });
        }
        req.body = { _id, role };
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};
export default parseJWT;
