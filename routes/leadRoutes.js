import express from 'express';
const router = express.Router();

import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  addNote,
  assignLead,
  getLeadActivities,
  getDashboardStats,
  updateLead,
  deleteLead,
} from '../controllers/leadController.js';

import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';

router.route('/')
  .post(protect, createLead)
  .get(protect, getLeads);

router.get('/dashboard', protect, getDashboardStats);

router.route('/:id')
  .get(protect, checkObjectId, getLeadById)
  .put(protect, updateLead)
  .delete(protect, admin, checkObjectId, deleteLead);

router.put('/:id/status', protect, checkObjectId, updateLeadStatus);

router.post('/:id/notes', protect, checkObjectId, addNote);

router.put('/:id/assign', protect, admin, checkObjectId, assignLead);

router.get('/:id/activities', protect, checkObjectId, getLeadActivities);

export default router;