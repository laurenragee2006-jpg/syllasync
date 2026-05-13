import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// NextRequest = the incoming request from the browser
// NextResponse = what we send back

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // reads from .env.local — never exposed to the browser
});

// Next.js looks for an exported function named after the HTTP method
// POST means this runs when the browser sends a POST request to /api/extract
export async function POST(req: NextRequest) {
  const { syllabus } = await req.json(); // parse the request body

  if (!syllabus) {
    // NextResponse.json() sends JSON back to the browser
    return NextResponse.json({ error: "No syllabus provided" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0]; // gets today's date as YYYY-MM-DD

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a helpful academic assistant. Today's date is ${today}.

Extract every assignment, exam, quiz, project, and deadline from the syllabus below.
Return ONLY a JSON array — no explanation, no markdown, just raw JSON.

Each item must have these exact fields:
- "title": short name of the assignment
- "type": one of "assignment", "exam", "quiz", "project", "reading", "other"
- "due_date": ISO format date string (YYYY-MM-DD), or null if not specified
- "weight": grade percentage as a number (e.g. 20), or null if not specified
- "effort_hours": your estimate of how many hours this will take (1–20)
- "notes": any important details (one sentence max), or null

Syllabus:
${syllabus}`,
      },
    ],
  });

  // Extract the text from Claude's response
  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code blocks if Claude wrapped the JSON in them
  const cleaned = raw
    .replace(/^```json\n?/, "")
    .replace(/^```\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const deadlines = JSON.parse(cleaned);

  return NextResponse.json({ deadlines });
}
