-- Add extraction_id to metrics table for linking metrics to their extraction
-- This enables extraction history tracking

-- Add extraction_id column to metrics table
ALTER TABLE metrics
ADD COLUMN extraction_id BIGINT REFERENCES extractions(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX idx_metrics_extraction_id ON metrics(extraction_id);

-- Backfill existing metrics with their corresponding extraction
-- Match metrics to extractions based on project_id and similar timestamps (within 60 seconds)
UPDATE metrics m
SET extraction_id = e.id
FROM extractions e
WHERE m.project_id = e.project_id
  AND m.extraction_id IS NULL
  AND ABS(EXTRACT(EPOCH FROM (m.snapshot_time - e.created_at))) < 60;

-- Add comment for documentation
COMMENT ON COLUMN metrics.extraction_id IS 'Links metric snapshot to its extraction for history tracking. Nullable for backward compatibility.';
