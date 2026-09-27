import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getMyProfile = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate('user', 'name email phone avatarUrl');
  if (!patient) throw ApiError.notFound('Patient profile not found');
  res.json({ success: true, data: { patient } });
});

export const updateMyProfile = catchAsync(async (req, res) => {
  const { height, weight, fitnessGoal, goesToGym, dob, gender, bloodGroup, city, address } = req.body;
  const update = {};
  if (height !== undefined) update.height = height;
  if (weight !== undefined) update.weight = weight;
  if (fitnessGoal !== undefined) update.fitnessGoal = fitnessGoal;
  if (goesToGym !== undefined) update.goesToGym = goesToGym;
  if (dob !== undefined) update.dob = dob;
  if (gender !== undefined) update.gender = gender;
  if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
  if (city !== undefined) update.city = city;
  if (address !== undefined) update.address = address;

  const patient = await Patient.findOneAndUpdate({ user: req.user._id }, update, { new: true, runValidators: true });
  if (!patient) throw ApiError.notFound('Patient profile not found');
  res.json({ success: true, message: 'Profile updated', data: { patient } });
});
