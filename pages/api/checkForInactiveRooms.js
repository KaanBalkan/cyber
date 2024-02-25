// /api/checkForInactiveRooms.js

import dbConnect from "../libs/dbConnect";
import Room from "../models/Room";

export default async function checkForInactiveRooms(req, res) {
  await dbConnect();

  const TIMEOUT = 11 * 1000; // 11 seconds
  const now = new Date();
  const rooms = await Room.find({
    lastActive: { $lt: new Date(now.getTime() - TIMEOUT) },
  });
  for (const room of rooms) {
    await Room.findByIdAndUpdate(room._id, {
      status: "timed out",
    });
  }

  res.status(200).json({ message: "Checked for inactive rooms" });
}