import { supabase } from "../../../utils/supabase";
import { User } from "./schema";

export const getUser = async (email: string) => {
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
