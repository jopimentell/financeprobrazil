import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "admin@financepro.com", password: "Admin123!", name: "Admin", role: "admin" },
    { email: "jo@gmail.com", password: "12345678", name: "Jo", role: "user" },
  ];

  const results: any[] = [];
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name },
    });
    if (error) { results.push({ email: u.email, error: error.message }); continue; }
    if (u.role === "admin") {
      await admin.from("user_roles").upsert({ user_id: data.user.id, role: "admin" });
    }
    results.push({ email: u.email, id: data.user.id });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
