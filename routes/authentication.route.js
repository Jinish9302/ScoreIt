import { Router } from "express";
import { login, registerUser, checkAuthentication, deleteUser } from "../controllers/authentication.controller.js";
import parseJWT from "../middlewares/parseJWT.middleware.js";
import { body, param } from "express-validator";

const router = Router();

router.post(
    "/register",
    [
        body("username").notEmpty(),
        body("email").isEmail(),
        body("password").notEmpty(),
    ],
    registerUser
);

router.get(
    "/login",
    login
);

router.get("/check-authentication", parseJWT, checkAuthentication);

router.deleteclear
(
    "/delete-user/:username",
    [
        parseJWT,
        param("username").notEmpty(),
    ],
    deleteUser
);

export default router;
