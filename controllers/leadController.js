import asyncHandler from '../middleware/asyncHandler.js';
import Lead from '../models/leadModel.js';
import LeadActivity from '../models/leadActivityModel.js';

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
const createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    createdBy: req.user._id,
    assignedTo: req.user._id,
  });

  await LeadActivity.create({
    lead: lead._id,
    type: 'NOTE',
    message: 'Lead created',
    createdBy: req.user._id,
  });

  res.status(201).json(lead);
});

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Private/Admin
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const allowedFields = [
    "name",
    "email",
    "phone",
    "budget",
    "location",
    "propertyType",
    "status",
    "source",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      lead[field] = req.body[field];
    }
  });

  const updatedLead = await lead.save();
  res.json(updatedLead);
});

// @desc    Get all leads (search, filter, sort)
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = process.env.PAGINATION_LIMIT || 10,
    keyword,
    status,
    source,
    assignedTo,
    sort = "-createdAt",
  } = req.query;

  const pageNumber = Math.max(1, Number(page));

  // =========================
  // FORCE MAX LIMIT = 10
  // =========================
  const MAX_LIMIT = Number(process.env.PAGINATION_LIMIT || 10);

  const limitNumber = Math.min(
    Math.max(1, Number(limit) || MAX_LIMIT),
    MAX_LIMIT
  );

  const skip = (pageNumber - 1) * limitNumber;

  let query = { isArchived: false };

  // =========================
  // SEARCH (name, email, phone)
  // =========================
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];
  }

  if (status) query.status = status;
  if (source) query.source = source;
  if (assignedTo) query.assignedTo = assignedTo;

  // =========================
  // FETCH DATA
  // =========================
  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber),

    Lead.countDocuments(query),
  ]);

  res.json({
    data: leads,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  });
});


// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  res.json(lead);
});


// @desc    Update lead status
// @route   PUT /api/leads/:id/status
// @access  Private
const updateLeadStatus = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const oldStatus = lead.status;
  lead.status = req.body.status;

  await lead.save();

  await LeadActivity.create({
    lead: lead._id,
    type: 'STATUS_CHANGE',
    message: `${oldStatus} → ${lead.status}`,
    createdBy: req.user._id,
  });

  res.json(lead);
});

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (lead) {
    await Lead.deleteOne({ _id: lead._id });
    res.json({ message: 'Lead removed' });
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

// @desc    Add note
// @route   POST /api/leads/:id/notes
// @access  Private
const addNote = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const note = {
    text: req.body.text,
    createdBy: req.user._id,
  };

  lead.notes.push(note);
  await lead.save();

  await LeadActivity.create({
    lead: lead._id,
    type: 'NOTE',
    message: req.body.text,
    createdBy: req.user._id,
  });

  res.json(lead.notes);
});


// @desc    Assign lead
// @route   PUT /api/leads/:id/assign
// @access  Private/Admin
const assignLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  lead.assignedTo = req.body.userId;
  await lead.save();

  await LeadActivity.create({
    lead: lead._id,
    type: 'ASSIGNED',
    message: 'Lead reassigned',
    createdBy: req.user._id,
  });

  res.json(lead);
});


// @desc    Get lead activities (timeline)
// @route   GET /api/leads/:id/activities
// @access  Private
const getLeadActivities = asyncHandler(async (req, res) => {
  const activities = await LeadActivity.find({
    lead: req.params.id,
  })
    .populate('createdBy', 'name')
    .sort('-createdAt');

  res.json(activities);
});


// @desc    Dashboard stats
// @route   GET /api/leads/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalLeads = await Lead.countDocuments();

  const leadsBySource = await Lead.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } },
  ]);

  const statusDistribution = await Lead.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const closedLeads = await Lead.countDocuments({ status: 'Closed' });

  const conversionRate = totalLeads
    ? ((closedLeads / totalLeads) * 100).toFixed(2)
    : 0;

  res.json({
    totalLeads,
    leadsBySource,
    statusDistribution,
    conversionRate,
  });
});


export {
  createLead,
  updateLead,
  deleteLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  addNote,
  assignLead,
  getLeadActivities,
  getDashboardStats,
};