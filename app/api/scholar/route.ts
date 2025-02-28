import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "research papers";
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_scholar",
        q: query,
        api_key: apiKey,
        num: 10,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching Scholar papers:", error);
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}