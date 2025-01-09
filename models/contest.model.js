import { model, Schema } from "mongoose";

const contestSchema = new Schema({
    name: { type: String, required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default model("Contest", contestSchema);
