"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "automation-workflow",
    budget: "$2k-$5k",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-paper pt-10 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="max-w-3xl border-b border-rule pb-8">
          <span className="kicker">
            Custom Automation &amp; Engineering
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
            Talk to our automation engineers
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink/80">
            We build custom operational automations, data integrations, and internal AI tools for teams that have outgrown manual processes. You will communicate directly with the engineers who build and deploy the workflows, not sales representatives.
          </p>
        </div>

        {/* Dual-Column Layout */}
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
          {/* Left Column: Authentic Engineering Context & Engagement Process */}
          <div className="lg:col-span-5 space-y-10">
            {/* Capabilities Overview */}
            <div>
              <h2 className="font-serif text-xl font-bold text-ink">
                What we build for teams
              </h2>
              <p className="mt-1.5 text-xs text-ink/70 leading-relaxed">
                Reliable operational tooling designed for production stability, clear audit logs, and complete client ownership.
              </p>

              <div className="mt-5 space-y-4 text-xs sm:text-sm text-ink/85 border-t border-rule pt-4">
                <div>
                  <h3 className="font-semibold text-ink">Operational Data Pipelines</h3>
                  <p className="mt-0.5 text-ink/75">
                    Multi-app synchronization across CRM, email, spreadsheets, and databases with automated retry logic, error handling, and alerting.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ink">Custom AI Tools &amp; Assistants</h3>
                  <p className="mt-0.5 text-ink/75">
                    Task-specific internal tools for inbound lead qualification, customer support triage, document extraction, and report generation.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ink">Data Extraction &amp; Enrichment</h3>
                  <p className="mt-0.5 text-ink/75">
                    Resilient scrapers, scheduled ETL sync jobs, and customer data enrichment pipelines that deliver clean, structured records.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ink">Human-in-the-Loop Safeguards</h3>
                  <p className="mt-0.5 text-ink/75">
                    Sensible boundaries where automation drafts, scores, and notifies, while your team retains manual approval before actions execute.
                  </p>
                </div>
              </div>
            </div>

            {/* Engagement Process */}
            <div className="border-t border-rule pt-6">
              <h2 className="font-serif text-xl font-bold text-ink">
                How we work together
              </h2>
              <p className="mt-1.5 text-xs text-ink/70 leading-relaxed">
                A straightforward three-step engineering delivery process with transparent timelines.
              </p>

              <div className="mt-5 space-y-4 text-xs sm:text-sm text-ink/85 border-t border-rule pt-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-accent uppercase tracking-wider block">
                    Phase 01: Audit &amp; Architecture
                  </span>
                  <p className="mt-0.5 text-ink/75">
                    We evaluate your existing manual steps, credentials, edge cases, and API limits to propose a concrete technical architecture.
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] font-semibold text-accent uppercase tracking-wider block">
                    Phase 02: Staging &amp; Live Validation
                  </span>
                  <p className="mt-0.5 text-ink/75">
                    We build and test the full pipeline in an isolated staging environment with realistic test payloads, error logging, and fallback mechanisms.
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] font-semibold text-accent uppercase tracking-wider block">
                    Phase 03: Deployment &amp; Ownership
                  </span>
                  <p className="mt-0.5 text-ink/75">
                    We deploy directly to your infrastructure. You retain 100% ownership of your credentials, source files, and workflow configurations.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Email Card */}
            <div className="border border-rule bg-surface p-6 text-xs text-ink/80 space-y-2">
              <span className="font-semibold text-ink block text-sm">Prefer direct email?</span>
              <p className="leading-relaxed">
                Send your workflow details or architecture diagrams directly to our engineering lead at{" "}
                <a
                  href="mailto:support@stacksgpt.com"
                  className="font-medium text-ink underline hover:text-accent"
                >
                  support@stacksgpt.com
                </a>
                . We review every note personally and reply within 24 business hours.
              </p>
            </div>
          </div>

          {/* Right Column: Grounded Project Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="border border-rule bg-surface p-6 sm:p-10 shadow-sm">
              <div className="border-b border-rule pb-6 mb-6">
                <span className="kicker">
                  Project Inquiry
                </span>
                <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-ink">
                  Describe your workflow bottleneck
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-ink/75 leading-relaxed">
                  Share the workflow or manual bottleneck you want automated. We review every submission personally and reply with concrete, actionable feedback.
                </p>
              </div>

              {status === "success" ? (
                <div className="border border-emerald-300 bg-emerald-50 p-8 text-center text-emerald-950">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                  <h3 className="font-serif text-2xl font-bold">Inquiry Received</h3>
                  <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto">
                    Thank you. Our automation engineering leads will evaluate your requirements and reach out within 24 hours.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/blueprints"
                      className="inline-flex rounded-[2px] bg-ink px-4 py-2 text-xs font-semibold text-paper"
                    >
                      Browse Open Blueprints in the Meantime
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-ink">
                        Your Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Sarah Jenkins"
                        className="mt-1.5 w-full rounded-[2px] border border-rule bg-paper px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-ink">
                        Work Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="sarah@company.com"
                        className="mt-1.5 w-full rounded-[2px] border border-rule bg-paper px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="company" className="block text-xs font-semibold text-ink">
                        Company or Organization
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Acme Growth"
                        className="mt-1.5 w-full rounded-[2px] border border-rule bg-paper px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="projectType" className="block text-xs font-semibold text-ink">
                        Primary Focus Area *
                      </label>
                      <select
                        id="projectType"
                        value={form.projectType}
                        onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                        className="mt-1.5 w-full rounded-[2px] border border-rule bg-paper px-3 py-2.5 text-xs sm:text-sm text-ink focus:border-ink focus:outline-none"
                      >
                        <option value="automation-workflow">Operational Automation &amp; App Integration</option>
                        <option value="whatsapp-ai-agent">Messaging &amp; Customer Support Automation</option>
                        <option value="lead-gen-outreach">B2B Lead Scoring &amp; Outreach Pipeline</option>
                        <option value="document-extraction">Document Processing &amp; Data Extraction</option>
                        <option value="custom-internal-tool">Custom Internal AI Tool</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="budget" className="block text-xs font-semibold text-ink">
                      Estimated Project Budget
                    </label>
                    <select
                      id="budget"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      className="mt-1.5 w-full rounded-[2px] border border-rule bg-paper px-3 py-2.5 text-xs sm:text-sm text-ink focus:border-ink focus:outline-none"
                    >
                      <option value="under-$2k">Under $2,000</option>
                      <option value="$2k-$5k">$2,000 to $5,000 (Target scope)</option>
                      <option value="$5k-$10k">$5,000 to $10,000</option>
                      <option value="$10k+">$10,000+ (Multi-system integration)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-ink">
                      What manual workflow or bottleneck would you like automated? *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your current manual process, apps involved (e.g. CRM, Slack, Google Sheets, databases), and what a successful automated outcome looks like..."
                      className="mt-1.5 w-full rounded-[2px] border border-rule bg-paper p-3 text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-[2px] bg-ink px-6 py-3.5 text-sm font-semibold text-paper hover:bg-ink/90 transition shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-accent" />
                        <span>Send Project Inquiry</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-ink/60">
                    No spam. Direct correspondence with our engineering leads only.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
