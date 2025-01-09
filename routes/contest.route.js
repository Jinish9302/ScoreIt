import { Router } from "express";
import {
    createContest,
    fetchAllContests,
    fetchContestDetails,
    deleteContestsByIds,
    updateContestName, 
    updateParticipantName
} from "../controllers/contest.controller.js";
import { body } from "express-validator";
import parseJWT from "../middlewares/parseJWT.middleware.js";
import checkParticipantArrayElements from "../middlewares/checkParticipantArrayElements.middleware.js";

const contestRoute = Router();

contestRoute.post("/create", [
    parseJWT,
    checkParticipantArrayElements,
    body("name").notEmpty(),
], createContest);

// fetch all the contests belonging to the user id fetched from the token
contestRoute.get("/fetch-all-contests",
    parseJWT,
    fetchAllContests
);

// fetch all the contests belonging to the user id with contest ids fetched from the query params. 
contestRoute.get("/fetch-contest-details",
    parseJWT,
    fetchContestDetails
);

// Delete contests by id given comma separated in query params
contestRoute.delete("/delete-contests-by-ids",
    parseJWT,
    body("contestIds").notEmpty(),
    deleteContestsByIds
);

// update contest name
contestRoute.patch("/update-contest-name",
    parseJWT,
    body("name").notEmpty(),
    updateContestName
);

// update participant names
contestRoute.patch("/update-participant-name",
    parseJWT,
    updateParticipantName
);

export default contestRoute;
