import { SurgeryEnquiry } from '../models/SurgeryEnquiry.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const createEnquiry = catchAsync(async (req, res) => {
  const enquiry = await SurgeryEnquiry.create({ ...req.validated.body, user: req.user?._id });
  res.status(201).json({
    success: true,
    message: 'Request received. Our care team will call you shortly.',
    data: { enquiry: { _id: enquiry._id, status: enquiry.status } },
  });
});

export const listEnquiries = catchAsync(async (req, res) => {
  const { status } = req.validated.query;
  const enquiries = await SurgeryEnquiry.find(status ? { status } : {})
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ success: true, data: { enquiries } });
});

export const updateEnquiryStatus = catchAsync(async (req, res) => {
  const enquiry = await SurgeryEnquiry.findByIdAndUpdate(
    req.validated.params.id,
    { status: req.validated.body.status },
    { new: true, runValidators: true }
  );
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  res.json({ success: true, message: 'Enquiry updated', data: { enquiry } });
});
