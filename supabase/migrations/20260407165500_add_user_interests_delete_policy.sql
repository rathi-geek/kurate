-- Allow users to delete their own interests (needed for the delete-then-reinsert flow in saveUserInterests)
CREATE POLICY "Users can DELETE own interests"
  ON public.user_interests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
