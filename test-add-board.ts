import { createClient } from "@supabase/supabase-js";
import { supabase } from "./src/lib/supabase";

async function test() {
  const { data: { session } } = await supabase.auth.getSession();
  if(!session) {
    // maybe sign in with some random user
    console.log("No session, signing in...");
    await supabase.auth.signInWithPassword({
        email: process.env.TEST_EMAIL || "test@example.com",
        password: process.env.TEST_PASSWORD || "password123"
    });
  }
  
  const s2 = await supabase.auth.getSession();
  if(!s2.data.session) return console.log("Login failed");
  const user = s2.data.session.user;

  console.log("Logged in:", user.id);
  const { data: board, error } = await supabase.from('boards').insert({ name: 'Test Board', owner_id: user.id }).select().single();
  console.log("Board:", board);
  console.log("Error:", error);
}
test();
