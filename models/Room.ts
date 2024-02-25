import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: { type: String, default: "empty" }, // default status can be 'empty'
  userCount: { type: Number, default: 0 },    // track the number of users in the room
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
