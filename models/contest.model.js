import { model, Schema, Types } from "mongoose";

const Contest = new Schema({
    name: { type: String, required: true },
    creatorId: { type: Types.ObjectId, ref: "User", required: true },
    participants: [{
        name: { type: String, required: true },
        score: { type: Number, required: true }
    }]
})

export default model("Contest", Contest)
