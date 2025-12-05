-- Add system_prompt_snapshot to extractions table
-- This stores the system prompt that was being evaluated at the time of extraction
-- Critical for understanding why criteria evolved between iterations

ALTER TABLE extractions
ADD COLUMN system_prompt_snapshot TEXT NOT NULL DEFAULT '';

-- Remove the default now that we've added the column
ALTER TABLE extractions
ALTER COLUMN system_prompt_snapshot DROP DEFAULT;

COMMENT ON COLUMN extractions.system_prompt_snapshot IS 'Snapshot of the system prompt being evaluated at extraction time';
