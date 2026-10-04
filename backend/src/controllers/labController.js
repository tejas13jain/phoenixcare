import { Lab } from '../models/Lab.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { escapeRegex } from '../utils/escapeRegex.js';

// Fields patients never need to see.
const PUBLIC_PROJECTION = '-createdBy -licenseNumber -contactPerson -email';

// Builds the Mongo filter shared by the public lab search and the admin "deep search".
// Admins can additionally match on license number, contact person, email and phone.
function buildLabFilter({ q, city, category, homeCollection, status, accreditation }, { admin }) {
  const filter = {};
  if (!admin) filter.status = 'active';
  else if (status) filter.status = status;

  if (city) filter.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };
  if (category) filter['tests.category'] = category;
  if (homeCollection) filter.homeCollection = homeCollection === 'true';
  if (accreditation) filter.accreditations = accreditation;

  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ name: rx }, { city: rx }, { 'tests.name': rx }, { address: rx }];
    if (admin) filter.$or.push({ licenseNumber: rx }, { contactPerson: rx }, { email: rx }, { phone: rx });
  }
  return filter;
}

// For a test search, tells the UI which of the lab's tests matched so it can show them first.
function withMatchedTests(lab, { q, category }) {
  if (!q && !category) return { ...lab, matchedTests: [] };
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;
  const matchedTests = lab.tests.filter(
    (t) => (!rx || rx.test(t.name)) && (!category || t.category === category)
  );
  return { ...lab, matchedTests };
}

async function paginate(filter, { page, limit }, projection) {
  const [labs, total] = await Promise.all([
    Lab.find(filter, projection).sort({ status: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Lab.countDocuments(filter),
  ]);
  return { labs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ---- Public ----

export const listLabs = catchAsync(async (req, res) => {
  const query = req.validated.query;
  const { labs, pagination } = await paginate(buildLabFilter(query, { admin: false }), query, PUBLIC_PROJECTION);
  res.json({ success: true, data: { labs: labs.map((lab) => withMatchedTests(lab, query)), pagination } });
});

export const getLabCities = catchAsync(async (req, res) => {
  const cities = await Lab.distinct('city', { status: 'active' });
  res.json({ success: true, data: { cities: cities.sort() } });
});

export const getLab = catchAsync(async (req, res) => {
  const lab = await Lab.findOne({ _id: req.validated.params.id, status: 'active' }, PUBLIC_PROJECTION).lean();
  if (!lab) throw ApiError.notFound('Lab not found');
  res.json({ success: true, data: { lab } });
});

// ---- Admin ----

export const adminListLabs = catchAsync(async (req, res) => {
  const query = req.validated.query;
  const { labs, pagination } = await paginate(buildLabFilter(query, { admin: true }), query);
  res.json({ success: true, data: { labs: labs.map((lab) => withMatchedTests(lab, query)), pagination } });
});

export const adminGetLab = catchAsync(async (req, res) => {
  const lab = await Lab.findById(req.validated.params.id).lean();
  if (!lab) throw ApiError.notFound('Lab not found');
  res.json({ success: true, data: { lab } });
});

export const adminCreateLab = catchAsync(async (req, res) => {
  const body = req.validated.body;
  if (await Lab.exists({ licenseNumber: body.licenseNumber })) {
    throw ApiError.conflict('A lab with this license number is already onboarded');
  }
  const lab = await Lab.create({ ...body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: `${lab.name} onboarded`, data: { lab } });
});

export const adminUpdateLab = catchAsync(async (req, res) => {
  const { id } = req.validated.params;
  const body = req.validated.body;
  if (body.licenseNumber && (await Lab.exists({ licenseNumber: body.licenseNumber, _id: { $ne: id } }))) {
    throw ApiError.conflict('Another lab already uses this license number');
  }
  const lab = await Lab.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!lab) throw ApiError.notFound('Lab not found');
  res.json({ success: true, message: 'Lab updated', data: { lab } });
});
