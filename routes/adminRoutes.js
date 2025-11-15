const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/Admin/userController');
const {
    getAllHosts,
    getHostById,
    createHost,
    updateHost,
    deleteHost
} = require('../controllers/Admin/hostController');
const {
    getAllEventLocations,
    getEventLocationById,
    createEventLocation,
    updateEventLocation,
    deleteEventLocation
} = require('../controllers/Admin/eventLocationController');

const router = express.Router();

// User Management Routes
router.route('/users')
    .get(authMiddleware({ minRole: 'superadmin' }), getAllUsers)
    .post(authMiddleware({ minRole: 'superadmin' }), createUser);

router.route('/users/:id')
    .get(authMiddleware({ minRole: 'superadmin' }), getUserById)
    .put(authMiddleware({ minRole: 'superadmin' }), updateUser)
    .delete(authMiddleware({ minRole: 'superadmin' }), deleteUser);

// Host Management Routes
router.route('/hosts')
    .get(authMiddleware({ minRole: 'superadmin' }), getAllHosts)
    .post(authMiddleware({ minRole: 'superadmin' }), createHost);

router.route('/hosts/:id')
    .get(authMiddleware({ minRole: 'superadmin' }), getHostById)
    .put(authMiddleware({ minRole: 'superadmin' }), updateHost)
    .delete(authMiddleware({ minRole: 'superadmin' }), deleteHost);

// Event Location Management Routes
router.route('/eventlocations')
    .get(authMiddleware({ minRole: 'superadmin' }), getAllEventLocations)
    .post(authMiddleware({ minRole: 'superadmin' }), createEventLocation);

router.route('/eventlocations/:id')
    .get(authMiddleware({ minRole: 'superadmin' }), getEventLocationById)
    .put(authMiddleware({ minRole: 'superadmin' }), updateEventLocation)
    .delete(authMiddleware({ minRole: 'superadmin' }), deleteEventLocation);

// Event Management Routes
const eventRoutes = require('./admin/eventRoutes');
router.use('/events', eventRoutes);

module.exports = router;
