import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const results: string[] = [];

    // Create admin user
    const { data: adminUser, error: e1 } = await admin.auth.admin.createUser({
      email: "admin@financepro.com",
      password: "Admin123!",
      email_confirm: true,
      user_metadata: { name: "Admin FinancePro" },
    });
    if (e1) results.push(`Admin error: ${e1.message}`);
    else results.push(`Admin created: ${adminUser.user.id}`);

    // Create normal user
    const { data: normalUser, error: e2 } = await admin.auth.admin.createUser({
      email: "jo@gmail.com",
      password: "12345678",
      email_confirm: true,
      user_metadata: { name: "Jo" },
    });
    if (e2) results.push(`Normal user error: ${e2.message}`);
    else results.push(`Normal user created: ${normalUser.user.id}`);

    // Assign admin role (trigger already creates 'user' role)
    if (adminUser?.user) {
      const { error: roleErr } = await admin.from("user_roles").upsert({ user_id: adminUser.user.id, role: "admin" });
      if (roleErr) results.push(`Admin role error: ${roleErr.message}`);
      else results.push("Admin role assigned");
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
