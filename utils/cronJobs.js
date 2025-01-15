import cron from 'node-cron';
import Participant from '../models/participant.model.js';
import { redisClient } from '../db.js';
import printLog from '../utils/printLog.js';

const applyCronJobs = () => {
    // Update participant scores every minute
    cron.schedule('*/1 * * * *', async () => {
        printLog('INFO', 'Updating participant scores from Redis to database');
        try {
            const keys = (await redisClient.keys('score:*')).filter(key => !key.includes('undefined'));
            if (keys.length === 0) return;
            const scores = await redisClient.mGet(keys);
            const bulkOps = keys
            .map((key, index) => {
                const [_, contestId, participantId] = key.split(':');
                return {
                    updateOne: {
                        filter: { _id: participantId, contestId },
                        update: { score: parseInt(scores[index]) }
                    }
                };
            })
            await Participant.bulkWrite(bulkOps);

            printLog('SUCCESS', 'Updated participant scores from Redis to database');
        } catch (error) {
            printLog('ERROR', `Failed to update participant scores: ${error.message}`);
        }
    });

}

export { applyCronJobs };
