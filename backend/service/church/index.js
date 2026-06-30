// backend/service/church/index.js
// Church Think - Main Service Router (Platform 3.1)
// All Church Think APIs are mounted under /api/church/*
const express = require('express');
const router = express.Router();

// Initialize capability-specific DB (schema migrations & seed)
require('./db_init');

// Platform 3.1 Capability Routes
const profileRouter = require('./profile');
const committeesRouter = require('./committees');
const groupsRouter = require('./groups');
const positionsRouter = require('./positions');
const assignmentsRouter = require('./assignments');
const onboardingRouter = require('./onboarding');
const membershipRouter = require('./membership');

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

// Core Business Domain Route mounts
router.use('/vouchers', vouchersRouter);
router.use('/approvals', approvalsRouter);
router.use('/ledgers', ledgersRouter);
router.use('/period-locks', locksRouter);
router.use('/categories', categoriesRouter);
router.use('/', orgsRouter);

module.exports = router;
