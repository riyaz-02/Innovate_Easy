import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const { data, error } = await supabase.storage
    .from('research-papers')
    .upload(`${user.id}/${file.name}`, file);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ url: data.path });
}