import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actor: { type: String, default: "system" },
    metadata: { type: Object, default: {} },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
