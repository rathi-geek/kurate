import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Messages array required." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1]?.content || "";

    const mockResponses: Record<string, string> = {
      default: "Here are some recommendations based on your query. In the full implementation, this would connect to an AI provider like OpenAI or Anthropic.",
      ai: "Artificial Intelligence is evolving rapidly! Here are some top resources on AI trends, research papers, and practical applications.",
      startups: "The startup ecosystem is always dynamic! Here are some insights on building startups, fundraising, and product development.",
      product: "Product management is both art and science. Here are some excellent resources on product strategy and user research.",
    };

    const lowerQuery = lastMessage.toLowerCase();
    let response = mockResponses.default;

    for (const [key, value] of Object.entries(mockResponses)) {
      if (lowerQuery.includes(key)) {
        response = value;
        break;
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const char of response) {
          controller.enqueue(encoder.encode(char));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "AI_ERROR", message: "Couldn't generate recommendations right now." },
      { status: 500 }
    );
  }
}
