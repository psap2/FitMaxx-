import { AzureOpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import { createUserClient } from "../../../../lib/db/supabase";
import { Goal, Post, Comment, User } from "../../../../lib/db/schema";

export const maxDuration = 60; // 1 minute

const openai = new AzureOpenAI({
  baseURL: "https://azureaiapi.cloud.unc.edu/openai",
  apiKey: process.env.OPENAI_API_KEY!,
  apiVersion: "2024-06-01",
});

function buildSystemPrompt(userData: { user: User | null; goals: Goal[]; posts: Post[]; comments: Comment[]; conversationHistory: Array<{ user: string; assistant: string }> }): string {
  let prompt = `You are a personal AI fitness coach helping a user with their fitness journey. You have access to the following information about the user:

  IMPORTANT PRIVACY NOTICE: This image is private and confidential. It is uploaded by the user to their personal fitness tracking app for their own progress monitoring. This is NOT public content, NOT for social media, and NOT for sharing. The user has explicitly consented to this analysis for personal fitness tracking purposes only. You are providing a professional fitness assessment service, similar to a personal trainer reviewing a client's progress photo in a private consultation.

  Make sure you give concise answers and recommend what the user should do to improve their fitness. Recommend goals to set in the goals section of the Extras tab. Recommend to consistently upload everyday progress pictures and add comments to their posts.

  Make sure when recommending to utilize the ratings given to understand the history (ex. if a user's scores have been going down consistently to recognize this)

  REMEMBER YOU ARE THE AI THAT WAS USED TO RATE THE USER'S PHOTO, YOU HAVE ACCESS TO THE USER'S PROGRESS POSTS AND COMMENTS, USE THIS TO YOUR ADVANTAGE.

USER PROFILE:

`;

  if (userData.user) {
    const user = userData.user;
    prompt += `Gender: ${user.gender}\n`;
    if (user.height) {
      const feet = Math.floor(user.height / 12);
      const inches = user.height % 12;
      prompt += `Height: ${feet}'${inches}" (${user.height} inches)\n`;
    }
    if (user.weight) {
      prompt += `Weight: ${user.weight} lbs\n`;
    }
  } else {
    prompt += 'User profile information not available.\n';
  }

  prompt += '\nGOALS:\n';
  if (userData.goals.length === 0) {
    prompt += 'No goals set yet.\n';
  } else {
    userData.goals.forEach((goal, index) => {
      prompt += `${index + 1}. ${goal.goal}`;
      if (goal.description) {
        prompt += ` - ${goal.description}`;
      }
      if (goal.target_date) {
        prompt += ` (Target: ${new Date(goal.target_date).toLocaleDateString()})`;
      }
      prompt += '\n';
    });
  }

  prompt += '\nPROGRESS POSTS:\n';
  if (userData.posts.length === 0) {
    prompt += 'No progress posts yet.\n';
  } else {
    userData.posts.forEach((post, index) => {
      prompt += `Post ${index + 1} (${new Date(post.created_at).toLocaleDateString()}):\n`;
      if (post.overall_rating !== null) {
        prompt += `  Overall Rating: ${post.overall_rating / 10}/10\n`;
      }
      if (post.potential !== null) {
        prompt += `  Potential: ${post.potential / 10}/10\n`;
      }
      if (post.symmetry !== null) {
        prompt += `  Symmetry: ${post.symmetry / 10}/10\n`;
      }
      if (post.body_fat !== null) {
        prompt += `  Body Fat: ${post.body_fat / 10}%\n`;
      }
      if (post.summaryrecc) {
        prompt += `  Summary: ${post.summaryrecc}\n`;
      }
      
      // Add comments for this post
      const postComments = userData.comments.filter(c => c.post === post.id);
      if (postComments.length > 0) {
        prompt += `  Notes:\n`;
        postComments.forEach(comment => {
          prompt += `    - ${comment.comment}\n`;
        });
      }
      prompt += '\n';
    });
  }

  prompt += `\nRECENT CONVERSATION HISTORY:\n`;
  if (userData.conversationHistory.length === 0) {
    prompt += 'No previous conversation.\n';
  } else {
    userData.conversationHistory.forEach((pair, index) => {
      prompt += `Exchange ${index + 1}:\n`;
      prompt += `  User: ${pair.user}\n`;
      prompt += `  Assistant: ${pair.assistant}\n\n`;
    });
  }

  prompt += `\nYour role is to provide personalized fitness advice, motivation, and guidance based on this information. Be encouraging, professional, and helpful. Use the conversation history to maintain context and continuity.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Coach chat API endpoint called');
    
    // Authentication
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Create authenticated Supabase client
    const supabase = createUserClient(auth.token);

    // Check premium status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, gender, height, weight, premium')
      .eq('id', auth.user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    if (!userData.premium) {
      return NextResponse.json(
        { error: "Premium subscription required to use AI Coach" },
        { status: 403 }
      );
    }

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user', auth.user.id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      throw postsError;
    }

    // Fetch comments for all posts
    const postIds = posts?.map(post => post.id) || [];
    let allComments: Comment[] = [];
    
    if (postIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post', postIds)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        throw commentsError;
      }

      allComments = (comments as Comment[]) || [];
    }

    // Build system prompt
    const userDataForPrompt = {
      user: (userData as User) || null,
      goals: (goals as Goal[]) || [],
      posts: (posts as Post[]) || [],
      comments: allComments,
      conversationHistory: conversationHistory || [],
    };

    const systemPrompt = buildSystemPrompt(userDataForPrompt);

    console.log('Calling OpenAI for coach chat');
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1000,
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

    return NextResponse.json({ response: content });
  } catch (error: any) {
    console.error("Coach chat API error:", error);
    
    let errorMessage = "Failed to get response from coach";
    if (error.message?.includes('timeout')) {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message?.includes('rate limit')) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


