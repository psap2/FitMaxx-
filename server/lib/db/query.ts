import { supabase } from "../supabase";
import { Post, User } from "./schema";

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

