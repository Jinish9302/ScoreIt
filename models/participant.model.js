import { model, Schema } from "mongoose";

const participantSchema = new Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true, default: 0 },
  contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
}, { timestamps: true });

export default model("Participant", participantSchema);
