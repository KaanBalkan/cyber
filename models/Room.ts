import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: String,
  activeUsers: { type: Number, default: 0 }, // New field
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
