-- Rollback script for Church Think V1.0 P0 Stabilization Schema
DROP TABLE IF EXISTS public.church_signup_assignment_requests CASCADE;
DROP TABLE IF EXISTS public.church_user_assignments CASCADE;
DROP TABLE IF EXISTS public.church_positions CASCADE;
DROP TABLE IF EXISTS public.church_profiles CASCADE;
DROP TABLE IF EXISTS public.church_closing_periods CASCADE;
DROP TABLE IF EXISTS public.church_settlements CASCADE;
DROP TABLE IF EXISTS public.church_ledgers CASCADE;
DROP TABLE IF EXISTS public.church_approval_actions CASCADE;
DROP TABLE IF EXISTS public.church_approval_lines CASCADE;
DROP TABLE IF EXISTS public.church_receipts CASCADE;
DROP TABLE IF EXISTS public.church_voucher_items CASCADE;
DROP TABLE IF EXISTS public.church_vouchers CASCADE;
DROP TABLE IF EXISTS public.church_account_categories CASCADE;
DROP TABLE IF EXISTS public.church_user_metadata CASCADE;
DROP TABLE IF EXISTS public.church_departments CASCADE;
