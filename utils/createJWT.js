import jwt from "jsonwebtoken";

export default ( role, _id ) => {
    const payload = { role };
    if (userId) {
        payload.userId = userId;
    }
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
};
