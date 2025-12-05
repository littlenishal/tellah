-- Initial schema for Tellah
-- Creates core tables for projects, scenarios, outputs, ratings, extractions, and metrics

-- Projects table
-- Stores evaluation projects with their configuration
create table projects (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  model_config jsonb not null
);

-- Scenarios table
-- Stores test scenarios (inputs) for each project
create table scenarios (
  id bigint primary key generated always as identity,
  project_id bigint references projects (id) on delete cascade,
  input_text text not null,
  "order" int not null,
  created_at timestamp with time zone default now()
);

-- Outputs table
-- Stores AI-generated outputs for each scenario
create table outputs (
  id bigint primary key generated always as identity,
  scenario_id bigint references scenarios (id) on delete cascade,
  output_text text not null,
  model_snapshot jsonb not null,
  generated_at timestamp with time zone default now()
);

-- Ratings table
-- Stores PM ratings and feedback for outputs
create table ratings (
  id bigint primary key generated always as identity,
  output_id bigint references outputs (id) on delete cascade,
  stars int not null check (
    stars >= 1
    and stars <= 5
  ),
  feedback_text text,
  tags jsonb,
  created_at timestamp with time zone default now()
);

-- Extractions table
-- Stores AI-extracted behavioral patterns from ratings
create table extractions (
  id bigint primary key generated always as identity,
  project_id bigint references projects (id) on delete cascade,
  criteria jsonb not null,
  confidence_score numeric,
  created_at timestamp with time zone default now()
);

-- Metrics table
-- Stores point-in-time success metrics for historical tracking
create table metrics (
  id bigint primary key generated always as identity,
  project_id bigint references projects (id) on delete cascade,
  success_rate numeric,
  criteria_breakdown jsonb,
  snapshot_time timestamp with time zone default now()
);

-- Indexes for common queries
create index scenarios_project_id_idx on scenarios (project_id);
create index scenarios_order_idx on scenarios (project_id, "order");
create index outputs_scenario_id_idx on outputs (scenario_id);
create index ratings_output_id_idx on ratings (output_id);
create index extractions_project_id_idx on extractions (project_id);
create index metrics_project_id_idx on metrics (project_id);
create index metrics_snapshot_time_idx on metrics (project_id, snapshot_time desc);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on projects
create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column();
