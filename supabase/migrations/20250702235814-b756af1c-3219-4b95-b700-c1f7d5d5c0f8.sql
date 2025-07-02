-- Add service role policies for anime and manga management
CREATE POLICY "Service role can manage anime data" ON public.anime FOR ALL USING (true);
CREATE POLICY "Service role can manage manga data" ON public.manga FOR ALL USING (true);
CREATE POLICY "Service role can manage sync status" ON public.content_sync_status FOR ALL USING (true);