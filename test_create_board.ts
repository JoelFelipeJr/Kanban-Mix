import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error: logErr } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_EMAIL || "test@example.com",
    password: process.env.TEST_PASSWORD || "password123",
  });
  if (logErr) {
     console.log("Login err:", logErr.message);
     return;
  }
  const session = data.session;
  console.log("Logged in!", session.user.id);
  
  const boardId = crypto.randomUUID();
  console.log("Inserting board...");
  const res = await supabase.from('boards').insert({ 
    id: boardId, 
    name: "test board", 
    owner_id: session.user.id 
  });
  console.log("Res:", res);
}
main();
