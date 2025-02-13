// config.js
export const supabaseUrl = "https://frqevnyaghrnmtccnerc.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycWV2bnlhZ2hybm10Y2NuZXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTk4MDIsImV4cCI6MjA1NDgzNTgwMn0.1ITu6ie5GxJE_mf_a-G5kblLoY_5kYStt6EBxf8drPQ";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window._supabase = createClient(supabaseUrl, supabaseAnonKey);
// export const { createClient } = supabase; // 이 줄 삭제!
// export const _supabase = createClient(supabaseUrl, supabaseAnonKey);

export const mateTable = "MATE_POSTING";
export const tsTable = "TRAVEL_STYLES";
export const ptsTable = "POSTING_TRAVEL_STYLES";
