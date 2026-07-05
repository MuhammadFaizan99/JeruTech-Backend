import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not defined. Skipping database connection.");
    return;
  }

  try {
    const conn = await mongoose.connect("mongodb+srv://jerutechadmin:J3ruT3ch%402026%21M0ng0DB%23Atlas@cluster0.v3fivoz.mongodb.net/JeruTech_Web?retryWrites=true&w=majority&appName=Cluster0");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

export default connectDB;
