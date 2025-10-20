import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      enum: ["patient_assigned", "status_changed", "ai_report_generated"],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
