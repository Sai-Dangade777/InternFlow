import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).lean();
    res.json({ items: notifications });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    await AuditLog.create({
      action: "notification.created",
      actor: req.user?.email || "system",
      metadata: { type: notification.type },
      candidateId: notification.candidateId
    });
    res.status(201).json({ item: notification });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: "sent" },
      { new: true }
    );
    res.json({ item: notification });
  } catch (error) {
    next(error);
  }
};
