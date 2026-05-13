import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { deadlines } = await req.json();

  if (!deadlines || deadlines.length === 0) {
    return NextResponse.json({ error: "No deadlines provided" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a study schedule coach. Today is ${today}.

Given the assignments and deadlines below, create a practical week-by-week study plan.
For each week, list what the student should work on and roughly how many hours to spend.
Be concise and realistic. Format it clearly with week headers and bullet points.

Assignments:
${JSON.stringify(deadlines, null, 2)}`,
      },
    ],
  });

  const schedule =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ schedule });
}
