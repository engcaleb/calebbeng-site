-- Add show_doctor flag to recommendation pages.
-- DEFAULT true preserves existing behavior for all current rows.
ALTER TABLE rw_recommendation_pages
  ADD COLUMN show_doctor boolean NOT NULL DEFAULT true;
