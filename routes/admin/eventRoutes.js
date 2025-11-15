const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendance,
} = require('../../controllers/Admin/eventsController');
const authMiddleware = require('../../middleware/authMiddleware');

// All routes in this file are protected and restricted to superadmins

// GET /api/admin/events - Get all events with sorting and filtering
router.get('/', authMiddleware({ minRole: 'superadmin' }), getAllEvents);

// GET /api/admin/events/:id - Get a single event by ID
router.get('/:id', authMiddleware({ minRole: 'superadmin' }), getEventById);

// POST /api/admin/events - Create a new event
router.post('/', authMiddleware({ minRole: 'superadmin' }), createEvent);

// PUT /api/admin/events/:id - Update an existing event
router.put('/:id', authMiddleware({ minRole: 'superadmin' }), updateEvent);

// DELETE /api/admin/events/:id - Delete an event
router.delete('/:id', authMiddleware({ minRole: 'superadmin' }), deleteEvent);

// GET /api/admin/events/:id/attendance - Get event attendance
router.get('/:id/attendance', authMiddleware({ minRole: 'superadmin' }), getEventAttendance);

module.exports = router;
