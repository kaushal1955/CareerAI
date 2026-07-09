import mongoose from "mongoose";

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in server environment variables.");
  }

  const connection = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  try {
    const usersCollection = connection.connection.db.collection("users");
    const indexes = await usersCollection.indexes();
    if (indexes.some((index) => index.name === "clerkId_1")) {
      await usersCollection.dropIndex("clerkId_1");
      console.log("Dropped stale clerkId_1 index on users collection.");
    }
  } catch (error) {
    console.warn("Skipped clerkId_1 index cleanup:", error.message);
  }

  return connection;
}
