-- Enable realtime for test_sessions and monitoring_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;

-- Disable RLS on these tables for development
ALTER TABLE public.test_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;