import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const mateTable = "MATE_POSTING";
export const tsTable = "TRAVEL_STYLES";
export const ptsTable = "POSTING_TRAVEL_STYLES";

export const cmtTable = "POSTING_COMMENTS";
export const matebucketName = "mate-bucket";
export const folderName = "mate";

