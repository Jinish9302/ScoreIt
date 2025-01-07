import jwt from "jsonwebtoken";

const parseJWT = (req, res, next) => {

    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.body.userId = decoded._id;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};

export default parseJWT
