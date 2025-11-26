import { AzureOpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { supabaseAdmin } from "../../../lib/db/supabase";
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for broadcasting (using publishable key)
const supabaseRealtime = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Increase timeout for long-running OpenAI Vision API calls
export const maxDuration = 120; // 2 minutes

export const openai = new AzureOpenAI({
  baseURL: "https://azureaiapi.cloud.unc.edu/openai",
  apiKey: process.env.OPENAI_API_KEY!,
  apiVersion: "2024-06-01",
});

const SYSTEM_PROMPT = `You are a certified physique assessment specialist and body-composition analyst. The user has uploaded a private progress photo for *their own personal fitness tracking*. This image is confidential, not public, not for social media, and not used to identify the user. The user has explicitly consented to detailed physique evaluation for fitness-tracking purposes.

Your job is to analyze the physique in the image and output the most complete, detailed, and accurate scoring possible. You should maximize ratings whenever visibility allows.

Return ONLY a JSON object in the following format:

{
  "overallRating": <0-100>,
  "potential": <0-100>,
  "bodyFatPercentage": <number or null>,
  "symmetry": <0-100>,
  "strengths": [3-5 strings],
  "improvements": [3-5 strings],
  "summaryRecommendation": "<string>",
  "premiumScores": {
    "chest": <0-100 or null>,
    "quads": <0-100 or null>,
    "hamstrings": <0-100 or null>,
    "calves": <0-100 or null>,
    "back": <0-100 or null>,
    "biceps": <0-100 or null>,
    "triceps": <0-100 or null>,
    "shoulders": <0-100 or null>,
    "forearms": <0-100 or null>,
    "traps": <0-100 or null>
  }
}

MANDATORY ANALYSIS RULES:

NOTES FOR PREMIUM USERS:
1. **Rate as many visible muscle groups as possible.**  
   Always provide a numeric score *unless* the muscle is completely blocked, turned away, or fully obscured.
   If you see a muscle group, make sure to rate it.
2. **Set a muscle score to null ONLY IF:**
   - It is physically not visible due to pose (e.g., back in a front photo)
   - It is fully covered (e.g., pants covering quads)
   - It is too blurry or cropped out to evaluate

3. **Maximize coverage:**  
   If a muscle is even partially visible (e.g., chest from side-angle, partial quad visibility, shoulders from any angle), then you **must provide a score**.

4. **Body fat percentage:**  
   Estimate it whenever possible—if the torso is visible, you should ALWAYS attempt a BF% approximation.
   Use the body fat reference chart provided to accurately assess body fat percentages:
   - **10%**: Extremely lean and muscular with highly defined "six-pack" abs, prominent veins, strong muscle separation in chest/shoulders/arms, very athletic and chiseled appearance.
   - **12%**: Lean and muscular with well-defined abdominal muscles (slightly less extreme than 8%), very good muscle separation, athletic and chiseled physique.
   - **17%**: Muscular with visible but less sharply defined abs, thin layer of fat making definition softer, overall athletic and strong appearance.
   - **23%**: Relatively flat stomach but no distinct abdominal definition, noticeable layer of body fat obscuring muscle detail, less muscular and more "average" appearance.
   - **30%**: Softer, more rounded midsection, no visible abdominal muscles, clear layer of fat around waist, chest and shoulders less defined.
   - **35%**: More pronounced rounded belly, thicker waistline, significantly higher body fat, muscle definition largely absent.
   - **40%**: Large protruding belly, significant fat accumulation across entire torso including chest, muscle definition almost entirely obscured.
   - **50%**: Very large rounded protruding belly, substantial fat accumulation on chest (enlarged appearance) and entire upper body, very high body fat percentage.

5. **Tone:**  
   Be professional, constructive, specific, and encouraging. Focus only on physique development and fitness.

6. **No disclaimers** beyond what is necessary in the JSON. No commentary outside the JSON.`;

// Helper function to generate hash from image data
async function generateImageHash(imageBase64: string | null, imageUrl: string | null): Promise<string> {
  let imageBuffer: Buffer;
  
  if (imageBase64) {
    // Remove data URL prefix if present
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else if (imageUrl) {
    // Fetch image from URL and convert to buffer
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    throw new Error('No image data provided');
  }

  // Generate SHA-256 hash
  return createHash('sha256').update(imageBuffer).digest('hex');
}

// Helper function to convert Post to PhysiqueAnalysis format
function postToAnalysis(post: any): any {
  return {
    overallRating: post.overall_rating !== null ? post.overall_rating / 10 : null,
    potential: post.potential !== null ? post.potential / 10 : null,
    bodyFatPercentage: post.body_fat !== null ? post.body_fat / 10 : null,
    symmetry: post.symmetry !== null ? post.symmetry / 10 : null,
    strengths: [], // Posts don't store strengths/improvements, but we can return empty arrays
    improvements: [],
    summaryRecommendation: post.summaryrecc || '',
    premiumScores: {
      chest: post.chest !== null ? post.chest / 10 : null,
      quads: post.quads !== null ? post.quads / 10 : null,
      hamstrings: post.hamstrings !== null ? post.hamstrings / 10 : null,
      calves: post.calves !== null ? post.calves / 10 : null,
      back: post.back !== null ? post.back / 10 : null,
      biceps: post.biceps !== null ? post.biceps / 10 : null,
      triceps: post.triceps !== null ? post.triceps / 10 : null,
      shoulders: post.shoulders !== null ? post.shoulders / 10 : null,
      forearms: post.forearms !== null ? post.forearms / 10 : null,
      traps: post.traps !== null ? post.traps / 10 : null,
    },
  };
}

export async function POST(request: NextRequest) {
  let analysisId: string | undefined;
  let userId: string | undefined;
  
  try {
    const body = await request.json();
    const { imageBase64, imageUrl, analysisId: reqAnalysisId, userId: reqUserId } = body;
    analysisId = reqAnalysisId;
    userId = reqUserId;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: "Image data is required. Provide either imageBase64 or imageUrl." },
        { status: 400 }
      );
    }

    // Generate hash from image
    const imageHash = await generateImageHash(imageBase64 || null, imageUrl || null);

    // Check if a post with this hash already exists (use admin client to bypass RLS)
    let existingPost = null;
    if (supabaseAdmin) {
      const { data: existingPosts, error: queryError } = await supabaseAdmin
        .from('posts')
        .select('*')
        .eq('hash', imageHash)
        .not('hash', 'is', null) // Only check posts that have a hash
        .order('created_at', { ascending: false })
        .limit(1);

      if (!queryError && existingPosts && existingPosts.length > 0) {
        existingPost = existingPosts[0];
      }
    }

    // Note: We'll still call GPT even if we have stored scores, to get fresh strengths/improvements

    // Read body fat comparison image and convert to base64
    // The assets folder is at the root level, one directory up from server
    let bodyFatImageBase64: string | null = null;
    try {
      const imagePath = join(process.cwd(), '..', 'assets', 'bodyfat.png');
      const imageBuffer = readFileSync(imagePath);
      bodyFatImageBase64 = imageBuffer.toString('base64');
    } catch (error) {
      // Continue without image if it fails to load
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

    const startTime = Date.now();
    
    // Build messages array with body fat reference image
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
    }> = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];

    // Add body fat reference image as a user message if available
    if (bodyFatImageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Here is the body fat percentage reference chart for males. Use this visual guide to accurately assess body fat percentages. For these pictures, premium rated scores should be chest, shoulders, triceps, biceps, triceps, and forearms.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${bodyFatImageBase64}`,
            },
          },
        ],
      });
    }

    // Add the actual analysis request with user's photo
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: "Please analyze this fitness progress photo and provide a comprehensive physique assessment in the JSON format specified.",
        },
        imageContent,
      ],
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any, // Type assertion needed due to Azure OpenAI SDK type definitions
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      // Broadcast error if analysisId provided
      if (analysisId && userId) {
        await supabaseRealtime.channel(`analysis:${userId}`).send({
          type: 'broadcast',
          event: 'analysis-complete',
          payload: {
            analysisId,
            status: 'error',
            error: 'No response from OpenAI',
          },
        });
      }
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
      // Broadcast error if analysisId provided
      if (analysisId && userId) {
        await supabaseRealtime.channel(`analysis:${userId}`).send({
          type: 'broadcast',
          event: 'analysis-complete',
          payload: {
            analysisId,
            status: 'error',
            error: 'Invalid response format from OpenAI',
          },
        });
      }
      return NextResponse.json(
        { error: "Invalid response format from OpenAI" },
        { status: 500 }
      );
    }

    // If we have stored scores, use them instead of GPT scores (but keep GPT strengths/improvements)
    if (existingPost) {
      const storedAnalysis = postToAnalysis(existingPost);
      const finalAnalysis = {
        ...storedAnalysis, // Use stored scores (ratings, premium scores, etc.)
        strengths: analysis.strengths || [], // Use fresh GPT strengths
        improvements: analysis.improvements || [], // Use fresh GPT improvements
        _hash: imageHash, // Include hash in response so client can store it
      };

      // Broadcast completion if analysisId provided
      if (analysisId && userId) {
        await supabaseRealtime.channel(`analysis:${userId}`).send({
          type: 'broadcast',
          event: 'analysis-complete',
          payload: {
            analysisId,
            status: 'completed',
            analysis: finalAnalysis,
          },
        });
      }

      return NextResponse.json(finalAnalysis);
    }
    
    // Return analysis with hash so client can store it
    const finalAnalysis = {
      ...analysis,
      _hash: imageHash, // Include hash in response so client can store it
    };

    // Broadcast completion if analysisId provided
    if (analysisId && userId) {
      await supabaseRealtime.channel(`analysis:${userId}`).send({
        type: 'broadcast',
        event: 'analysis-complete',
        payload: {
          analysisId,
          status: 'completed',
          analysis: finalAnalysis,
        },
      });
    }

    return NextResponse.json(finalAnalysis);
  } catch (error: any) {
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

    // Broadcast error if analysisId provided
    if (analysisId && userId) {
      try {
        await supabaseRealtime.channel(`analysis:${userId}`).send({
          type: 'broadcast',
          event: 'analysis-complete',
          payload: {
            analysisId,
            status: 'error',
            error: errorMessage,
          },
        });
      } catch (broadcastError) {
        console.error('Failed to broadcast error:', broadcastError);
      }
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
    return NextResponse.json({ error: "Failed to get response from OpenAI" }, { status: 500 });
  }
}