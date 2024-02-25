import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: { type: String, default: "empty" },
  userCount: { type: Number, default: 0 },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Array of user IDs
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
