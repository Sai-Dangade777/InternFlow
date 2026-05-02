import mongoose from "mongoose";

export const connectToDatabase = async (connectionString) => {
  if (!connectionString) {
    throw new Error("MONGODB_URI is not set");
  }

  if (connectionString.includes("<db_password>")) {
    throw new Error(
      "MONGODB_URI still has <db_password>. Replace it with your real password (URL-encoded)."
    );
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 8000
    });
  } catch (error) {
    const message = error?.message || "Failed to connect to MongoDB";
    const isSrv = connectionString.startsWith("mongodb+srv://");
    const srvHint =
      isSrv && message.includes("ECONNREFUSED")
        ? " Check Atlas Network Access allowlist and DNS. If SRV is blocked, use the standard connection string."
        : "";
    const err = new Error(`${message}${srvHint}`);
    err.cause = error;
    throw err;
  }
};
