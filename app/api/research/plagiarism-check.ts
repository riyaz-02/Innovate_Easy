import { NextRequest, NextResponse } from 'next/server';
import openai from '../../../lib/openai';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  const prompt = `
    Check if the following text appears to be original or potentially plagiarized:
    "${text}"
    Provide a brief explanation.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const result = response.choices[0].message.content;
  return NextResponse.json({ result });
}