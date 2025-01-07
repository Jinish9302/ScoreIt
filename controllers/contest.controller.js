import Contest from "../models/contest.model.js"; 4
import redisClient from "../redis.js";
import { v4 as uuidv4 } from 'uuid';
import printLog from "../utils/printLog.js";

const createContest = async (req, res) => {
    const { name, userId: creatorId, participants } = req.body;
    const participantsWithIds = participants.map((participant) => ({
        id: uuidv4(),
        ...participant,
        score: 0
    }));

    try {
        const contest = await Contest.create({
            name,
            creatorId,
            participants: participantsWithIds,
        });

        await redisClient.set(`contests:${contest._id}:name`, name);

        for (const participant of participantsWithIds) {
            await redisClient.set(
                `contests:${contest._id}:participants:${participant.id}:score`,
                participant.score.toString(),
            );
        }

        res.status(201).json({ message: "Contest created successfully"});
    } catch (error) {
        printLog("ERROR", error.message);
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
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch contest details from contest ids from redis, first attempt to fetch from redis if not found then fetch from mongodb, ids are coma saperated in query params
const fetchContestDetails = async (req, res) => {
    const { contestIds } = req.query;
    const ids = contestIds.split(",").filter(Boolean);

    try {
        const contests = await Promise.all(
            ids.map(async (id) => {
                const cachedContest = await redisClient.get(`contests:${id}:name`);
                if (cachedContest) {
                    return {
                        _id: id,
                        name: cachedContest,
                    };
                }

                const contest = await Contest.findById(id, { _id: 1, name: 1 });
                if (!contest) {
                    return null;
                }

                await redisClient.set(`contests:${id}:name`, contest.name);
                return contest;
            })
        ).then((contests) => contests.filter(Boolean));

        res.status(200).json(contests);
    } catch (error) {
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
            await Contest.deleteMany({ _id: { $in: ids } });
            await Promise.all(ids.map((id) => redisClient.del(`contests:${id}:name`)));
        }

        res.status(200).json({ message: "Contests deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export { createContest, fetchAllContests, fetchContestDetails, deleteContestsByIds };
