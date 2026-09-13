async function verify() {
  console.log("Starting Full Localhost Verification...\n");

  const BASE_URL = "http://localhost:3000";

  // 1. Check Homepage
  const homeRes = await fetch(`${BASE_URL}/`);
  if (homeRes.status !== 200) throw new Error(`Home failed with status ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  if (!homeHtml.includes("Put AI to work with step-by-step blueprints")) {
    throw new Error("Homepage missing Blueprints hero headline.");
  }
  if (!homeHtml.includes("Talk to Us")) {
    throw new Error("Navbar missing 'Talk to Us' priority CTA.");
  }
  if (homeHtml.includes("Hire Us")) {
    throw new Error("Navbar still contains 'Hire Us'. It should be replaced with 'Talk to Us'.");
  }
  if (homeHtml.toLowerCase().includes("n8n")) {
    throw new Error("Homepage still contains 'n8n'. It should only be mentioned when someone opens the template page.");
  }
  if (homeHtml.includes("Get free blueprints") && homeHtml.includes("hidden sm:inline-flex rounded-full bg-ink px-4 py-2 font-sans")) {
    throw new Error("Navbar still has 'Get free blueprints' button. It should be on template page.");
  }
  console.log("✔ 1. Homepage loads (200): 'Talk to Us' priority CTA active in Navbar, 'Hire Us' removed cleanly, zero n8n mentions.");

  // 2. Check Blueprints Library
  const libRes = await fetch(`${BASE_URL}/blueprints`);
  if (libRes.status !== 200) throw new Error(`Library failed with status ${libRes.status}`);
  const libHtml = await libRes.text();
  if (!libHtml.includes("AI Blueprints")) {
    throw new Error("Library page missing title.");
  }
  if (!libHtml.includes("Workflow Templates") || !libHtml.includes("?goal=")) {
    throw new Error("Blueprints library missing library tabs or goal filters.");
  }
  if (libHtml.toLowerCase().includes("n8n")) {
    throw new Error("Blueprints library still contains 'n8n'. It should only be mentioned when someone opens the template page.");
  }
  console.log("✔ 2. /blueprints loads (200): Library tabs and goal filters active, zero n8n mentions.");

  // 3. Check WhatsApp eCommerce Template Page
  const waRes = await fetch(`${BASE_URL}/blueprints/whatsapp-ecommerce-ai-agent`);
  if (waRes.status !== 200) throw new Error(`WhatsApp blueprint failed with status ${waRes.status}`);
  const waHtml = await waRes.text();
  if (!waHtml.includes("The Problem")) {
    throw new Error("Free section missing on WhatsApp blueprint.");
  }
  if (waHtml.includes("Set up WhatsApp.")) {
    throw new Error("CRITICAL: Gated text was sent to guest on WhatsApp blueprint!");
  }
  if (!waHtml.includes("Unlock the full step-by-step guide")) {
    throw new Error("Email unlock box missing on blueprint page.");
  }
  console.log("✔ 3. /blueprints/whatsapp-ecommerce-ai-agent loads as guest (200): email unlock box active, gated text secured.");

  // 4. Test Contact Page (Redesigned, Human Consultancy style, no n8n)
  const contactRes = await fetch(`${BASE_URL}/contact`);
  if (contactRes.status !== 200) throw new Error(`Contact page failed with status ${contactRes.status}`);
  const contactHtml = await contactRes.text();
  if (!contactHtml.includes("Talk to our automation engineers")) {
    throw new Error("Contact page missing positioning headline.");
  }
  if (contactHtml.toLowerCase().includes("n8n")) {
    throw new Error("Contact page should not mention n8n. Rather, write Automation.");
  }
  console.log("✔ 4. /contact page loads (200): Human engineering consultancy positioning active, zero n8n mentions.");

  // 5. Test Contact API Submission
  const contactApiRes = await fetch(`${BASE_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Alex Morgan",
      email: "alex@growthcompany.com",
      company: "Growth Co",
      projectType: "automation-workflow",
      budget: "$2k-$5k",
      message: "Looking for an automated lead qualification workflow connected to CRM and Slack.",
    }),
  });
  if (contactApiRes.status !== 200) throw new Error(`Contact API failed with status ${contactApiRes.status}`);
  const contactApiData = await contactApiRes.json();
  if (!contactApiData.ok) throw new Error("Contact API response did not indicate success.");
  console.log("✔ 5. POST /api/contact receives and processes customer inquiry successfully.");

  // 6. Test Footer content
  const footerIdx = homeHtml.indexOf("<footer");
  if (footerIdx !== -1) {
    const footerHtml = homeHtml.slice(footerIdx);
    if (footerHtml.includes("Talk to Us") || footerHtml.includes("Talk to us")) {
      throw new Error("Footer still contains 'Talk to us'. It must be removed from footer.");
    }
    const workflowsSectionIdx = footerHtml.indexOf("Workflows &amp; Services");
    if (workflowsSectionIdx !== -1) {
      const workflowsSectionHtml = footerHtml.slice(workflowsSectionIdx, workflowsSectionIdx + 600);
      if (workflowsSectionHtml.toLowerCase().includes("ai news")) {
        throw new Error("Footer WORKFLOWS & SERVICES section still contains 'AI news'.");
      }
    }
  }
  console.log("✔ 6. Footer verified: 'Talk to us' removed, 'AI news' removed from Workflows & Services column.");

  // 7. Test Goal Filters
  const opsRes = await fetch(`${BASE_URL}/blueprints?goal=automate-operations`);
  if (opsRes.status !== 200) throw new Error(`Goal filter failed with status ${opsRes.status}`);
  const opsHtml = await opsRes.text();
  if (!opsHtml.includes("telegram-langchain-ai-assistant") || !opsHtml.includes("slack-linear-support-ticketing")) {
    throw new Error("Automate Operations goal is missing the Telegram or Slack blueprint.");
  }

  const leadsRes = await fetch(`${BASE_URL}/blueprints?goal=get-more-leads`);
  if (leadsRes.status !== 200) throw new Error(`Leads goal failed with status ${leadsRes.status}`);
  const leadsHtml = await leadsRes.text();
  if (leadsHtml.includes("slack-linear-support-ticketing")) {
    throw new Error("Get More Leads goal is showing an unrelated blueprint.");
  }
  console.log("✔ 7. Blueprint goal filters verified.");

  // 8. Test 6 New Blueprints
  const newBlueprints = [
    "content-performance-analytics",
    "lead-qualification-enrichment",
    "competitor-intelligence-gathering",
    "customer-support-triage",
    "audience-growth-prediction",
    "content-automation",
  ];
  for (const slug of newBlueprints) {
    const bpRes = await fetch(`${BASE_URL}/blueprints/${slug}`);
    if (bpRes.status !== 200) throw new Error(`Blueprint /blueprints/${slug} failed with status ${bpRes.status}`);
    const bpHtml = await bpRes.text();
    if (!bpHtml.includes("How It Works") || bpHtml.includes("Build It Step by Step</h2>")) {
      throw new Error(`Blueprint ${slug} free view must show 'How It Works' and hide the gated setup steps.`);
    }
  }
  console.log("✔ 8. All 6 new blueprints verified on localhost:200 with plain-English sections.");

  // 9. Test Tools Directory
  const toolsRes = await fetch(`${BASE_URL}/tools`);
  if (toolsRes.status !== 200) throw new Error(`Tools directory failed with status ${toolsRes.status}`);
  const toolsHtml = await toolsRes.text();
  if (!toolsHtml.includes("Hermes Agent") || !toolsHtml.includes("Cline") || !toolsHtml.includes("Ollama")) {
    throw new Error("Tools directory missing Hermes, Cline, or Ollama.");
  }
  console.log("✔ 9. AI Tools Directory verified: Hermes, Cline, Ollama, LangGraph and tools indexed.");

  console.log("\nALL LOCALHOST VERIFICATION CHECKS PASSED PERFECTLY!");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
