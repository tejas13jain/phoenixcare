import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 4000 },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
