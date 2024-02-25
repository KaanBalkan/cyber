// Room.ts
import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: String,
  lastActive: { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);