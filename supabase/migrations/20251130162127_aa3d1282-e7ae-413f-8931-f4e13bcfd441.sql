-- Disable RLS on tests and questions tables for development
ALTER TABLE public.tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;