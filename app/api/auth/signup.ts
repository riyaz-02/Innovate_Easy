import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';


export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("Received in API:", body);
  const { email, password, name } = await req.json();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Insert into profiles table
  await supabase.from('profiles').insert({ id: data.user?.id, email, name });
  return NextResponse.json({ user: data.user });
}