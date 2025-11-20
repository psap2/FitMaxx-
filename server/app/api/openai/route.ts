import { AzureOpenAI } from "openai";
import { NextResponse } from "next/server";

export const openai = new AzureOpenAI({
  baseURL: "https://azureaiapi.cloud.unc.edu/openai",
  apiKey: process.env.OPENAI_API_KEY!,
  apiVersion: "2024-06-01",
});

export async function GET() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello, how are you?" }],
    });

    const message = response.choices[0]?.message?.content || 'No response';
    return NextResponse.json({ response: message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get response from OpenAI" }, { status: 500 });
  }
}