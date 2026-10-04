import { aiAvailable, handleChat } from '../services/assistant/assistantService.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getStatus = (req, res) => {
  res.json({ success: true, data: { aiEnabled: aiAvailable() } });
};

export const chat = catchAsync(async (req, res) => {
  const { messages, lastShown } = req.validated.body;
  const result = await handleChat({ messages, lastShown });
  res.json({ success: true, data: result });
});
