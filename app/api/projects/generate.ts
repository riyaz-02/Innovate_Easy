import { NextRequest, NextResponse } from 'next/server';
import openai from '../../../lib/openai';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectType, experienceLevel, estimatedDays, language, techStack, deviceType } = await req.json();
  const prompt = `
    Generate a project idea for a ${projectType} project suitable for ${experienceLevel} level,
    estimated to take ${estimatedDays} days, using ${language} and ${techStack.join(', ')} for ${deviceType} devices.
    Provide a brief description.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const idea = response.choices[0].message.content;
  return NextResponse.json({ idea });
}