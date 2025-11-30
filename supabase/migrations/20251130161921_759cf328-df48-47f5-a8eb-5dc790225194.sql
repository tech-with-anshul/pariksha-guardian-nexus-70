-- Temporarily allow public access to tests table for development
CREATE POLICY "Allow public insert on tests" 
ON public.tests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on tests" 
ON public.tests 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on tests" 
ON public.tests 
FOR DELETE 
USING (true);

-- Temporarily allow public access to questions table for development
CREATE POLICY "Allow public insert on questions" 
ON public.questions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on questions" 
ON public.questions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on questions" 
ON public.questions 
FOR DELETE 
USING (true);