import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    // Fetch project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch all outputs with ratings and scenarios
    const { data: outputs, error: outputsError } = await supabaseAdmin
      .from('outputs')
      .select(`
        *,
        ratings (*),
        scenario:scenarios (
          id,
          input_text
        )
      `)
      .eq('scenario.project_id', projectId)
      .not('ratings', 'is', null);

    if (outputsError) {
      console.error('Error fetching outputs:', outputsError);
      return NextResponse.json(
        { error: 'Failed to fetch outputs' },
        { status: 500 }
      );
    }

    // Filter to only outputs that have ratings
    const ratedOutputs = outputs.filter((output: any) =>
      output.ratings && output.ratings.length > 0
    );

    if (ratedOutputs.length === 0) {
      return NextResponse.json(
        { error: 'No rated outputs found. Please rate at least a few outputs before analyzing patterns.' },
        { status: 400 }
      );
    }

    // Prepare data for AI analysis
    const analysisData = ratedOutputs.map((output: any) => {
      const rating = output.ratings[0];
      return {
        input: output.scenario.input_text,
        output: output.output_text,
        stars: rating.stars,
        feedback: rating.feedback_text,
        tags: rating.tags,
      };
    });

    // Call OpenAI to analyze patterns
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing AI output quality patterns. You will be given a set of AI outputs with star ratings (1-5), feedback, and tags from a product manager.

Your task is to identify patterns that distinguish good outputs (4-5 stars) from poor outputs (1-3 stars). Focus on:
1. Length patterns (word count, detail level)
2. Tone patterns (formal/casual, empathetic/clinical)
3. Structure patterns (format, organization, use of lists/paragraphs)
4. Content patterns (specificity, examples, actionability)

Provide actionable criteria that can be used to evaluate future outputs.

Return your analysis as a JSON object with this structure:
{
  "summary": "Brief overview of quality patterns identified",
  "criteria": [
    {
      "dimension": "Length/Tone/Structure/Content",
      "pattern": "Description of the pattern",
      "good_example": "Characteristic of high-rated outputs",
      "bad_example": "Characteristic of low-rated outputs",
      "importance": "high/medium/low"
    }
  ],
  "key_insights": [
    "Specific insight about what makes outputs good/bad"
  ],
  "recommendations": [
    "Actionable recommendation for improving outputs"
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze these ${ratedOutputs.length} rated outputs:\n\n${JSON.stringify(analysisData, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');

    // Calculate confidence score based on number of ratings
    const confidenceScore = Math.min(0.9, ratedOutputs.length / 20);

    // Save extraction to database
    const { data: extraction, error: extractionError } = await supabaseAdmin
      .from('extractions')
      .insert({
        project_id: projectId,
        criteria: analysisResult,
        confidence_score: confidenceScore,
      })
      .select()
      .single();

    if (extractionError) {
      console.error('Supabase error:', extractionError);
      return NextResponse.json(
        { error: 'Failed to save extraction' },
        { status: 500 }
      );
    }

    // Calculate and save metrics
    const totalOutputs = ratedOutputs.length;
    const successfulOutputs = ratedOutputs.filter((o: any) => o.ratings[0].stars >= 4).length;
    const successRate = totalOutputs > 0 ? successfulOutputs / totalOutputs : 0;

    // Calculate breakdown by criteria
    const criteriaBreakdown = analysisResult.criteria?.reduce((acc: any, criterion: any) => {
      acc[criterion.dimension] = criterion.importance;
      return acc;
    }, {});

    const { data: metric, error: metricError } = await supabaseAdmin
      .from('metrics')
      .insert({
        project_id: projectId,
        success_rate: successRate,
        criteria_breakdown: criteriaBreakdown || {},
      })
      .select()
      .single();

    if (metricError) {
      console.error('Metric error:', metricError);
    }

    return NextResponse.json({
      success: true,
      extraction,
      metric,
      analyzed_outputs: totalOutputs,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
