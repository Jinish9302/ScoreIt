import jwt from "jsonwebtoken";
const parseJWT = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        req.body = jwt.verify(token, process.env.JWT_SECRET_KEY);
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};
export default parseJWT;
