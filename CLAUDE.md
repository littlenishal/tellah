# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Tellah

Tellah is a behavioral design tool for AI products - "Figma for AI Evals." It enables Product Managers to define what "good" AI behavior looks like through examples and ratings, rather than code.

### The Problem We Solve

In traditional product development, designers create mockups in Figma that serve as the spec. For AI products, there's no equivalent artifact that defines acceptable behavior for probabilistic outputs. PMs write vague requirements ("make it helpful"), engineers write prompts, and no one can agree on what "right" looks like.

### Our Solution

Tellah creates a shared artifact for AI behavior quality:
- PMs provide test scenarios and rate AI outputs
- The system extracts behavioral patterns from PM ratings (length, tone, structure, content)
- Both PM and engineer see real-time success metrics as prompts evolve
- Export golden examples and criteria as a test suite for CI/CD

Think of it as: PM taste → Behavioral spec → Test suite

### Tech Stack

- Frontend: Next.js 14 with React, TypeScript, Tailwind CSS
- Backend: Next.js API routes
- Database: Supabase (PostgreSQL + Auth + Storage + Real-time)
- Type Safety: Supabase CLI auto-generated types
- AI: OpenAI API for generation and pattern extraction
- Deployment: Vercel

## Getting Started

See [docs/product-spec.md](docs/product-spec.md) for detailed MVP requirements.

## Architecture

Full architecture documentation to be added as we build. Initial focus: simple web app with scenario management, AI output generation, rating interface, and pattern extraction.

## Database Query Patterns (Supabase)

**IMPORTANT**: Supabase has limitations when querying nested relations. Follow these patterns:

### ❌ DON'T: Filter on nested relation fields directly
```typescript
// This DOES NOT WORK - cannot filter on nested relations
const { data } = await supabase
  .from('outputs')
  .select('*, ratings(*)')
  .eq('scenario.project_id', projectId)  // ❌ Fails silently
  .gte('ratings.stars', 4);              // ❌ Fails silently
```

### ✅ DO: Fetch parent IDs first, then filter
```typescript
// Step 1: Get parent IDs
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

// Step 2: Filter using parent IDs
const { data: outputs } = await supabase
  .from('outputs')
  .select('*, ratings(*)')
  .in('scenario_id', scenarioIds);

// Step 3: Filter in application code
const filtered = outputs.filter(o =>
  o.ratings?.length > 0 && o.ratings[0].stars >= 4
);
```

### Common Patterns

**Pattern 1: Get data for a project through multiple relations**
```typescript
// projects → scenarios → outputs → ratings
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

const { data: outputs } = await supabase
  .from('outputs')
  .select('*, ratings(*), scenario:scenarios(id, input_text)')
  .in('scenario_id', scenarioIds);
```

**Pattern 2: Count records with filters**
```typescript
// Get count of rated outputs for a project
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

const { count } = await supabase
  .from('outputs')
  .select('*', { count: 'exact', head: true })
  .in('scenario_id', scenarioIds)
  .not('ratings', 'is', null);
```

**Why this matters**: Supabase PostgREST doesn't support filtering on nested embedded resources. Always fetch parent IDs first, then use `.in()` to filter children.
