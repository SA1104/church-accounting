// backend/service/church/index.js
// Church Think - Main Service Router (Platform 3.1)
// All Church Think APIs are mounted under /api/church/*
const express = require('express');
const router = express.Router();

// Initialize capability-specific DB (schema migrations & seed)
require('./db_init');

const { authenticateToken } = require('../../core/auth');
router.get('/debug/me', authenticateToken, (req, res) => {
  res.json({
    user_id: req.user.userId,
    username: req.user.username,
    service_id: 'church_think',
    activeContext: req.user.accounting ? req.user.accounting : null,
    accountingRole: req.user.accounting ? req.user.accounting.role : null,
    platformRoles: req.user.roles ? req.user.roles.platform : null,
    roles: req.user.roles,
    debug: 'added for P0 verification'
  });
});

// Platform 3.1 Capability Routes
const profileRouter = require('./profile');
const committeesRouter = require('./committees');
const groupsRouter = require('./groups');
const positionsRouter = require('./positions');
const assignmentsRouter = require('./assignments');
const onboardingRouter = require('./onboarding');
const membershipRouter = require('./membership');
const invitationsRouter = require('./invitations');
const usersRouter = require('./users');

// Legacy service routes (vouchers, approvals, ledgers, etc.)
const vouchersRouter = require('./vouchers');
const approvalsRouter = require('./approvals');
const ledgersRouter = require('./ledgers');
const locksRouter = require('./locks');
const categoriesRouter = require('./categories');
const orgsRouter = require('./organizations');

// Capability Isolation Router mounts
router.use('/profile', profileRouter);
router.use('/admin/committees', committeesRouter);
router.use('/admin/groups', groupsRouter);
router.use('/positions', positionsRouter);
router.use('/assignments', assignmentsRouter);
router.use('/onboarding', onboardingRouter);
router.use('/membership', membershipRouter);
router.use('/invitations', invitationsRouter);
router.use('/users', usersRouter);

// Core Business Domain Route mounts
router.use('/vouchers', vouchersRouter);
router.use('/approvals', approvalsRouter);
router.use('/ledgers', ledgersRouter);
router.use('/period-locks', locksRouter);
router.use('/categories', categoriesRouter);
router.use('/', orgsRouter);

module.exports = router;
