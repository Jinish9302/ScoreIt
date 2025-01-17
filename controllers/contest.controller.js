import Contest from "../models/contest.model.js";
import Participant from "../models/participant.model.js";
import createJWT from "../utils/createJWT.js";
import printLog from "../utils/printLog.js";
import { mongoose } from "mongoose";
import { redisClient } from "../db.js";

const createContest = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, _id: creatorId, participants } = req.body;
    const formattedParticipants = participants.map((participant) => ({
        ...participant,
        score: 0
    }));
    try {
        const newContest = await Contest.create({ name, creatorId });
        const storedParticipants = await Participant.insertMany(
            formattedParticipants.map((participant) => ({
                ...participant,
                contestId: newContest._id,
            }))
        );
        await redisClient.mSet(storedParticipants.map((participant) => [`score:${participant.contestId}:${participant._id}`, '0']));
        res.status(201).json({ message: "Contest created successfully", contest: newContest });
    } catch (error) {
        printLog("ERROR", `Error creating contest: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch all contests that belong to a user
const fetchAllContests = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const pageNumber = req.query.pageNumber ? parseInt(req.query .pageNumber, 10) : 0;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 10;
    const skip = pageNumber * pageSize;
    try {
        const userContests = await Contest.aggregate([
            { $match: { creatorId: new mongoose.Types.ObjectId(req.body._id) } },
            { $skip: skip },
            { $limit: pageSize },
            {
                $lookup: {
                    from: "participants",
                    localField: "_id",
                    foreignField: "contestId",
                    as: "participants"
                }
            }
        ]);
        const keys = userContests.flatMap(contest => contest.participants.map(participant => `score:${contest._id}:${participant._id}`));
        if(keys.length === 0) return res.status(200).json([])
        const scores = await redisClient.mGet(keys);
        let scoreObj = {};
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i].split(':');
            if (!scoreObj[key[1]]) {
                scoreObj[key[1]] = {}
            }
            scoreObj[key[1]][key[2]] = parseInt(scores[i]);
        }
        const updatedContests = userContests.map(contest => ({
            ...contest,
            participants: contest.participants.map(participant => ({
                ...participant,
                score: scoreObj[participant.contestId][participant._id] ?? 0
            }))
        }));
        res.status(200).json(updatedContests);

    } catch (error) {
        printLog("ERROR", `Internal server error: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch contest details from contest ids
const fetchContestDetails = async (req, res) => {
    try {
        let contest;
        console.log(req.body.role);
        if (req.body.role === "manager") {
            const { contestIds } = req.query;
            const ids = contestIds ? contestIds.split(",").filter(Boolean) : [];
            contest = await Contest.aggregate([
                { $match: { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } } },
                {
                    $lookup: {
                        from: "participants",
                        localField: "_id",
                        foreignField: "contestId",
                        as: "participants"
                    }
                }
            ]);
            const keys = contest.flatMap(contest => contest.participants.map(participant => `score:${contest._id}:${participant._id}`));
            const scores = await redisClient.mGet(keys);
            let scoreObj = {};
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i].split(':');
                if (!scoreObj[key[1]]) {
                    scoreObj[key[1]] = {}
                }
                scoreObj[key[1]][key[2]] = parseInt(scores[i]);
            }
            contest = contest.map(contest => ({
                ...contest,
                participants: contest.participants.map(participant => ({
                    ...participant,
                    score: scoreObj[participant.contestId][participant._id] ?? 0
                }))
            }))
        } else {
            contest = await Contest.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(req.body._id) } },
                {
                    $lookup: {
                        from: "participants",
                        localField: "_id",
                        foreignField: "contestId",
                        as: "participants"
                    }
                }
            ]);
            
            const keys = contest.flatMap(contest => contest.participants.map(participant => `score:${contest._id}:${participant._id}`));
            const scores = await redisClient.mGet(keys);
            let scoreObj = {};
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i].split(':');
                if (!scoreObj[key[1]]) {
                    scoreObj[key[1]] = {}
                }
                scoreObj[key[1]][key[2]] = parseInt(scores[i]);
            }
            contest = contest.map(contest => ({
                ...contest,
                participants: contest.participants.map(participant => ({
                    ...participant,
                    score: scoreObj[participant.contestId][participant._id] ?? 0
                }))
            }))
        }
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }
        res.status(200).json(contest);
    } catch (error) {
        printLog("ERROR", `Internal server error: ${error}`);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete contests by id given comma separated in query params
const deleteContestsByIds = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { contestIds } = req.query;
    const ids = contestIds ? contestIds.split(",").filter(Boolean) : false;
    try {
        if (!ids) {
            const contests = await Contest.find({ creatorId: req.body._id }, { _id: 1 });
            await Contest.deleteMany({ creatorId: req.body._id });
            const contestIds = contests.map(contest => contest._id.toString());
            await redisClient.DEL(contestIds.map(id => `score:${id}:*`));
        } else {
            await Contest.deleteMany({ _id: { $in: ids }, creatorId: req.body._id });
            await redisClient.DEL(ids.map(id => `score:${id}:*`));
        }
        
        res.status(200).json({ message: "Contests deleted successfully" });
    } catch (error) {
        printLog("ERROR", "Internal server error");
        res.status(500).json({ message: "Internal server error" });
    }
};

// update contest details
const updateContestName = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { contestId, name } = req.query;

    if (!contestId || !name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const updatedContest = await Contest.findOneAndUpdate(
            { _id: contestId, creatorId: req.body._id },
            { name },
            { new: true }
        ).exec();

        console.log(updatedContest);

        if (!updatedContest) {
            return res.status(404).json({ message: "Contest not found or not authorized" });
        }

        res.status(200).json(updatedContest);
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateParticipantName = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { participantId, name: newName } = req.query;

    if (!participantId || !newName) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const updatedParticipant = await Participant.findOneAndUpdate(
            { _id: participantId },
            { name: newName },
            { new: true }
        ).exec();

        if (!updatedParticipant) {
            return res.status(404).json({ message: "Participant not found" });
        }

        res.status(200).json(updatedParticipant);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create contest tokens for judges and participants
const createContestTokens = async (req, res) => {
    if (req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { contestId } = req.query;
        const contest = await Contest.findById(contestId).exec();
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }
        const judgeToken = createJWT("judge", contest._id);
        const participantToken = createJWT("participant", contest._id);
        res.status(200).json({ judgeToken, participantToken });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// add score to a participant taken from query params
const addScore = async (req, res) => {
    if (req.body.role !== "judge" && req.body.role !== "manager") {
        printLog("ERROR", "Unauthorized");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { participantId, score } = req.query;
    if (!participantId || !score) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    if (req.body.role !== "judge") {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const result = await redisClient.incrBy(`score:${req.body._id}:${participantId}`, score);
        if (result === 1) {
            return res.status(404).json({ message: "Participant doesn't exist" });
        }
        res.status(200).json({ message: "Score added successfully" });
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export {
    createContest,
    fetchAllContests,
    fetchContestDetails,
    deleteContestsByIds,
    updateContestName,
    updateParticipantName,
    createContestTokens,
    addScore
};
