import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://wvncdusvpfbdsnclynxl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bmNkdXN2cGZiZHNuY2x5bnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjQyNjEsImV4cCI6MjA4NzYwMDI2MX0.aSNumnERTQ8L-74raclsbdIh3NDF6gDZKOn3mm8gEcg");

async function run() {
    // try to force schema cache reload by calling the RPC or just select
    const { data, error } = await supabase.from('budgets').select('id, title, proposal_id, validity_date').limit(3);
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(data, null, 2));
}
run();
