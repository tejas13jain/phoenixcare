import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { logger } from '../config/logger.js';

// Signaling-only server: it relays WebRTC offer/answer/ICE between the two peers in a
// consultation room and persists chat messages. Actual audio/video never touches this server —
// only session-description/candidate metadata does, so no media SDK/keys are required to run
// video/audio consultations locally. Swap in Agora/Twilio later for TURN relay at scale by
// pointing the client's ICE config at their servers; this signaling layer stays unchanged.
export function initSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return next(new Error('Invalid session'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (user ${socket.user._id})`);

    socket.on('room:join', async ({ appointmentId }) => {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || !appointment.roomId) return socket.emit('room:error', { message: 'Invalid consultation' });

      socket.join(appointment.roomId);
      socket.appointmentId = appointment._id.toString();
      socket.roomId = appointment.roomId;

      const roomSize = io.sockets.adapter.rooms.get(appointment.roomId)?.size || 1;
      socket.to(appointment.roomId).emit('room:peer-joined', { userId: socket.user._id });
      socket.emit('room:joined', { roomId: appointment.roomId, peersPresent: roomSize - 1 });
    });

    socket.on('webrtc:offer', ({ sdp }) => {
      if (socket.roomId) socket.to(socket.roomId).emit('webrtc:offer', { sdp, from: socket.user._id });
    });

    socket.on('webrtc:answer', ({ sdp }) => {
      if (socket.roomId) socket.to(socket.roomId).emit('webrtc:answer', { sdp, from: socket.user._id });
    });

    socket.on('webrtc:ice-candidate', ({ candidate }) => {
      if (socket.roomId) socket.to(socket.roomId).emit('webrtc:ice-candidate', { candidate, from: socket.user._id });
    });

    socket.on('consultation:start', async () => {
      if (!socket.appointmentId) return;
      const appointment = await Appointment.findByIdAndUpdate(
        socket.appointmentId,
        { status: 'in_progress', startedAt: new Date() },
        { new: true }
      );
      io.to(socket.roomId).emit('consultation:started', { appointment });
    });

    socket.on('chat:message', async ({ body }) => {
      if (!socket.roomId || !body?.trim()) return;
      const message = await ChatMessage.create({
        roomId: socket.roomId,
        appointment: socket.appointmentId,
        sender: socket.user._id,
        body: body.trim(),
      });
      io.to(socket.roomId).emit('chat:message', {
        _id: message._id,
        sender: socket.user._id,
        senderName: socket.user.name,
        body: message.body,
        createdAt: message.createdAt,
      });
    });

    socket.on('call:hangup', () => {
      if (socket.roomId) socket.to(socket.roomId).emit('call:hangup', { from: socket.user._id });
    });

    socket.on('disconnect', () => {
      if (socket.roomId) socket.to(socket.roomId).emit('room:peer-left', { userId: socket.user._id });
    });
  });
}
