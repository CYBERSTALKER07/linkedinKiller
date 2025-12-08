-- Add location fields to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS country text,
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS street_address text,
    ADD COLUMN IF NOT EXISTS department text;
-- Add location fields to employer_events table
-- First, ensure the table exists (it might be missing based on previous logs)
CREATE TABLE IF NOT EXISTS employer_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    event_date timestamptz NOT NULL,
    event_end_date timestamptz,
    location text,
    virtual_link text,
    event_type text NOT NULL,
    banner_image_url text,
    capacity integer,
    attendees_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    status text DEFAULT 'upcoming',
    tags text [],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Apply columns if table already existed but missing these
ALTER TABLE employer_events
ADD COLUMN IF NOT EXISTS country text,
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS street_address text;