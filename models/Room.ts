import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  participantCount: {
    type: Number,
    default: 0
  }
  // You can add other fields here if needed
});

// Ensure the model is not overwritten if it already exists
export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
