-- Add rated_output_count to extractions table
-- This stores a snapshot of how many rated outputs existed at extraction time
-- Needed for accurate confidence calculation when viewing historical extractions

ALTER TABLE extractions
ADD COLUMN rated_output_count INTEGER NOT NULL DEFAULT 0;

-- Backfill existing extractions by counting rated outputs at the time of extraction
-- This is an approximation - we count all rated outputs that existed before the extraction was created
UPDATE extractions e
SET rated_output_count = (
  SELECT COUNT(DISTINCT r.output_id)
  FROM ratings r
  INNER JOIN outputs o ON r.output_id = o.id
  INNER JOIN scenarios s ON o.scenario_id = s.id
  WHERE s.project_id = e.project_id
    AND r.created_at <= e.created_at
);

COMMENT ON COLUMN extractions.rated_output_count IS 'Snapshot of how many unique outputs had ratings at the time of extraction';
