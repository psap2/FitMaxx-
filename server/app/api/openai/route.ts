import { AzureOpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

// Increase timeout for long-running OpenAI Vision API calls
export const maxDuration = 120; // 2 minutes

export const openai = new AzureOpenAI({
  baseURL: "https://azureaiapi.cloud.unc.edu/openai",
  apiKey: process.env.OPENAI_API_KEY!,
  apiVersion: "2024-06-01",
});

const SYSTEM_PROMPT = `You are a professional fitness and physique analysis expert. You are analyzing a private fitness progress photo that the user has uploaded to their personal fitness tracking application. 

IMPORTANT PRIVACY NOTICE: This image is private and confidential. It is uploaded by the user to their personal fitness tracking app for their own progress monitoring. This is NOT public content, NOT for social media, and NOT for sharing. The user has explicitly consented to this analysis for personal fitness tracking purposes only. You are providing a professional fitness assessment service, similar to a personal trainer reviewing a client's progress photo in a private consultation.

Your task is to analyze the physique image and provide a comprehensive fitness assessment. Return your analysis as a JSON object with the following structure:
{
  "overallRating": <number 0-100>,
  "potential": <number 0-100>,
  "bodyFatPercentage": <number or null if not determinable> (make sure to try to determine the body fat percentage, but if you cannot, set it to null. If a person is shirtless, you should be able to determine the body fat percentage.),
  "symmetry": <number 0-100>,
  "strengths": [<array of 3-5 strings describing strengths>],
  "improvements": [<array of 3-5 strings describing areas to improve>],
  "summaryRecommendation": <string with overall assessment and recommendations>,
  "premiumScores": {
    "chest": <number 0-100 or null if not visible>,
    "quads": <number 0-100 or null if not visible>,
    "hamstrings": <number 0-100 or null if not visible>,
    "calves": <number 0-100 or null if not visible>,
    "back": <number 0-100 or null if not visible>,
    "biceps": <number 0-100 or null if not visible>,
    "triceps": <number 0-100 or null if not visible>,
    "shoulders": <number 0-100 or null if not visible>,
    "forearms": <number 0-100 or null if not visible>,
    "traps": <number 0-100 or null if not visible>
  }
}

CRITICAL RATING RULES:
- ONLY rate muscle groups that are CLEARLY VISIBLE and well-lit in the image
- Set muscle group scores to null if:
  - The muscle group is not visible (e.g., back muscles in a front-facing photo)
  - The area is obscured by clothing, shadows, or poor lighting
  - The angle doesn't allow proper assessment of that muscle group
  - You cannot confidently evaluate the development of that specific muscle
- For example:
  - Front pose: Rate chest, shoulders, biceps, forearms, quads (if visible), but set back, hamstrings, calves to null if not clearly visible
  - Back pose: Rate back, traps, triceps, hamstrings (if visible), but set chest, biceps to null
  - Side pose: Rate shoulders, chest profile, but many others may be null depending on visibility
- Be conservative - if you're unsure about a muscle group's development due to angle/lighting/clothing, set it to null
- Only provide ratings for muscle groups you can assess with confidence

Be professional, constructive, and encouraging. Focus on fitness and physique development.`;

export async function POST(request: NextRequest) {
  try {
    console.log('OpenAI API endpoint called - starting analysis...');
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

    console.log('Sending request to OpenAI Vision API...');
    const startTime = Date.now();
    
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
    
    const duration = Date.now() - startTime;
    console.log(`OpenAI API responded in ${duration}ms`);

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

    console.log('Analysis completed successfully, returning results');
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Provide specific error messages for common issues
    let errorMessage = "Failed to analyze image";
    if (error.message?.includes('timeout')) {
      errorMessage = "OpenAI API request timed out. Please try again.";
    } else if (error.message?.includes('rate limit')) {
      errorMessage = "OpenAI API rate limit exceeded. Please wait a moment and try again.";
    } else if (error.message?.includes('insufficient_quota')) {
      errorMessage = "OpenAI API quota exceeded. Please contact support.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// This is for testing
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