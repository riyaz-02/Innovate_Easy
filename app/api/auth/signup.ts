import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    console.log("Received in API:", { email, password, name });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }, // Stores name in user_metadata
    });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Insert into profiles table
    await supabase.from("profiles").insert({ id: data.user?.id, email, name });
    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}