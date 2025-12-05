import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    // Fetch all extractions with their metrics
    const { data: extractions, error } = await supabaseAdmin
      .from('extractions')
      .select(`
        id,
        created_at,
        confidence_score,
        rated_output_count,
        metrics (
          success_rate,
          snapshot_time
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch extractions' },
        { status: 500 }
      );
    }

    // Get scenario count for the project (constant across extractions)
    const { data: scenarios } = await supabaseAdmin
      .from('scenarios')
      .select('id')
      .eq('project_id', projectId);

    const scenarioCount = scenarios?.length || 0;

    // Format response
    const formattedExtractions = extractions?.map(extraction => ({
      id: extraction.id,
      created_at: extraction.created_at,
      confidence_score: extraction.confidence_score,
      success_rate: extraction.metrics?.[0]?.success_rate || 0,
      scenario_count: scenarioCount,
    })) || [];

    return NextResponse.json({ data: formattedExtractions });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
