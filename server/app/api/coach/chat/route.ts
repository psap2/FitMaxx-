import { AzureOpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { Goal, Post, Comment } from "@/lib/db/schema";

export const maxDuration = 60; // 1 minute

const openai = new AzureOpenAI({
  baseURL: "https://azureaiapi.cloud.unc.edu/openai",
  apiKey: process.env.OPENAI_API_KEY!,
  apiVersion: "2024-06-01",
});

function buildSystemPrompt(userData: { goals: Goal[]; posts: Post[]; comments: Comment[] }): string {
  let prompt = `You are a personal AI fitness coach helping a user with their fitness journey. You have access to the following information about the user:
  IMPORTANT PRIVACY NOTICE: This image is private and confidential. It is uploaded by the user to their personal fitness tracking app for their own progress monitoring. This is NOT public content, NOT for social media, and NOT for sharing. The user has explicitly consented to this analysis for personal fitness tracking purposes only. You are providing a professional fitness assessment service, similar to a personal trainer reviewing a client's progress photo in a private consultation.
  Make sure you give concise answers and recommend what the user should do to improve their fitness. Recommend goals to set in the goals section of the Extras tab. Recommend to consistently upload everyday progress pictures and add comments to their posts.
  Make sure when recommending to utilize the ratings given to understand the history (ex. if a user's scores have been going down consistently to recognize this)

GOALS:
`;
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

  prompt += `\nYour role is to provide personalized fitness advice, motivation, and guidance based on this information. Be encouraging, professional, and helpful.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, accessToken } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Create authenticated Supabase client with user's access token
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    console.log('[Coach Chat] Fetching goals for user:', userId);
    console.log('[Coach Chat] Goals query: from("goals").select("*").eq("user", userId)');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user', userId)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('[Coach Chat] Goals error:', goalsError);
      console.error('[Coach Chat] Goals error details:', JSON.stringify(goalsError, null, 2));
      throw goalsError;
    }
    console.log('[Coach Chat] Goals fetched:', goals?.length || 0);
    if (goals && goals.length > 0) {
      console.log('[Coach Chat] First goal sample:', JSON.stringify(goals[0], null, 2));
    } else {
      // Try a test query to see if we can access the table at all
      console.log('[Coach Chat] No goals found, testing table access...');
      const { data: testGoals, error: testError } = await supabase
        .from('goals')
        .select('*')
        .limit(5);
      console.log('[Coach Chat] Test query - Goals in table:', testGoals?.length || 0);
      if (testError) {
        console.error('[Coach Chat] Test query error:', testError);
      }
    }

    // Fetch posts
    console.log('[Coach Chat] Fetching posts for user_id:', userId);
    console.log('[Coach Chat] Posts query: from("posts").select("*").eq("user_id", userId)');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('[Coach Chat] Posts error:', postsError);
      console.error('[Coach Chat] Posts error details:', JSON.stringify(postsError, null, 2));
      throw postsError;
    }
    console.log('[Coach Chat] Posts fetched:', posts?.length || 0);
    if (posts && posts.length > 0) {
      console.log('[Coach Chat] First post sample:', JSON.stringify(posts[0], null, 2));
      console.log('[Coach Chat] First post user_id:', posts[0].user_id);
      console.log('[Coach Chat] Query userId:', userId);
      console.log('[Coach Chat] user_id match:', posts[0].user_id === userId);
    } else {
      // Try a test query to see if we can access the table at all
      console.log('[Coach Chat] No posts found, testing table access...');
      const { data: testPosts, error: testError } = await supabase
        .from('posts')
        .select('*')
        .limit(5);
      console.log('[Coach Chat] Test query - Posts in table:', testPosts?.length || 0);
      if (testPosts && testPosts.length > 0) {
        console.log('[Coach Chat] Sample post user_id:', testPosts[0].user_id);
        console.log('[Coach Chat] Sample post user_id type:', typeof testPosts[0].user_id);
        console.log('[Coach Chat] Query userId type:', typeof userId);
      }
      if (testError) {
        console.error('[Coach Chat] Test query error:', testError);
      }
    }

    // Fetch comments for all posts
    const postIds = posts?.map(post => post.id) || [];
    console.log('[Coach Chat] Post IDs for comments:', postIds);
    let allComments: Comment[] = [];
    
    if (postIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post', postIds)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('[Coach Chat] Comments error:', commentsError);
        throw commentsError;
      }

      allComments = (comments as Comment[]) || [];
      console.log('[Coach Chat] Comments fetched:', allComments.length);
    } else {
      console.log('[Coach Chat] No post IDs, skipping comments fetch');
    }

    // Build system prompt
    const userDataForPrompt = {
      goals: (goals as Goal[]) || [],
      posts: (posts as Post[]) || [],
      comments: allComments,
    };
    console.log('[Coach Chat] Data for system prompt:', {
      goalsCount: userDataForPrompt.goals.length,
      postsCount: userDataForPrompt.posts.length,
      commentsCount: userDataForPrompt.comments.length,
    });

    const systemPrompt = buildSystemPrompt(userDataForPrompt);
    console.log('[Coach Chat] System prompt built, length:', systemPrompt.length);
    console.log('[Coach Chat] System prompt preview:', systemPrompt.substring(0, 500));

    console.log('[Coach Chat] Calling OpenAI');

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

