import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const fakeEmail = `fake${Date.now()}@example.com`;
  console.log("Registering:", fakeEmail);
  const { data: regData } = await supabase.auth.signUp({
    email: fakeEmail,
    password: process.env.TEST_PASSWORD || "randompassword123",
  });
  
  const userId = regData?.user?.id;
  if (!userId) return console.log("Signup failed");

  const { data: logData, error: logErr } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_EMAIL || "test@example.com",
    password: process.env.TEST_PASSWORD || "randompassword123",
  });

  if (logErr) {
     console.log("Login err:", logErr.message);
  }
}
test();
