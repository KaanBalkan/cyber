import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: { type: String, default: "waiting" }, // Add a comma here
  connectedUsers: { type: [String], default: [] },
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
