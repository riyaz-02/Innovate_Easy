import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, format } = await req.json();
    if (!text || !format) {
      return NextResponse.json({ error: "Text and format are required" }, { status: 400 });
    }

    const prompt = `Convert the following research paper content into ${format} format:\n\n${text}`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048, // Safer limit
    });

    return NextResponse.json({ content: response.choices[0]?.message?.content || "No content generated" }, { status: 200 });
  } catch (error) {
    console.error("Error in convertFormat:", error);
    return NextResponse.json({ error: "Failed to convert content" }, { status: 500 });
  }
}
