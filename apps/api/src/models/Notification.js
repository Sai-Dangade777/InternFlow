import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    channel: { type: String, default: "email" },
    status: { type: String, default: "pending" },
    recipient: { type: String, default: "" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
