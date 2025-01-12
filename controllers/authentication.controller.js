import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import printLog from "../utils/printLog.js";
import createJWT from "../utils/createJWT.js";
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const user = await User.findOne({ $or: [{ username }, { email }] }).exec();
        if (user) {
            return res.status(400).json({ message: user.username === username ? "Username already exists" : "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, email, password: hashedPassword });
        const token = createJWT("manager", newUser._id);

        printLog("SUCCESS", `User ${newUser.username} registered`);
        res.status(201).json({ message: "User registered successfully", token, user: newUser.with("_id", "username", "email", "createdAt", "updatedAt") });
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    const { username, password } = req.headers;
    if (!username || !password) {
        printLog("ERROR", "Missing username or password in headers");
        return res.status(400).json({ message: "Missing username or password in headers" });
    }

    let user;
    try {
        user = await User.findOne({ $or: [{ email: username }, { username }] });
    } catch (error) {
        printLog("ERROR", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
        printLog("ERROR", "User not found");
        return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        printLog("ERROR", "Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createJWT("manager", user._id);
    printLog("SUCCESS", `User ${user.username} logged in`);
    res.status(200).json({ message: "Login successful", token, user: user.with("_id", "username", "email", "createdAt", "updatedAt") });
};

const checkAuthentication = async (req, res) => {
    try {
        const user = await User.findById(req.body._id);
        if (!user || req.body.role !== "manager") {
            throw new Error("Unauthorized");
        }
        printLog("SUCCESS", `User ${user.username} authenticated`);
        res.status(200).json({ message: "Valid token", username: user.username });
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(401).json({ message: "Unauthorized" });
    }
};

const deleteUser = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const deletedUser = await User.findOneAndDelete({ _id: req.body._id });
        if (!deletedUser) {
            printLog("ERROR", "User not found");
            return res.status(404).json({ message: "User not found" });
        }
        printLog("SUCCESS", `User ${deletedUser.username} deleted`);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// check if a username is available in the database
const userExists = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (user) {
            printLog("ERROR", `Username ${user.username} is already taken`);
            res.status(400).json({ message: "Username is already taken" });
        } else {
            printLog("SUCCESS", `Username ${req.params.username} is available`);
            res.status(200).json({ message: "Username is available" });
        }
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export {
    registerUser,
    login,
    checkAuthentication,
    deleteUser,
    userExists
};
