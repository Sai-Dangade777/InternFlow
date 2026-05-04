import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import referralRoutes from "./routes/referrals.js";
import candidateRoutes from "./routes/candidates.js";
import aiRoutes from "./routes/ai.js";
import slaRoutes from "./routes/sla.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import webhookRoutes from "./routes/webhooks.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "4mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Intern Flow API",
    status: "ok"
  });
});

app.use("/webhooks", webhookRoutes);
app.use("/health", healthRoutes);
app.use("/referrals", referralRoutes);
app.use("/candidates", candidateRoutes);
app.use("/ai", aiRoutes);
app.use("/sla", slaRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reports", reportRoutes);
app.use("/uploads", express.static("uploads"));
app.use(errorHandler);

export default app;
