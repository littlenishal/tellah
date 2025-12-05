import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ outputId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { outputId: outputIdString } = await params;
    const outputId = parseId(outputIdString);
    const body = await request.json();
    const { stars, feedback_text, tags } = body;

    // Validate required fields
    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'Valid star rating (1-5) is required' },
        { status: 400 }
      );
    }

    // Check if output exists
    const { data: output, error: outputError } = await supabaseAdmin
      .from('outputs')
      .select('id')
      .eq('id', outputId)
      .single();

    if (outputError || !output) {
      return NextResponse.json(
        { error: 'Output not found' },
        { status: 404 }
      );
    }

    // Insert rating into database
    const { data, error } = await supabaseAdmin
      .from('ratings')
      .insert({
        output_id: outputId,
        stars,
        feedback_text: feedback_text || null,
        tags: tags || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { outputId: outputIdString } = await params;
    const outputId = parseId(outputIdString);

    const { data, error } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('output_id', outputId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
