import { supabase } from "../../../utils/supabase";
import { Post, User, Comment } from "./schema";

export const getUser = async (email: string | undefined) => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email);
    if (error) {
        throw error;
    }
    return data;
}

export const createUser = async (user: User) => {
    const { data, error } = await supabase.from('users').insert(user);
    if (error) {
        throw error;
    }
    return data;
}

export const updateUser = async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase.from('users').update(updates).eq('id', userId);
    if (error) {
        throw error;
    }
    return data;
}

type PostInsert = Omit<Post, 'id' | 'created_at'>;

export const createPost = async (post: PostInsert) => {
    const { data, error } = await supabase.from('posts').insert(post).select().single();
    if (error) {
        throw error;
    }
    return data;
}

// Comment functions
export const getComments = async (postId: string) => {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post', postId)
        .order('created_at', { ascending: false });
    if (error) {
        throw error;
    }
    return data;
}

type CommentInsert = Omit<Comment, 'id' | 'created_at'>;

export const createComment = async (comment: CommentInsert) => {
    const { data, error } = await supabase.from('comments').insert(comment).select().single();
    if (error) {
        throw error;
    }
    return data;
}

export const deleteComment = async (commentId: string, userId: string) => {
    const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user', userId)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

