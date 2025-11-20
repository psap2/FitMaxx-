import { AzureOpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

export const openai = new AzureOpenAI({
  baseURL: "https://azureaiapi.cloud.unc.edu/openai",
  apiKey: process.env.OPENAI_API_KEY!,
  apiVersion: "2024-06-01",
});

const SYSTEM_PROMPT = `You are a professional fitness and physique analysis expert. You are analyzing a private fitness progress photo that the user has uploaded to their personal fitness tracking application. 

IMPORTANT PRIVACY NOTICE: This image is private and confidential. It is uploaded by the user to their personal fitness tracking app for their own progress monitoring. This is NOT public content, NOT for social media, and NOT for sharing. The user has explicitly consented to this analysis for personal fitness tracking purposes only. You are providing a professional fitness assessment service, similar to a personal trainer reviewing a client's progress photo in a private consultation.

Your task is to analyze the physique image and provide a comprehensive fitness assessment. Return your analysis as a JSON object with the following structure:
{
  "overallRating": <number 0-10>,
  "potential": <number 0-10>,
  "bodyFatPercentage": <number>,
  "symmetry": <number 0-10>,
  "strengths": [<array of 3-5 strings describing strengths>],
  "improvements": [<array of 3-5 strings describing areas to improve>],
  "summaryRecommendation": <string with overall assessment and recommendations>,
  "premiumScores": {
    "chest": <number 0-10>,
    "quads": <number 0-10>,
    "hamstrings": <number 0-10>,
    "calves": <number 0-10>,
    "back": <number 0-10>,
    "biceps": <number 0-10>,
    "triceps": <number 0-10>,
    "shoulders": <number 0-10>,
    "forearms": <number 0-10>,
    "traps": <number 0-10>
  }
}

Be professional, constructive, and encouraging. Focus on fitness and physique development.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, imageUrl } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: "Image data is required. Provide either imageBase64 or imageUrl." },
        { status: 400 }
      );
    }

    // Prepare image content for vision API
    const imageContent: any = imageBase64
      ? {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        }
      : {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this fitness progress photo and provide a comprehensive physique assessment in the JSON format specified.",
            },
            imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return NextResponse.json(
        { error: "Invalid response format from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze image" },
      { status: 500 }
    );
  }
}

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