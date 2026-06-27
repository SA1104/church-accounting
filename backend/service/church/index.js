const express = require('express');
const router = express.Router();

const vouchersRouter = require('./vouchers');
const approvalsRouter = require('./approvals');
const ledgersRouter = require('./ledgers');
const locksRouter = require('./locks');
const categoriesRouter = require('./categories');
const orgsRouter = require('./organizations');

router.use('/vouchers', vouchersRouter);
router.use('/approvals', approvalsRouter);
router.use('/ledgers', ledgersRouter);
router.use('/period-locks', locksRouter);
router.use('/categories', categoriesRouter);
router.use('/', orgsRouter);

module.exports = router;
