-- Remove foreign key constraint on tests.created_by for development
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_created_by_fkey;