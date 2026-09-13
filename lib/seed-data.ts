/**
 * Seed data.
 *
 * Tools carry NO affiliate URL, discount code, badge or rating. Those must only
 * ever be entered by hand after a real partner agreement exists: inventing them
 * misleads readers and fails ad-network review. Every entry here is a plain
 * editorial listing pointing at the tool's real public site.
 *
 * There are deliberately no seed ARTICLES. The three that used to live here were
 * hand-written for the mockup but carried real-looking attributions to sources
 * they were never derived from. Articles now come from content/articles/ only.
 */

export const SEED_CHANNELS = [
  // Every feed below was fetched and confirmed to return items. Feeds that were
  // in the original seed but 404'd (The Rundown AI, AI Breakfast, the Matt Wolfe
  // channel id) have been removed rather than left to fail on every run.
  //
  // X/Twitter handles are intentionally absent: there is no free read access, so
  // the adapter in lib/sources/x.ts is a stub. Where an X account matters, add
  // its blog/RSS equivalent here instead.
  {
    name: "OpenAI Blog",
    handleOrUrl: "https://openai.com/blog/rss.xml",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "Google DeepMind",
    handleOrUrl: "https://deepmind.google/blog/rss.xml",
    type: "RSS",
    category: "Research",
  },
  {
    name: "Google AI Blog",
    handleOrUrl: "https://blog.google/technology/ai/rss/",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "TechCrunch AI",
    handleOrUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "Ars Technica AI",
    handleOrUrl: "https://arstechnica.com/ai/feed/",
    type: "RSS",
    category: "Research",
  },
  {
    name: "The Verge AI",
    handleOrUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    type: "RSS",
    category: "Productivity",
  },
  {
    name: "MIT Technology Review AI",
    handleOrUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    type: "RSS",
    category: "Research",
  },
  {
    name: "Simon Willison",
    handleOrUrl: "https://simonwillison.net/atom/everything/",
    type: "RSS",
    category: "Coding",
  },
  {
    name: "Two Minute Papers",
    handleOrUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg",
    type: "YOUTUBE",
    category: "Research",
  },
];

export const SEED_TOOLS = [
  {
    name: "Hermes Agent",
    slug: "hermes-agent",
    aliases: JSON.stringify(["hermes", "nous hermes", "hermes 3", "hermes agent"]),
    tagline: "Autonomous open-weights agent framework with native function calling and tool execution",
    description: "Built by Nous Research, Hermes Agent powers autonomous workflows using Hermes 3 and Llama 3 models. Features structured JSON output, native tool execution, persistent agent memory, and compatibility with local runners like Ollama and vLLM.",
    category: "AI Agents & Frameworks",
    pricingModel: "Open Source (Apache 2.0)",
    websiteUrl: "https://github.com/NousResearch/Hermes-Function-Calling",
  },
  {
    name: "Cline",
    slug: "cline",
    aliases: JSON.stringify(["cline", "claude dev", "cline extension"]),
    tagline: "Autonomous coding agent in VS Code that executes terminal commands, edits files, and uses MCP",
    description: "An open-source autonomous coding extension for VS Code. Pairs frontier models such as Claude 3.7 Sonnet, DeepSeek-V3, and GPT-4o with bash execution, file modifications, browser automation, and Model Context Protocol servers under strict human supervision.",
    category: "Coding",
    pricingModel: "Open Source (Bring Your Own API Key)",
    websiteUrl: "https://github.com/cline/cline",
  },
  {
    name: "Ollama",
    slug: "ollama",
    aliases: JSON.stringify(["ollama", "ollama run", "ollama cli"]),
    tagline: "Run frontier open-source LLMs locally on macOS, Linux, and Windows with GPU acceleration",
    description: "Lightweight tool to bundle model weights, configurations, and quantization into portable Modelfiles. Exposes an OpenAI-compatible REST API and terminal CLI supporting Llama 3, DeepSeek-R1, Mistral, and Qwen 2.5 on Apple Silicon and NVIDIA GPUs.",
    category: "Inference & Local AI",
    pricingModel: "Free & Open Source (MIT)",
    websiteUrl: "https://ollama.com",
  },
  {
    name: "vLLM",
    slug: "vllm",
    aliases: JSON.stringify(["vllm", "vllm serving"]),
    tagline: "High-throughput and memory-efficient LLM serving engine powered by PagedAttention",
    description: "Developed at UC Berkeley, vLLM delivers up to 24x higher serving throughput than standard Hugging Face pipelines by managing KV cache memory with PagedAttention. Powers production model inference with continuous batching and speculative decoding.",
    category: "Inference & Local AI",
    pricingModel: "Open Source (Apache 2.0)",
    websiteUrl: "https://github.com/vllm-project/vllm",
  },
  {
    name: "Cursor",
    slug: "cursor",
    aliases: JSON.stringify(["cursor", "cursor ide", "cursor editor"]),
    tagline: "The AI code editor built for codebase indexing, multi-file refactoring, and agentic editing",
    description: "A specialized VS Code fork engineered for autonomous software engineering. Features Composer for multi-file code editing, deep semantic codebase indexing, terminal error fixing, and model access to Claude 3.7 Sonnet and GPT-4o.",
    category: "Coding",
    pricingModel: "Freemium ($20/mo Pro)",
    websiteUrl: "https://cursor.com",
  },
  {
    name: "n8n",
    slug: "n8n",
    aliases: JSON.stringify(["n8n", "n8n.io", "nodemation"]),
    tagline: "Fair-code workflow automation platform with native AI agent orchestration and 400+ nodes",
    description: "Visual workflow automation platform for technical teams. Combines 400+ API connectors with native LangChain AI agents, vector database stores, JavaScript/Python code execution, and complete self-hosting freedom.",
    category: "Automation",
    pricingModel: "Free Self-Hosted / From $20/mo Cloud",
    websiteUrl: "https://n8n.io",
  },
  {
    name: "Perplexity AI",
    slug: "perplexity-ai",
    aliases: JSON.stringify(["perplexity", "perplexity ai", "perplexity pro"]),
    tagline: "Conversational answer engine that searches the live web and delivers cited syntheses",
    description: "Replaces traditional web search with instant, cited answers synthesized across live web pages, research papers, and technical documentations. Features Pro Search multi-step research modes.",
    category: "Research",
    pricingModel: "Freemium ($20/mo Pro)",
    websiteUrl: "https://perplexity.ai",
  },
  {
    name: "Claude (Anthropic)",
    slug: "claude-3-5",
    aliases: JSON.stringify(["claude", "claude 3.5", "claude 3.7", "anthropic claude"]),
    tagline: "Frontier reasoning, advanced coding, and interactive Artifacts from Anthropic",
    description: "Anthropic's flagship family including Claude 3.7 Sonnet with hybrid reasoning and Claude 3.5 Sonnet. Excels at complex system architecture, nuanced technical writing, tool use, and interactive web prototyping.",
    category: "Writing & Productivity",
    pricingModel: "Free Tier / $20/mo Pro",
    websiteUrl: "https://claude.ai",
  },
  {
    name: "Make.com",
    slug: "make-com",
    aliases: JSON.stringify(["make", "make.com", "integromat"]),
    tagline: "Visual drag-and-drop workflow automation with multi-branch logic and AI connectors",
    description: "Connect 1,500+ business applications without code. Automate customer data flows, CRM entries, and content publishing with built-in AI routing, error handling, and JSON parsing.",
    category: "Automation",
    pricingModel: "Free Tier / From $9/mo",
    websiteUrl: "https://make.com",
  },
  {
    name: "ElevenLabs",
    slug: "elevenlabs",
    aliases: JSON.stringify(["elevenlabs", "eleven labs"]),
    tagline: "Ultra-realistic AI voice cloning, conversational agents, and multilingual speech synthesis",
    description: "Generates natural human voices across 29+ languages from plain text, featuring instant voice cloning, emotional nuance controls, and conversational low-latency voice agent APIs.",
    category: "Audio & Voice",
    pricingModel: "Free Tier / From $5/mo",
    websiteUrl: "https://elevenlabs.io",
  },
  {
    name: "Gamma App",
    slug: "gamma-app",
    aliases: JSON.stringify(["gamma", "gamma app"]),
    tagline: "Generate styled presentations, technical documents, and web pages from text prompts",
    description: "Turns markdown outlines or text briefs into interactive slide decks, document hubs, and web pages with one-click theme styling and responsive layout formatting.",
    category: "Presentations",
    pricingModel: "Freemium",
    websiteUrl: "https://gamma.app",
  },
  {
    name: "LangGraph",
    slug: "langgraph",
    aliases: JSON.stringify(["langgraph", "langchain", "langgraph-agent"]),
    tagline: "Build resilient, multi-actor LLM applications with cyclic computation and state graphs",
    description: "Engineered by LangChain, LangGraph provides fine-grained control over agentic loops, human-in-the-loop approvals, and multi-turn state persistence. It is the enterprise standard for complex multi-agent architectures.",
    category: "AI Agents & Frameworks",
    pricingModel: "Open Source (MIT) / Cloud Tier",
    websiteUrl: "https://github.com/langchain-ai/langgraph",
  },
  {
    name: "OpenRouter",
    slug: "openrouter",
    aliases: JSON.stringify(["openrouter", "openrouter ai"]),
    tagline: "Unified API gateway and intelligent model router for 200+ frontier and open-weights LLMs",
    description: "Single OpenAI-compatible endpoint with automatic fallback routing, token-level pricing transparency, rate-limit pooling, and support for DeepSeek-R1, Claude 3.7 Sonnet, Llama 3.3, and Gemini 2.5.",
    category: "Inference & Local AI",
    pricingModel: "Pay-as-you-go (Direct Provider Pricing)",
    websiteUrl: "https://openrouter.ai",
  },
  {
    name: "LiteLLM",
    slug: "litellm",
    aliases: JSON.stringify(["litellm", "litellm proxy"]),
    tagline: "High-performance proxy to call 100+ LLMs in OpenAI standard format with spend guardrails",
    description: "Lightweight gateway that standardizes API requests across AWS Bedrock, Azure, Anthropic, OpenAI, Vertex, and local vLLM instances. Features per-key budget limits, fallback routing, and team spend analytics.",
    category: "AI Agents & Frameworks",
    pricingModel: "Open Source (Apache 2.0)",
    websiteUrl: "https://github.com/BerriAI/litellm",
  },
  {
    name: "CrewAI",
    slug: "crewai",
    aliases: JSON.stringify(["crewai", "crew ai", "crew-ai"]),
    tagline: "Multi-agent framework enabling autonomous AI teams to role-play, collaborate, and execute complex goals",
    description: "Orchestrates collaborative autonomous agents where each agent operates with defined roles, tools, and delegation rules. Seamlessly executes multi-step research, content pipelines, and operational tasks.",
    category: "AI Agents & Frameworks",
    pricingModel: "Open Source (Apache 2.0) / Cloud Tier",
    websiteUrl: "https://github.com/crewAIInc/crewAI",
  },
  {
    name: "Flowise",
    slug: "flowise",
    aliases: JSON.stringify(["flowise", "flowiseai"]),
    tagline: "Open-source visual canvas for building customized LLM chains, autonomous agents, and RAG pipelines",
    description: "Drag-and-drop orchestration UI for LangChain and LlamaIndex. Lets teams visually connect vector stores, memory, custom tools, and autonomous agent loops without writing boilerplate backend code.",
    category: "Automation",
    pricingModel: "Free & Open Source (Apache 2.0)",
    websiteUrl: "https://flowiseai.com",
  },
];

