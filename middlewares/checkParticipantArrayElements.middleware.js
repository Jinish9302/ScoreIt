// isParticipantValid
const isParticipantValid = participant => participant.name;

// check if participant array in body has valid participent schema
const checkParticipantArrayElements = (req, res, next) => {
    if (!Array.isArray(req.body.participants) || !req.body.participants.every(isParticipantValid)) {
        return res.status(400).json({ message: "Invalid participant data" });
    }
    next();
}

export default checkParticipantArrayElements
