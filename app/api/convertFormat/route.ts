import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use a server-side environment variable
});

export async function POST(req: NextRequest) {
  try {
    const { text, format } = await req.json();

    if (!text || !format) {
      return NextResponse.json({ error: "Text and format are required" }, { status: 400 });
    }

    const prompt = `Convert the following research paper content into ${format} format:\n\n${text}`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20000, // Adjust based on expected output length
    });

    const formattedContent = response.choices[0].message.content || "No content generated";
    return NextResponse.json({ content: formattedContent }, { status: 200 });
  } catch (error) {
    console.error("Error in convertFormat:", error);
    return NextResponse.json({ error: "Failed to convert content" }, { status: 500 });
  }
}