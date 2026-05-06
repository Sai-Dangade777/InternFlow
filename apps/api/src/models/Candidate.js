
import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String }
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String },
    institution: { type: String },
    year: { type: String }
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    department: { type: String },
    team: { type: String }
  },
  { _id: false }
);

const joiningFormSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["draft", "submitted"], default: "draft" },
    submittedAt: { type: Date, default: null },
    submittedTo: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    aadhaarNumber: { type: String, default: "" },
    panCardNumber: { type: String, default: "" },
    nonWorkerId: { type: String, default: "" },
    governmentId: { type: String, default: "" },
    declarationAccepted: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null }
  },
  { _id: false }
);

const accessSchema = new mongoose.Schema(
  {
    status: { type: String, default: "Pending" },
    adAccount: { type: String, default: "" },
    provisionedAt: { type: Date, default: null },
    deactivatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const ndaSchema = new mongoose.Schema(
  {
    status: { type: String, default: "Not Issued" },
    issuedAt: { type: Date, default: null },
    signedAt: { type: Date, default: null }
  },
  { _id: false }
);

const lifecycleSchema = new mongoose.Schema(
  {
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    extensionDate: { type: Date, default: null },
    closureDate: { type: Date, default: null }
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    requestedAt: { type: Date, default: null },
    issuedAt: { type: Date, default: null },
    documentBody: { type: String, default: "" },
    issuedBy: { type: String, default: "" }
  },
  { _id: false }
);

const letterSchema = new mongoose.Schema(
  {
    generatedAt: { type: Date, default: null },
    generatedBy: { type: String, default: "" },
    body: { type: String, default: "" }
  },
  { _id: false }
);

const slaSchema = new mongoose.Schema(
  {
    nonWorkerIdDueAt: { type: Date, default: null },
    ndaDueAt: { type: Date, default: null },
    accessDeactivationDueAt: { type: Date, default: null },
    nonWorkerIdStatus: { type: String, default: "pending" },
    ndaStatus: { type: String, default: "pending" },
    accessDeactivationStatus: { type: String, default: "pending" },
    lastEscalatedAt: { type: Date, default: null }
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    skills: { type: [String], default: [] },
    education: { type: [educationSchema], default: [] },
    availability: { type: String, default: "" },
    referrer: { type: contactSchema, default: () => ({}) },
    mentor: { type: contactSchema, default: () => ({}) },
    domain: { type: String, default: "" },
    hasIdProof: { type: Boolean, default: false },
    unpaidConsent: { type: Boolean, default: false },
    inPersonConsent: { type: Boolean, default: false },
    joiningLocation: { type: String, default: "" },
    internshipDurationWeeks: { type: Number, default: null },
    internshipStartDate: { type: Date, default: null },
    internshipEndDate: { type: Date, default: null },
    relationshipDeclaration: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Referral", "NDA", "Active", "Completed"],
      default: "Referral"
    },
    score: { type: Number, default: null },
    readinessExplanation: { type: String, default: "" },
    resumePath: { type: String, default: "" },
    joiningForm: { type: joiningFormSchema, default: () => ({}) },
    accessProvisioning: { type: accessSchema, default: () => ({}) },
    nda: { type: ndaSchema, default: () => ({}) },
    lifecycle: { type: lifecycleSchema, default: () => ({}) },
    certificate: { type: certificateSchema, default: () => ({}) },
    ndaSignedAt: { type: Date, default: null },
    hrReviewedAt: { type: Date, default: null },
    letters: {
      offer: { type: letterSchema, default: () => ({}) },
      startConfirmation: { type: letterSchema, default: () => ({}) },
      closure: { type: letterSchema, default: () => ({}) }
    },
    sla: { type: slaSchema, default: () => ({}) },
    timeline: { type: [timelineSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
