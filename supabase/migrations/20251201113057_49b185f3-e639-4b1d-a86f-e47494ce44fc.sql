-- Remove foreign key constraints on test_sessions for development testing
ALTER TABLE public.test_sessions DROP CONSTRAINT IF EXISTS test_sessions_student_id_fkey;
ALTER TABLE public.test_sessions DROP CONSTRAINT IF EXISTS test_sessions_test_id_fkey;