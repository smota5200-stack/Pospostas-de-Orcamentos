import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://wvncdusvpfbdsnclynxl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bmNkdXN2cGZiZHNuY2x5bnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjQyNjEsImV4cCI6MjA4NzYwMDI2MX0.aSNumnERTQ8L-74raclsbdIh3NDF6gDZKOn3mm8gEcg");

async function run() {
    const { data, error } = await supabase.from('budgets').insert({
        client_name: "Test",
        title: "Test",
        proposal_id: 10001
    }).select();
    console.log("Error:", error);
    console.log("Data:", data);
}
run();
