import Contest from "../models/contest.model.js";
import Participant from "../models/participant.model.js";
import createJWT from "../utils/createJWT.js";
import printLog from "../utils/printLog.js";
import { mongoose } from "mongoose";

const createContest = async (req, res) => {
    const { name, userId: creatorId, participants } = req.body;
    const formattedParticipants = participants.map((participant) => ({
        ...participant,
        score: 0
    }));
    try {
        const newContest = await Contest.create({ name, creatorId });
        await Participant.insertMany(formattedParticipants.map((participant) => ({
            ...participant,
            contestId: newContest._id
        })));
        res.status(201).json({ message: "Contest created successfully" });
    } catch (error) {
        printLog("ERROR", `Error creating contest: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch all contests that belong to a user
const fetchAllContests = async (req, res) => {
    const { pageNumber, pageSize } = req.query;
    const skip = (pageNumber - 1) * pageSize;
    const limit = parseInt(pageSize, 10);
    try {
        const userContests = await Contest.find({ creatorId: req.body.userId }, { _id: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .exec();
        res.status(200).json(userContests);
    } catch (error) {
        printLog("ERROR", "Internal server error");
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch contest details from contest ids
const fetchContestDetails = async (req, res) => {
    try {
        let contest;
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
    const { contestIds } = req.query;
    const ids = contestIds ? contestIds.split(",").filter(Boolean) : false;
    try {
        if (!ids) {
            await Contest.deleteMany({ creatorId: req.body.userId });
        } else {
            await Contest.deleteMany({ _id: { $in: ids }, creatorId: req.body.userId });
        }

        res.status(200).json({ message: "Contests deleted successfully" });
    } catch (error) {
        printLog("ERROR", "Internal server error");
        res.status(500).json({ message: "Internal server error" });
    }
};

// update contest details
const updateContestName = async (req, res) => {
    const { contestId, name } = req.query;

    if (!contestId || !name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const updatedContest = await Contest.findOneAndUpdate(
            { _id: contestId, creatorId: req.body.userId },
            { name },
            { new: true }
        ).exec();

        if (!updatedContest) {
            return res.status(404).json({ message: "Contest not found or not authorized" });
        }

        res.status(200).json({ _id: updatedContest._id, name: updatedContest.name });
    } catch (error) {
        printLog("ERROR", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateParticipantName = async (req, res) => {
    const { contestId, participantId, name: newName } = req.query;

    if (!contestId || !participantId || !newName) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const contest = await Contest.findOne({
            _id: contestId,
            creatorId: req.body.userId,
            "participants.id": participantId,
        });

        if (!contest) {
            return res.status(404).json({
                message: "Contest not found, unauthorized, or participant does not exist",
            });
        }

        const updatedContest = await Contest.findOneAndUpdate(
            { _id: contestId, "participants.id": participantId },
            { $set: { "participants.$.name": newName } },
            { new: true }
        ).exec();

        if (!updatedContest) {
            return res.status(404).json({ message: "Participant not found" });
        }

        res.status(200).json({ _id: updatedContest._id, participants: updatedContest.participants });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create contest tokens for judges and participants
const createContestTokens = async (req, res) => {
    try {
        const { contestId } = req.body._id;
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
    const { participantId, score } = req.query;
    if (!participantId || !score) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    if (req.body.role !== "judge") {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const updatedParticipant = await Participant.findOneAndUpdate(
            { _id: participantId },
            { $inc: { score } },
            { new: true }
        ).exec();
        if (!updatedParticipant) {
            return res.status(404).json({ message: "Participant not found" });
        }
        res.status(200).json({ _id: updatedParticipant._id, score: updatedParticipant.score });
    } catch (error) {
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
