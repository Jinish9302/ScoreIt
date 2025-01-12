import jwt from "jsonwebtoken";

export default ( role, _id ) => {
    return jwt.sign({ role, _id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
};
