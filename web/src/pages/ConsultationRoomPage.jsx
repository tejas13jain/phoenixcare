import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, FileText } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Card, Button, Badge } from '../components/ui/index.js';
import { consultationApi } from '../api/appointmentApi.js';
import { extractErrorMessage } from '../api/client.js';
import { useAuthStore } from '../store/slices/authStore.js';
import { PrescriptionWriter } from '../components/PrescriptionWriter.jsx';

export function ConsultationRoomPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const isDoctor = user?.role === 'doctor';
  const needsMedia = room?.mode === 'video' || room?.mode === 'audio';

  const createPeerConnection = useCallback((iceServers) => {
    const pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit('webrtc:ice-candidate', { candidate: event.candidate });
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };
    return pc;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const { data } = await consultationApi.getRoomInfo(appointmentId);
        if (cancelled) return;
        setRoom(data);

        const historyRes = await consultationApi.getChatHistory(appointmentId);
        setMessages(historyRes.data.messages);

        const socket = io('/', { auth: { token: accessToken } });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('room:join', { appointmentId });
        });

        socket.on('room:error', ({ message }) => toast.error(message));

        socket.on('chat:message', (msg) => setMessages((prev) => [...prev, msg]));

        if (needsMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: data.mode === 'video',
            audio: true,
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;

          const pc = createPeerConnection(data.iceServers);
          pcRef.current = pc;
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          socket.on('room:peer-joined', async () => {
            // The doctor initiates the offer once the patient has joined.
            if (isDoctor) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('webrtc:offer', { sdp: offer });
            }
          });

          socket.on('webrtc:offer', async ({ sdp }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:answer', { sdp: answer });
          });

          socket.on('webrtc:answer', async ({ sdp }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          });

          socket.on('webrtc:ice-candidate', async ({ candidate }) => {
            try {
              await pc.addIceCandidate(candidate);
            } catch {
              /* ignore late/duplicate candidates */
            }
          });
        }

        socket.on('call:hangup', () => {
          toast('The other participant left the call', { icon: '📞' });
        });
      } catch (err) {
        toast.error(extractErrorMessage(err));
      }
    }

    setup();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const handleHangup = () => {
    socketRef.current?.emit('call:hangup');
    navigate(isDoctor ? '/doctor/dashboard' : '/patient/appointments');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('chat:message', { body: chatInput });
    setChatInput('');
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-semibold text-lg">Consultation room</h1>
              <Badge variant={connected ? 'success' : 'warning'}>{connected ? 'Connected' : 'Connecting…'}</Badge>
            </div>
            {isDoctor && (
              <Button variant="outline" size="sm" onClick={() => setShowPrescription((v) => !v)}>
                <FileText size={16} className="mr-1" /> Write prescription
              </Button>
            )}
          </div>

          {needsMedia ? (
            <div className="relative bg-charcoal rounded-3xl overflow-hidden aspect-video">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <motion.video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-4 right-4 w-32 sm:w-44 rounded-2xl border-2 border-white/30 object-cover"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <ControlButton onClick={toggleMic} active={micOn} Icon={micOn ? Mic : MicOff} />
                {room?.mode === 'video' && (
                  <ControlButton onClick={toggleCam} active={camOn} Icon={camOn ? Video : VideoOff} />
                )}
                <ControlButton onClick={handleHangup} danger Icon={PhoneOff} />
              </div>
            </div>
          ) : (
            <Card className="flex items-center justify-center h-32 text-slate-600">
              Chat-only consultation — use the panel to message your {isDoctor ? 'patient' : 'doctor'}.
              <div className="ml-4">
                <ControlButton onClick={handleHangup} danger Icon={PhoneOff} />
              </div>
            </Card>
          )}

          {showPrescription && isDoctor && (
            <div className="mt-6">
              <PrescriptionWriter appointmentId={appointmentId} onDone={() => setShowPrescription(false)} />
            </div>
          )}
        </div>

        <Card className="flex flex-col h-[480px]">
          <h2 className="font-heading font-semibold mb-3">Chat</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.sender === user._id || msg.sender?._id === user._id
                    ? 'ml-auto bg-teal-500 text-white'
                    : 'bg-slate-600/10 text-charcoal'
                }`}
              >
                {msg.body}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 mt-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border border-slate-600/20 px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm">
              <Send size={16} />
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}

function ControlButton({ onClick, active = true, danger = false, Icon }) {
  return (
    <button
      onClick={onClick}
      className={`h-12 w-12 rounded-full flex items-center justify-center shadow-soft-lg transition-colors ${
        danger ? 'bg-error text-white' : active ? 'bg-white text-charcoal' : 'bg-slate-600 text-white'
      }`}
    >
      <Icon size={20} />
    </button>
  );
}
