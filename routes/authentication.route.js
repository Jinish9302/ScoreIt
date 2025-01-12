import { Router } from "express";
import { login, registerUser, checkAuthentication, deleteUser, userExists } from "../controllers/authentication.controller.js";
import parseJWT from "../middlewares/parseJWT.middleware.js";
import { body, param } from "express-validator";

const router = Router();

// authentication routes

// Register User
router.post("/register", [body("username").notEmpty(), body("email").isEmail(), body("password").notEmpty()], registerUser);

// Login User
router.get("/login", login);

// Check Authentication
router.get("/check-authentication", parseJWT, checkAuthentication);

// Delete User
router.delete("/delete-user", [parseJWT, param("username").notEmpty()], deleteUser);

// user exists
router.get("/user-exists/:username", param("username").notEmpty(), userExists);

export default router;
