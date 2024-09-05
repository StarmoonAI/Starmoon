ALTER TABLE public.toys ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts for anyone with the anon key
CREATE POLICY "Allow inserts for anyone with anon key" 
ON public.toys
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);