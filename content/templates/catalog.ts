import type { TemplateEntry } from "../../lib/templates";

// Editorial rules for this file (enforced by tests/templates.test.ts):
// no digits, no dashes used as punctuation, and no runner name, so listing pages stay tool-neutral.
// Every claim must come from the template's own nodes or author notes.

export const TEMPLATE_ENTRIES: TemplateEntry[] = [
  // Sales & Leads
  {
    slug: "qualify-leads-google-sheets",
    title: "Qualify New Leads in Google Sheets with OpenAI",
    category: "sales-and-leads",
    summary:
      "Score new form or sheet leads with OpenAI and write the verdict back into the same Google Sheet.",
    problem:
      "Leads land in a spreadsheet from a form, and someone has to read each row to decide who is worth a call. Good leads wait while the list grows.",
    useCase:
      "A founder collects demo requests through Google Forms. The workflow reads each new row, asks OpenAI to judge it against your qualification instructions and adds the result in its own column, so the sales team can sort the sheet by the answer.",
    roles: ["sales", "founder"],
    howItWorks: [
      "Watches a Google Sheet for new rows, such as responses from a connected Google Form.",
      "Sends each row to OpenAI with your qualification instructions as the system message.",
      "Merges the original row with the AI response.",
      "Updates the matching row in the sheet, using a unique column such as the form timestamp.",
    ],
    youNeed: [
      "A Google Sheet, standalone or linked to Google Forms",
      "An OpenAI API key",
      "Written qualification criteria for your business",
    ],
    staysManual: [
      "You write and maintain the qualification instructions.",
      "Your team decides who to contact. The workflow only labels rows.",
    ],
    watchOuts: [
      "Match rows on a column that is unique for every entry, or results can land on the wrong lead.",
      "The AI can only judge what the form captured. Ask for company and role if they matter to you.",
    ],
    blueprints: ["lead-qualification-enrichment"],
  },
  {
    slug: "enrich-pipedrive-organizations",
    title: "Enrich New Pipedrive Organizations and Notify Slack",
    category: "sales-and-leads",
    summary:
      "When a new organization is added to Pipedrive, scrape its website, summarize it with OpenAI and attach the summary as a note.",
    problem:
      "Reps add companies to the CRM with little more than a name and a website. Before each call they open the site to work out what the company sells and who it serves.",
    useCase:
      "A sales team creates an organization in Pipedrive. Shortly after, a note appears on that record describing the company's products, target market and possible competitors, and the team gets a Slack message, so the rep starts with context instead of a blank record.",
    roles: ["sales", "operations"],
    howItWorks: [
      "Starts when an organization is created in Pipedrive.",
      "Scrapes the homepage from the organization's custom website field with ScrapingBee or another scraping API.",
      "Sends the page content to OpenAI with instructions to summarize the company for a CRM entry.",
      "Adds the summary to the organization as a Pipedrive note.",
      "Posts a notification to Slack.",
    ],
    youNeed: [
      "A Pipedrive account with a custom website field on organizations",
      "A ScrapingBee account or another scraping API",
      "An OpenAI API key",
      "A Slack workspace",
    ],
    staysManual: [
      "Reps review the note before relying on it in a conversation.",
      "You decide what the summary covers by editing the prompt.",
    ],
    watchOuts: [
      "Competitor names can come from the model's general knowledge rather than the website, so verify them.",
      "Check that scraping websites is allowed where you operate. The template author calls this out too.",
      "Larger models cost more per summary. Pick a model that suits your volume.",
    ],
    blueprints: ["lead-qualification-enrichment"],
  },
  {
    slug: "qualify-cold-email-replies",
    title: "Qualify Cold Email Replies and Create Pipedrive Deals",
    category: "sales-and-leads",
    summary:
      "Read replies to your cold email campaigns, detect interested leads with OpenAI and create a Pipedrive deal for them.",
    problem:
      "Replies to outbound campaigns pile up across inboxes. Interested prospects sit next to out of office messages, and deals are created late or not at all.",
    useCase:
      "An agency sends cold email from more than one inbox. Every reply from a person marked as part of a campaign is checked by OpenAI for interest in a meeting, and positive replies become deals in Pipedrive without anyone triaging the inboxes.",
    roles: ["sales", "freelancer-agency", "founder"],
    howItWorks: [
      "Watches your Gmail inboxes for new replies.",
      "Looks up the sender as a person in Pipedrive and checks their in campaign field.",
      "Asks OpenAI whether the reply shows interest in a meeting.",
      "Creates a deal in Pipedrive for interested leads.",
    ],
    youNeed: [
      "Gmail accounts for your sending inboxes",
      "A Pipedrive account with a true or false in campaign field on persons",
      "An OpenAI API key",
    ],
    staysManual: [
      "Your sales team follows up on the new deals.",
      "You decide which people count as part of a campaign.",
    ],
    watchOuts: [
      "Duplicate the Gmail node for each extra inbox and connect it the same way.",
      "Very short or ambiguous replies can be misread. Review deals created from them.",
    ],
  },
  {
    slug: "classify-lemlist-replies",
    title: "Classify lemlist Replies and Route Next Steps",
    category: "sales-and-leads",
    summary:
      "Classify every lemlist campaign reply with OpenAI, alert Slack, and handle unsubscribes and interested leads automatically.",
    problem:
      "Campaign replies need different actions: book a meeting, remove the contact or ignore an automatic reply. Sorting them by hand slows down the replies that matter.",
    useCase:
      "An outbound team connects lemlist. Each reply is sorted into interested, out of office, unsubscribe, not interested or other. Interested leads are marked in lemlist, unsubscribe requests are removed, and a readable alert lands in Slack.",
    roles: ["sales", "freelancer-agency"],
    howItWorks: [
      "Starts when lemlist reports a new email reply.",
      "OpenAI places the reply in one category: Interested, Out of office, Unsubscribe, Not interested or Other.",
      "Cleans the text so it reads well in Slack and posts an alert to your channel.",
      "Routes by category, for example unsubscribing the lead or marking them as interested in lemlist.",
    ],
    youNeed: ["A lemlist account and API key", "An OpenAI API key", "A Slack workspace and channel"],
    staysManual: [
      "Your team replies to interested leads.",
      "You can change the categories and what happens for each one.",
    ],
    watchOuts: [
      "Test the classifier on real replies before letting it unsubscribe leads automatically.",
    ],
  },
  {
    slug: "ai-web-researcher-for-sales",
    title: "AI Web Researcher for Sales Prospects",
    category: "sales-and-leads",
    summary:
      "Research a list of companies on the web with an AI agent and fill in account details such as pricing, free trial and market in Google Sheets.",
    problem:
      "Account research means opening each company's website, finding the pricing page and noting whether they sell to businesses or consumers. It takes long enough that lists rarely get fully researched.",
    useCase:
      "A sales team pastes company names or domains into a sheet. The agent searches Google, visits the relevant pages and writes back the domain, company LinkedIn URL, cheapest plan, free trial, enterprise plan, API availability and market, ready for segmentation.",
    roles: ["sales", "founder", "marketer"],
    howItWorks: [
      "Runs manually or on a schedule and reads companies from Google Sheets one row at a time.",
      "An AI agent searches Google through SerpApi and reads web pages through a scraping sub-workflow.",
      "A structured output parser formats the findings into fixed fields.",
      "Updates each row in the sheet with the results.",
    ],
    youNeed: [
      "A Google Sheet of company names or domains",
      "An OpenAI API key",
      "A SerpApi key, or ScrapingBee as the author suggests",
    ],
    staysManual: [
      "You choose what to research by editing the prompt and the output format.",
      "Reps verify details before quoting them to a prospect.",
    ],
    watchOuts: [
      "Pricing pages change often and can be hard to read. Spot check the plan data.",
      "Search and scraping requests are billed per call, so size the list before scheduling it.",
    ],
  },
  {
    slug: "sales-meeting-prep-whatsapp",
    title: "Sales Meeting Prep Briefings Sent to WhatsApp",
    category: "sales-and-leads",
    summary:
      "Before each sales meeting, research attendees from recent emails and LinkedIn activity and send a briefing to WhatsApp.",
    problem:
      "Reps join calls without remembering the last email thread or what the prospect has been posting. Preparation happens in the minutes before the call, if at all.",
    useCase:
      "A rep has a meeting coming up in Google Calendar. The workflow finds it, pulls attendee details from the invite, summarizes recent Gmail correspondence and LinkedIn activity, and sends a short briefing to the rep on WhatsApp.",
    roles: ["sales", "founder"],
    howItWorks: [
      "Checks Google Calendar on a schedule for upcoming meetings.",
      "Extracts attendee emails and LinkedIn profile URLs from the invite with an AI information extractor.",
      "Runs sub-workflows that summarize recent Gmail threads with each attendee and scrape recent LinkedIn activity through Apify.",
      "Writes a pre-meeting briefing with an AI model and sends it through WhatsApp.",
    ],
    youNeed: [
      "Google Calendar and Gmail accounts",
      "An Apify account for LinkedIn scraping",
      "An OpenAI API key",
      "A WhatsApp Business account with Cloud API access",
    ],
    staysManual: ["The rep decides how to use the briefing in the meeting."],
    watchOuts: [
      "The template expects attendee emails and LinkedIn URLs in the invite. Pull them from your CRM if they are not there.",
      "Scraping LinkedIn may conflict with LinkedIn's terms. Review this before you use it.",
      "Set the schedule to match how often you have meetings.",
    ],
  },
  {
    slug: "apollo-lead-scraper-cold-outreach",
    title: "Apollo Lead Scraper with Personalized Cold Outreach",
    category: "sales-and-leads",
    summary:
      "Describe your ideal leads in a form, scrape matching contacts from Apollo through Apify, research each company and push personalized leads into an Instantly campaign.",
    problem:
      "Building an outbound list means searching a lead database, exporting contacts, researching each company and writing an opening line for every prospect. Most of that is copy and paste.",
    useCase:
      "A founder enters a job title, company size, keywords and location. The workflow builds the Apollo search, scrapes the results, saves clean lead data to Google Sheets, researches each company with Tavily, writes an outreach message and adds the lead to Instantly.",
    roles: ["sales", "founder", "freelancer-agency"],
    howItWorks: [
      "A form collects job title, company size, keywords and location.",
      "An AI step builds the Apollo search URL, which an Apify actor scrapes.",
      "OpenAI parses each raw lead into clean fields and the lead is saved to Google Sheets.",
      "An AI agent researches the company with Tavily search.",
      "OpenAI writes a personalized outreach message and the lead is added to an Instantly campaign.",
    ],
    youNeed: [
      "An Apify account",
      "An OpenAI API key",
      "A Tavily API key",
      "An Instantly account and API key",
      "A Google Sheet for leads",
    ],
    staysManual: [
      "You review messages and campaign settings in Instantly before anything sends.",
      "You define the target audience in the form.",
    ],
    watchOuts: [
      "Scraping Apollo through a third party actor may break Apollo's terms of service. Check before using it.",
      "Verify email addresses before sending to protect your sender reputation.",
      "The author's notes list prices for these tools. Check each vendor's current pricing instead.",
    ],
    blueprints: ["linkedin-scraper-cold-outreach"],
  },
  {
    slug: "appointment-lead-follow-up",
    title: "Appointment Lead Follow-Up with Twilio and Cal.com",
    category: "sales-and-leads",
    summary:
      "Answer SMS enquiries with an AI scheduling agent that books through Cal.com, logs the chat in Airtable and follows up with leads who have not booked.",
    problem:
      "Service businesses get enquiries by text at all hours. Replies are slow, bookings take several messages, and leads who never book are not followed up.",
    useCase:
      "A repair shop receives a text asking about a laptop repair. The agent replies, then books, reschedules or cancels in Cal.com and stores the conversation in Airtable. On a schedule, open enquiries without a booking get a polite follow-up, and anyone who replies STOP is left alone.",
    roles: ["operations", "founder", "sales"],
    howItWorks: [
      "Twilio receives the customer's SMS and checks whether they asked to stop messages.",
      "Loads earlier chat history for the customer from Airtable.",
      "An AI agent talks with the customer and uses the Cal.com API to schedule, reschedule or cancel.",
      "Saves the reply to Airtable and responds by SMS.",
      "A scheduled run finds open enquiries with no appointment and no stop request, and sends an AI-written follow-up within limits you set.",
    ],
    youNeed: [
      "A Twilio account and phone number",
      "A Cal.com account and API key",
      "An Airtable base for customers and chat history",
      "An OpenAI API key",
    ],
    staysManual: [
      "You set what the agent may answer in its prompt.",
      "You decide how often and how many times to follow up.",
    ],
    watchOuts: [
      "Follow the SMS consent and opt out rules in your country. Keep the STOP handling in place.",
      "The example prompt is written for a fictional repair company. Rewrite it for your business.",
    ],
  },
  {
    slug: "qualify-appointment-requests",
    title: "Qualify Appointment Requests with AI Forms",
    category: "sales-and-leads",
    summary:
      "Screen meeting requests with an AI classifier in a multi-step form and send worthwhile ones to an admin for approval.",
    problem:
      "Open booking links fill calendars with calls that did not need a meeting. Screening requests by hand means reading every enquiry and emailing back and forth.",
    useCase:
      "A consultant replaces a plain booking link with a form. The AI decides whether the enquiry is relevant, relevant requesters accept terms and pick a date, they get an acknowledgement email, and the consultant gets an email with confirm and decline buttons before anything reaches the calendar.",
    roles: ["founder", "freelancer-agency", "sales"],
    howItWorks: [
      "A form collects the enquiry and an AI text classifier decides whether it needs a meeting.",
      "Relevant requests continue to further form pages for terms and a preferred date and time.",
      "The requester gets an acknowledgement email while an approval request goes to the admin in a separate run.",
      "Gmail's send and wait for approval step pauses until the admin confirms or declines.",
      "Confirmed requests are added to Google Calendar.",
    ],
    youNeed: ["Gmail and Google Calendar accounts", "An OpenAI API key"],
    staysManual: [
      "The admin approves or declines every request.",
      "You define what counts as a relevant enquiry.",
    ],
    watchOuts: [
      "The classifier turns away enquiries it judges irrelevant. Review its decisions early so good leads are not lost.",
    ],
  },

  // Customer Support
  {
    slug: "slack-support-to-linear-tickets",
    title: "Turn Slack Support Messages into Linear Tickets",
    category: "customer-support",
    summary:
      "Turn Slack messages tagged with a ticket emoji into Linear issues with an AI-written title, summary and priority.",
    problem:
      "Support requests arrive in Slack and get lost in the scroll. Someone has to copy each one into the issue tracker, and the same request is sometimes filed twice.",
    useCase:
      "A product team asks people to add the ticket emoji to any Slack message that needs help. On each scheduled run the workflow finds those messages, skips any already filed, and creates a Linear issue with a descriptive title, an actionable summary and a priority based on the message.",
    roles: ["operations", "developer", "founder"],
    howItWorks: [
      "Runs on a schedule and searches your support channel for messages with the ticket emoji.",
      "Checks Linear for an issue that already contains the Slack message ID.",
      "Sends new messages to an AI model to write the title, summary and priority.",
      "Creates the issue in your Linear team, including the message ID so it is not filed again.",
    ],
    youNeed: [
      "A Slack workspace with an app that can search your support channel",
      "A Linear workspace with API access",
      "An OpenAI API key",
    ],
    staysManual: [
      "People choose which messages become tickets by adding the emoji.",
      "Your team triages and resolves the issues in Linear.",
    ],
    watchOuts: [
      "Set the Slack channel and Linear team in the nodes the template marks as required.",
      "Every run calls Slack and Linear, so pick a schedule that stays within their API limits.",
    ],
    blueprints: ["slack-linear-support-ticketing"],
  },
  {
    slug: "support-issue-sentiment-tracking",
    title: "Track Sentiment on Active Support Issues",
    category: "customer-support",
    summary:
      "Analyze the mood of comments on active Linear issues, track changes in Airtable and alert Slack when an issue turns negative.",
    problem:
      "Support leads notice a frustrated customer only after the thread has gone badly. Nobody has time to reread every active issue.",
    useCase:
      "A support team keeps customer issues in Linear. On a schedule the workflow reads recently updated issues, rates the sentiment of the conversation, stores current and previous sentiment in Airtable, and posts to Slack when an issue moves from non-negative to negative.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Queries Linear's GraphQL API on a schedule for recently updated active issues.",
      "An AI information extractor rates the sentiment of each issue's comments.",
      "Creates or updates a row in Airtable, moving the old value into a previous sentiment column.",
      "An Airtable trigger watches for changes and sends a Slack alert when an issue turns negative.",
    ],
    youNeed: [
      "A Linear workspace with API access",
      "An Airtable base for tracking sentiment",
      "An OpenAI API key",
      "A Slack workspace",
    ],
    staysManual: ["A person reviews flagged issues and decides how to step in."],
    watchOuts: [
      "Sentiment is a signal, not a verdict. Short technical comments can read as negative.",
    ],
    blueprints: ["customer-support-triage"],
  },
  {
    slug: "classify-linear-bugs",
    title: "Classify New Linear Bugs and Route to the Right Team",
    category: "customer-support",
    summary:
      "Read new bug tickets in Linear, let OpenAI choose the responsible team from your descriptions and move the ticket to that team.",
    problem:
      "Bugs land in a general queue and wait until someone who knows every team's scope routes them. Misrouted bugs bounce between teams.",
    useCase:
      "An engineering team files all bugs into one general Linear team. When a labelled bug with a description arrives, OpenAI compares it with each team's areas of responsibility, the workflow moves it to the best match and a message goes to Slack.",
    roles: ["developer", "operations"],
    howItWorks: [
      "A Linear trigger fires for new tickets in your general team that have the bug label and a description.",
      "A setup node holds your teams and their areas of responsibility.",
      "OpenAI decides which team should own the bug.",
      "The ticket moves to that team in Linear and a message is sent to your Slack channel.",
    ],
    youNeed: ["A Linear workspace", "An OpenAI API key", "A Slack workspace"],
    staysManual: [
      "You write each team's areas of responsibility.",
      "Teams can move a ticket back if the choice is wrong.",
    ],
    watchOuts: ["Team names in the setup node must match the names in Linear exactly."],
    blueprints: ["customer-support-triage"],
  },
  {
    slug: "jira-issue-resolution-assistant",
    title: "Resolve Long-Running Jira Support Issues with AI",
    category: "customer-support",
    summary:
      "Review unresolved Jira issues on a schedule, classify their state with AI, and remind, close or try to answer them from your knowledge base.",
    problem:
      "Support tickets stall for days waiting on a reply from the customer or the team. Chasing them one by one is repetitive work.",
    useCase:
      "A support team runs the workflow on a schedule. For each issue left unresolved longer than you allow, it reads the comment thread and decides whether the issue is resolved, waiting for more information or still waiting. Resolved threads get a sentiment check, and stuck ones get a reminder or an answer drawn from your Notion knowledge base.",
    roles: ["operations", "developer"],
    howItWorks: [
      "Searches Jira on a schedule for long-running unresolved issues and processes each one separately.",
      "Fetches the issue's comments and combines them into one thread for the AI.",
      "A text classifier labels the state: resolved, pending more information or still waiting.",
      "Resolved issues get a sentiment check that decides between asking for a review and escalating.",
      "Other issues get a reminder, or a knowledge base agent searches Notion for an answer.",
    ],
    youNeed: [
      "A Jira Software Cloud account",
      "A Notion knowledge base",
      "An OpenAI API key",
      "A Slack workspace",
    ],
    staysManual: [
      "You define how long an issue can stay open before it counts as long-running.",
      "People handle escalations.",
    ],
    watchOuts: [
      "Check the agent's answers before letting it post on customer-facing issues.",
      "The knowledge base agent is told to answer only from retrieved documents. Keep that instruction.",
    ],
    blueprints: ["customer-support-triage"],
  },
  {
    slug: "woocommerce-support-agent",
    title: "WooCommerce Customer Support Agent",
    category: "customer-support",
    summary:
      "A website chat agent that answers customers' questions about their own WooCommerce orders and shipping status.",
    problem:
      "Many store support messages ask where an order is. Staff look up each order and the carrier's tracking page by hand.",
    useCase:
      "A clothing shop embeds the chat on its website. A logged in customer asks about a recent order, and the agent finds their WooCommerce account, reads their past orders and checks DHL tracking to answer, without exposing anyone else's data.",
    roles: ["operations", "founder"],
    howItWorks: [
      "A chat widget on your website sends messages along with the customer's email, encrypted by your backend.",
      "The workflow decrypts the email so customers can only look up their own orders.",
      "An AI agent uses tools to find the WooCommerce user, fetch their orders and query DHL tracking.",
      "The agent replies in the chat following the system message you write for your shop.",
    ],
    youNeed: [
      "A WooCommerce store with API access",
      "A DHL API account, or another carrier's API",
      "An OpenAI API key",
      "A way to encrypt the customer's email on your website backend",
    ],
    staysManual: [
      "Refunds, order changes and complaints still go to your team.",
      "You write the agent's system message, including your shop's name.",
    ],
    watchOuts: [
      "Keep the email encryption step in production. Without it, anyone could ask about other customers' orders.",
      "Self-hosted instances must allow the built-in crypto module, as the author notes.",
    ],
  },
  {
    slug: "whatsapp-business-rag-chatbot",
    title: "WhatsApp Business Chatbot Grounded in Your Documents",
    category: "customer-support",
    summary:
      "A WhatsApp Business chatbot that answers customer questions from your own documents stored in Google Drive.",
    problem:
      "Customers ask product and troubleshooting questions on WhatsApp. Staff answer the same questions again and again, and generic bots give wrong answers.",
    useCase:
      "An electronics store loads its product guides from Google Drive into a vector database. When a customer asks a question on WhatsApp, the AI agent searches those documents and replies with an answer based on them.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Creates a Qdrant collection and loads documents from Google Drive, split and embedded with OpenAI.",
      "A webhook verifies your endpoint with Meta and receives incoming WhatsApp messages.",
      "Checks that each incoming event contains a user message.",
      "An AI agent with memory searches the Qdrant collection and replies through WhatsApp.",
    ],
    youNeed: [
      "A Meta developer app with the WhatsApp Cloud API",
      "A Qdrant instance",
      "A Google Drive folder with your documents",
      "An OpenAI API key",
    ],
    staysManual: [
      "You choose which documents the bot can use.",
      "Orders, refunds and sensitive requests should go to a person.",
    ],
    watchOuts: [
      "WhatsApp limits when a business can send free-form replies. Check Meta's messaging rules for your use case.",
      "Use the same URL for the verify and respond webhooks, one for GET and one for POST, as the notes explain.",
    ],
  },
  {
    slug: "ecommerce-email-routing",
    title: "Route eCommerce Emails with an AI Classifier",
    category: "customer-support",
    summary:
      "Classify contact form messages as quote requests, product questions, problems or orders and email each to the right team.",
    problem:
      "Every contact form message lands in one inbox. Someone has to read and forward each one before the right person can reply.",
    useCase:
      "An online store sends its website contact form through the workflow. The AI classifier sorts each message into Request Quote, Product info, General problem or Order, emails it to the matching department and logs it in Google Sheets.",
    roles: ["operations", "founder"],
    howItWorks: [
      "A form, or a webhook from a website form plugin, receives the message.",
      "An AI text classifier assigns one of the categories.",
      "Each category sends an email to its team.",
      "The submission is saved to Google Sheets.",
    ],
    youNeed: [
      "An SMTP email account, or swap in the Gmail or Outlook nodes",
      "A Google Sheet for logging",
      "An OpenAI API key",
    ],
    staysManual: ["Each team writes its own reply."],
    watchOuts: ["Add an other category for messages that fit none of the defaults."],
  },

  // Email & Admin
  {
    slug: "gmail-draft-replies",
    title: "Draft Gmail Replies to Incoming Emails",
    category: "email-and-admin",
    summary:
      "Check each incoming Gmail message, decide whether it needs a reply, and save an AI-written draft in the thread.",
    problem:
      "Writing routine replies eats the day, but letting AI send email on its own is risky. Most people want a head start, not an automatic sender.",
    useCase:
      "A founder connects their inbox. When an email arrives, the AI first decides whether it needs a response. If it does, it writes a reply and saves it as a draft in the same conversation, ready to edit and send.",
    roles: ["founder", "freelancer-agency", "operations"],
    howItWorks: [
      "A Gmail trigger picks up new messages.",
      "An AI chain assesses whether the message needs a reply.",
      "If it does, a second AI chain writes a reply from the subject and message.",
      "The reply is saved as a Gmail draft in the conversation.",
    ],
    youNeed: ["A Gmail account", "An OpenAI API key"],
    staysManual: ["Nothing is sent. You review and send every draft."],
    watchOuts: [
      "Add your tone and key business facts to the reply prompt, or drafts will read as generic.",
    ],
  },
  {
    slug: "human-in-the-loop-email-replies",
    title: "Human-in-the-Loop Email Replies with AI",
    category: "email-and-admin",
    summary:
      "Summarize incoming emails, draft a reply with your business information, and send it only after a person approves.",
    problem:
      "Teams want faster email replies but cannot let AI send unchecked messages to customers.",
    useCase:
      "A small business connects a shared mailbox over IMAP. Each email is summarized, an agent writes a short professional reply, and the draft goes to a reviewer who approves it before it is sent over SMTP.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Reads new emails over IMAP and converts them to Markdown.",
      "A summarization chain condenses the email.",
      "An AI agent writes the reply, designed to draw on business information from a vector database.",
      "The draft is sent to a reviewer for approval.",
      "Approved replies are sent to the original sender over SMTP.",
    ],
    youNeed: [
      "An email account with IMAP and SMTP access",
      "An OpenAI API key",
      "A vector store with your business information",
    ],
    staysManual: ["A reviewer approves every reply before it is sent."],
    watchOuts: [
      "Connect a vector store tool to the agent so replies use real business information instead of guesses.",
      "The reply prompt keeps answers short. Adjust it if your replies need more detail.",
    ],
  },
  {
    slug: "gmail-auto-labelling",
    title: "Auto-Label Incoming Gmail Messages",
    category: "email-and-admin",
    summary:
      "Let AI read each new Gmail message and apply the labels that fit, such as Partnership, Inquiry or Notification.",
    problem:
      "Inboxes mix partnership offers, customer questions and automated notifications. Filters based on sender or keywords miss most of them.",
    useCase:
      "An agency owner wants partnership requests kept apart from notifications. The workflow reads each new email, the AI picks from the labels you define, and those labels are applied in Gmail so the inbox is sorted before you open it.",
    roles: ["founder", "freelancer-agency", "operations"],
    howItWorks: [
      "A Gmail trigger polls for new messages.",
      "Fetches the full message content.",
      "An AI chain assigns labels using a JSON schema of allowed label names.",
      "Matches the AI labels to the label IDs in your Gmail account and adds them to the message.",
    ],
    youNeed: ["A Gmail account with the labels already created", "An OpenAI API key"],
    staysManual: ["You define the labels and the instructions for each one."],
    watchOuts: [
      "Label names must match exactly in Gmail, the system prompt and the JSON schema.",
      "Set the polling interval to how quickly you need emails sorted.",
    ],
  },
  {
    slug: "outlook-email-assistant",
    title: "Outlook Email Assistant with Monday and Airtable Context",
    category: "email-and-admin",
    summary:
      "Categorize and prioritize Outlook emails with an AI agent that knows your clients and suppliers from Monday.com and your rules from Airtable.",
    problem:
      "Priority depends on who sent the email. Generic rules cannot tell a key client from a cold pitch, so important messages get buried.",
    useCase:
      "An operations manager uses Microsoft Outlook for business. On a schedule, unflagged and uncategorized emails are cleaned up and passed to an AI agent along with contacts from Monday.com and categories and rules from Airtable. The agent sets the category and importance in Outlook.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Fetches Outlook emails that are not flagged and have no category.",
      "Strips HTML and clutter from each email.",
      "Loads categories, rules and delete rules from Airtable, and supplier and client contacts from Monday.com.",
      "An AI agent categorizes and prioritizes the email, matching the sender to known contacts.",
      "Updates the category and importance in Outlook.",
    ],
    youNeed: [
      "Microsoft Outlook for business",
      "A Monday.com board with contacts, or another CRM",
      "An Airtable base for rules and categories",
      "An OpenAI API key",
    ],
    staysManual: [
      "You maintain the rules and categories in Airtable.",
      "You decide what happens to each category.",
    ],
    watchOuts: [
      "Review delete rules carefully before enabling any deletion.",
      "The contact list refreshes on its own schedule. Run it more often if your contacts change quickly.",
    ],
  },
  {
    slug: "emails-to-notion-tasks",
    title: "Turn Emails into Tasks in Notion",
    category: "email-and-admin",
    summary:
      "Forward emails to turn them into actionable Notion tasks with AI summaries, with a route for each user managed in Airtable.",
    problem:
      "Action items hide inside email threads. Copying them into a task manager is tedious, so tasks get forgotten.",
    useCase:
      "A team forwards emails to a shared Gmail address. The workflow finds the user's route in Airtable, AI agents write a short task title, a description and a detailed summary, and a page is created in that user's Notion database with details to find the original email.",
    roles: ["operations", "founder", "freelancer-agency"],
    howItWorks: [
      "A Gmail trigger checks for new messages and skips ones already processed, using labels.",
      "Reads the route from the receiving address and loads that route's settings from Airtable.",
      "One AI agent creates an actionable task and another writes a summary and email metadata.",
      "Builds a custom request that creates a page in the user's Notion database.",
      "Labels the email as processed, or emails the sender an error with suggestions to fix it.",
    ],
    youNeed: [
      "A Gmail account that receives forwarded emails",
      "An Airtable base for routes",
      "Notion access for each user",
      "An OpenAI API key",
    ],
    staysManual: [
      "Users decide which emails to forward.",
      "You manage routes and access in Airtable.",
    ],
    watchOuts: [
      "Follow the setup steps to copy the Gmail label IDs into the globals node before activating.",
    ],
  },

  // Marketing & Content
  {
    slug: "brand-voice-blog-writer",
    title: "Write Blog Posts in Your Brand Voice for WordPress",
    category: "marketing-and-content",
    summary:
      "Learn your brand voice from existing articles, then generate new on-brand blog posts in WordPress.",
    problem:
      "AI-written posts sound generic. A consistent voice usually means writing long style guides or heavily editing every draft.",
    useCase:
      "A marketing team points the workflow at its company blog. AI studies recent posts for structure and voice, then writes a new article in the same style from your instruction and saves it to WordPress for editing.",
    roles: ["marketer", "freelancer-agency", "founder"],
    howItWorks: [
      "Fetches recent posts from an existing blog and converts the HTML to Markdown.",
      "An AI chain captures the article structure and layout.",
      "An information extractor identifies voice traits such as tone, style and word choice.",
      "A content generation step writes a new article that follows those guidelines.",
      "Saves the article to WordPress.",
    ],
    youNeed: [
      "Existing content with a consistent voice",
      "A WordPress site with API access",
      "An OpenAI API key",
    ],
    staysManual: [
      "Save posts as drafts so an editor approves them before publishing.",
      "You choose the topic and instruction for each article.",
    ],
    watchOuts: [
      "Results depend on how good and consistent the sample content is.",
      "Fact check every draft. Matching a voice does not make the claims accurate.",
    ],
    blueprints: ["content-automation"],
  },
  {
    slug: "perplexity-research-to-html",
    title: "Turn Perplexity Research into Publish-Ready HTML",
    category: "marketing-and-content",
    summary:
      "Send a topic, research it with Perplexity, and get back a styled HTML article page.",
    problem:
      "Turning research into a readable page means gathering sources, writing, formatting and styling. That is several tools and hours for one article.",
    useCase:
      "A content marketer calls the webhook with a topic. The workflow improves the prompt, runs Perplexity research through an agent tool, writes the article and returns it as a responsive HTML page styled with Tailwind CSS.",
    roles: ["marketer", "freelancer-agency"],
    howItWorks: [
      "A webhook receives the topic.",
      "An AI step rewrites the topic into a fuller research prompt.",
      "An agent calls a Perplexity research sub-workflow.",
      "AI steps write the article and extract it as structured JSON.",
      "Another AI step builds a single HTML page with Tailwind CSS classes and returns it. Telegram nodes are included for delivery.",
    ],
    youNeed: [
      "A Perplexity API key",
      "An OpenAI API key",
      "A Telegram bot, if you use the Telegram nodes",
    ],
    staysManual: ["Review the sources and facts before publishing the page."],
    watchOuts: [
      "Research tools can still return outdated or wrong facts. Check the citations.",
      "Secure the webhook before exposing it publicly.",
    ],
    blueprints: ["content-automation"],
  },
  {
    slug: "branded-linkedin-posts",
    title: "Create and Schedule Branded LinkedIn Posts",
    category: "marketing-and-content",
    summary:
      "Research topics with Perplexity, write LinkedIn posts in your voice, generate a branded image and publish on a schedule.",
    problem:
      "Posting consistently on LinkedIn takes research, writing and design every week, and most founders and marketers fall behind.",
    useCase:
      "A founder sets a brand style reference image and describes their voice in the prompt. On a schedule the workflow reviews past ideas in Google Sheets, researches a new topic, writes the post, creates a matching image and saves everything to the sheet. On posting days it picks a ready post and publishes it to LinkedIn.",
    roles: ["founder", "marketer", "freelancer-agency"],
    howItWorks: [
      "Pulls past post ideas from Google Sheets so topics do not repeat.",
      "Researches current topics with Perplexity.",
      "An AI agent writes the post copy and an image description in your brand voice.",
      "Creates a branded image with OpenAI's image model, guided by a reference image in Google Drive.",
      "Saves the post and image link to Google Sheets, and a second schedule publishes a ready post to LinkedIn.",
    ],
    youNeed: [
      "Google Sheets and Google Drive",
      "An Anthropic or OpenAI API key for writing",
      "An OpenAI API key for images",
      "A Perplexity API key",
      "A connected LinkedIn account",
    ],
    staysManual: [
      "You set the voice, niche and posting schedule.",
      "Review queued posts in the sheet before they publish.",
    ],
    watchOuts: [
      "Posts publish without a final check unless you add an approval step.",
      "The generated images follow your reference image, so keep it on brand.",
    ],
    blueprints: ["content-automation"],
  },
  {
    slug: "competitor-ad-creative-generator",
    title: "Competitor Ad Analysis and Creative Variations",
    category: "marketing-and-content",
    summary:
      "Pull competitors' active image ads from the Meta Ad Library, describe them with AI vision and generate new variations for your brand.",
    problem:
      "Creative teams study competitor ads by screenshotting the Ad Library, then brief designers from scratch. Research rarely turns into variations you can test.",
    useCase:
      "A performance marketer searches the Ad Library for a competitor. The workflow scrapes active ads through Apify, saves each image in its own Google Drive folder, describes it in detail, writes three style change requests and generates new versions with OpenAI image editing, logging everything in Google Sheets.",
    roles: ["marketer", "freelancer-agency"],
    howItWorks: [
      "A first run creates the Google Sheet and the parent Google Drive folder.",
      "An Apify actor scrapes active ads from your Ad Library search. Ads without images are filtered out and a limit controls the batch size.",
      "Creates source and variation folders for each ad and saves the original image.",
      "OpenAI vision describes the ad and an AI step writes style variation prompts.",
      "OpenAI image editing creates each variation, which is uploaded to Google Drive and logged in Google Sheets.",
    ],
    youNeed: [
      "An Apify account",
      "An OpenAI API key with image generation access",
      "Google Drive and Google Sheets",
    ],
    staysManual: [
      "You choose the competitors and search terms to track.",
      "Your team decides which variations are on brand and worth testing.",
    ],
    watchOuts: [
      "Do not copy competitors' trademarks, product claims or protected designs into your ads.",
      "Image generation cost grows with every variation. Keep the batch limit low while testing.",
    ],
    blueprints: ["competitor-ad-creative-intelligence"],
  },
  {
    slug: "youtube-channel-strategist",
    title: "YouTube Channel Strategist",
    category: "marketing-and-content",
    summary:
      "Study what works in your YouTube niche, from video titles to thumbnails, and collect the insights in Google Sheets.",
    problem:
      "Creators guess at titles and thumbnails. Researching what top channels in a niche do is slow, manual and quickly out of date.",
    useCase:
      "A creator or agency sets a broad niche, a specific niche and their own channel. On separate schedules the workflow scrapes niche videos through Apify, an AI agent pulls out the words that make titles clickable, a vision model explains why thumbnails get attention, and the findings go into Google Sheets.",
    roles: ["marketer", "freelancer-agency"],
    howItWorks: [
      "Scheduled runs collect broad niche and specific niche insights, and a form lets you test individual channels.",
      "Apify scrapers fetch YouTube channel and video data.",
      "An AI agent analyzes video titles for the words and phrases that make them compelling.",
      "An OpenAI vision step analyzes thumbnails for what grabs attention.",
      "Results are sorted and saved to the author's Google Sheet template, with Slack available for updates.",
    ],
    youNeed: [
      "An Apify account",
      "An OpenRouter API key, plus an OpenAI API key for image analysis",
      "A copy of the author's Google Sheet template",
      "A Slack workspace, optional",
    ],
    staysManual: [
      "You choose the niches and channels to study.",
      "Content decisions stay with the creator.",
    ],
    watchOuts: [
      "After copying the sheet, link every Google Sheets node to the correct tab.",
      "Scraping volume drives Apify cost. Start with a narrow niche.",
    ],
  },
  {
    slug: "seo-seed-keywords",
    title: "Generate SEO Seed Keywords",
    category: "marketing-and-content",
    summary: "Generate a focused list of SEO seed keywords from your ideal customer profile.",
    problem:
      "Keyword research often starts with tools and volume lists instead of the customer, so teams target terms their buyers never search for.",
    useCase:
      "A marketer fills in the ideal customer profile. An AI agent works through the customer's needs, challenges and goals and returns broad head terms to plan content around, which you send to your own sheet or database.",
    roles: ["marketer", "founder"],
    howItWorks: [
      "You set your ideal customer profile in the workflow.",
      "An AI agent analyzes the profile and drafts seed keywords that are broad but relevant.",
      "The keywords are formatted for output.",
      "You connect your own Google Sheet, Airtable base or database to store them.",
    ],
    youNeed: [
      "A clear ideal customer profile",
      "An Anthropic or OpenAI API key",
      "A Google Sheet, Airtable base or database for the results",
    ],
    staysManual: [
      "Check the keywords in a search volume tool before building a content plan.",
    ],
    watchOuts: [
      "The model does not see search data. Treat the output as a starting list, not proof of demand.",
    ],
  },
  {
    slug: "website-faq-enrichment",
    title: "Add FAQ Sections to Website Pages at Scale",
    category: "marketing-and-content",
    summary:
      "Generate consistent FAQ sections for many service or category pages from a Google Sheet, with AI completing the answers.",
    problem:
      "Sites with many service pages need FAQ sections for visitors and search, but writing them page by page is slow and inconsistent.",
    useCase:
      "A software marketing team lists each integration or category in a Google Sheet. The workflow builds standard questions about setup, permissions, integrations, use cases and pricing benefits, has AI complete the answers where needed, saves JSON schema files to Google Drive and marks each row done.",
    roles: ["marketer", "developer"],
    howItWorks: [
      "Reads services or categories from a Google Sheet.",
      "Builds a set of standard questions and answers from templates.",
      "An AI chain completes or improves selected answers.",
      "Formats FAQ schema JSON and uploads it to Google Drive folders by type.",
      "Updates the status in the sheet. You finish the last step that sends content to WordPress, Webflow, Strapi or another CMS.",
    ],
    youNeed: [
      "A Google Sheet of services or categories",
      "Google Drive folders for the output",
      "An OpenAI API key",
      "A CMS such as WordPress, Webflow or Strapi",
    ],
    staysManual: [
      "You write the predefined answers and approve what AI adds.",
      "Publishing to your CMS is a step you complete.",
    ],
    watchOuts: [
      "Check pricing and permission answers against your real product before publishing.",
    ],
  },
  {
    slug: "instagram-posts-from-trends",
    title: "Instagram Posts from Trending Topics",
    category: "marketing-and-content",
    summary:
      "Find trending Instagram posts for a hashtag, create a new image and caption from the idea, and publish to your business account.",
    problem:
      "Keeping an Instagram account active means constantly finding ideas and producing images. Small teams cannot keep up.",
    useCase:
      "A design studio tracks hashtags in its niche. The workflow scrapes top posts, skips ideas already used, describes the image, writes a caption, generates a new image, publishes it to Instagram and sends a Telegram message when it is live.",
    roles: ["marketer", "freelancer-agency"],
    howItWorks: [
      "Fetches top posts for your hashtags through a RapidAPI Instagram scraper.",
      "Keeps image posts and checks a Postgres table so the same idea is not reused.",
      "OpenAI describes the image and writes a caption.",
      "Generates a new image through Replicate.",
      "Publishes to Instagram through the Facebook Graph API and notifies you on Telegram.",
    ],
    youNeed: [
      "An Instagram business account connected to the Facebook Graph API",
      "A RapidAPI key",
      "A Replicate token",
      "A Postgres database with the table from the author's notes",
      "An OpenAI API key",
      "A Telegram bot",
    ],
    staysManual: ["Add a review step if you do not want posts to publish automatically."],
    watchOuts: [
      "Recreating other creators' work can raise copyright issues. Use trends for inspiration, not copies.",
      "The example hashtags come from the author's niche. Change them to yours.",
    ],
  },

  // Research & Analysis
  {
    slug: "competitor-research-agent",
    title: "Competitor Research Agent with Exa and Notion",
    category: "research-and-analysis",
    summary:
      "Find similar companies with Exa, research each one with three AI agents and compile the report into a Notion database.",
    problem:
      "Competitive research means repeating the same searches for every rival: company background, pricing and reviews. It is rarely kept up to date.",
    useCase:
      "A founder enters their company. Exa's find similar search returns competitors, and for each one the agents collect a company and funding overview, the product and pricing offering, and customer reviews. The combined report is saved to Notion.",
    roles: ["founder", "marketer", "operations"],
    howItWorks: [
      "You set your company in the required node and run the workflow.",
      "Exa's find similar search returns a list of competitors.",
      "A loop handles competitors one at a time so one failure does not stop the whole run.",
      "Three agents research the company overview, product offering and customer reviews using SerpApi and a web scraping tool.",
      "The agents' findings are combined into a report and added to a Notion table.",
    ],
    youNeed: ["An Exa API key", "A SerpApi key", "An OpenAI API key", "A Notion database"],
    staysManual: [
      "You review the report before it informs pricing or positioning decisions.",
    ],
    watchOuts: [
      "Funding and review figures found online can be outdated or wrong. Check the sources.",
      "The template runs manually. Add a schedule if you want regular updates.",
    ],
    blueprints: ["competitor-intelligence-gathering"],
  },
  {
    slug: "google-analytics-weekly-report",
    title: "Weekly Google Analytics Report by Email and Telegram",
    category: "research-and-analysis",
    summary:
      "Each week, compare the last seven days of Google Analytics data with the same days last year and send an AI-written report by email and Telegram.",
    problem:
      "Opening analytics dashboards every week and writing up what changed is easy to skip, so stakeholders go without a regular view of traffic.",
    useCase:
      "A marketing lead gets a report on Monday morning. The workflow pulls key metrics, compares them with the same week last year, has AI build a table with percentage changes and a short analysis, emails it, and sends a shorter version to Telegram.",
    roles: ["marketer", "founder", "operations"],
    howItWorks: [
      "A schedule trigger starts the run each week.",
      "Fetches and summarizes the last seven days of Google Analytics data.",
      "Fetches and summarizes the same seven days from the previous year.",
      "OpenAI builds a table of the changes with a brief analysis.",
      "Sends the report by email and a shorter text version to Telegram.",
    ],
    youNeed: [
      "A Google Analytics property with API access",
      "An OpenAI API key",
      "An SMTP email account",
      "A Telegram bot, optional",
    ],
    staysManual: ["People decide what to do based on the report."],
    watchOuts: [
      "Some node names in the template are in German. Rename them if that helps your team.",
      "A year on year comparison needs a property that already has data from last year.",
    ],
    blueprints: ["content-performance-analytics"],
  },
  {
    slug: "trustpilot-review-sentiment",
    title: "Trustpilot Review Scraping and Sentiment Analysis",
    category: "research-and-analysis",
    summary:
      "Scrape a company's Trustpilot reviews, extract each review with AI, score its sentiment and save new ones to Google Sheets.",
    problem:
      "Reading reviews across many pages to spot patterns is slow, so reviews about you or a competitor go unanalyzed.",
    useCase:
      "A product marketer enters a company name registered on Trustpilot and how many pages to scrape. The workflow pulls the review pages, extracts review details, skips reviews already saved, rates sentiment and adds rows to a Google Sheet for analysis.",
    roles: ["marketer", "founder"],
    howItWorks: [
      "You set the Trustpilot company name and the maximum number of pages to scrape.",
      "Fetches the review pages over HTTP.",
      "An information extractor powered by DeepSeek pulls out each review.",
      "Checks the sheet for reviews that are already saved.",
      "Runs sentiment analysis with OpenAI and adds the results to Google Sheets.",
    ],
    youNeed: [
      "A DeepSeek API key, configured as an OpenAI-compatible model",
      "An OpenAI API key",
      "A Google Sheet",
    ],
    staysManual: ["You interpret the trends and decide what to do about them."],
    watchOuts: [
      "Check Trustpilot's terms before scraping.",
      "Change the base URL for DeepSeek as the template notes explain.",
    ],
  },
  {
    slug: "news-monitoring-slack-alerts",
    title: "Monitor News Feeds and Alert Slack on Relevant Stories",
    category: "research-and-analysis",
    summary:
      "Watch RSS feeds for the topics you care about, summarize relevant articles and post them to Slack.",
    problem:
      "Keeping up with an industry means scanning feeds every day, and most articles are not relevant. Useful news reaches the team late.",
    useCase:
      "An analyst follows AI and data news. On a schedule the workflow reads feeds listed in Google Sheets, classifies each article as relevant or not, fetches the full text of relevant ones through Jina AI, summarizes it in Slack formatting and posts it to a channel.",
    roles: ["operations", "marketer", "founder"],
    howItWorks: [
      "Reads your list of RSS feed URLs from Google Sheets.",
      "Reads new articles from each feed.",
      "An AI classifier labels each article as relevant or not relevant to your topics.",
      "Fetches the full article as Markdown through Jina AI.",
      "An AI model summarizes it in Slack formatting and posts it to your channel.",
    ],
    youNeed: [
      "A Google Sheet of RSS feed URLs",
      "An OpenAI API key",
      "Access to the Jina AI reader",
      "A Slack workspace",
    ],
    staysManual: ["You define the relevant topics in the classifier descriptions."],
    watchOuts: ["Summaries can miss nuance. Include a link to the original article in every post."],
  },
  {
    slug: "deep-research-agent",
    title: "Self-Hosted Deep Research Agent",
    category: "research-and-analysis",
    summary:
      "A research agent you host yourself that asks clarifying questions, runs repeated web searches and writes a report to Notion.",
    problem:
      "Hosted deep research tools are useful, but you cannot control the sources, the depth or where the report goes.",
    useCase:
      "A strategy lead submits a research question through a form. The agent asks follow-up questions, then searches and scrapes in loops using AI-generated sub-queries to the depth and breadth you choose, gathers what it learns and writes a full report into a Notion page.",
    roles: ["founder", "operations", "developer"],
    howItWorks: [
      "A form collects the question and how deep and broad the research should go.",
      "AI writes clarifying questions that are shown in follow-up forms.",
      "Creates an empty report page in Notion and starts the research as a separate background run.",
      "Generates search queries, searches and scrapes pages through Apify, and records what it learns on each loop.",
      "Writes the final report into the Notion page.",
    ],
    youNeed: [
      "An Apify account",
      "An OpenAI API key",
      "A Google Gemini API key, which the template also uses",
      "A Notion database for reports",
    ],
    staysManual: ["You review the report and its sources before acting on it."],
    watchOuts: [
      "Deeper and broader research multiplies searches, scrapes and model calls. Start small.",
      "This is a large workflow. Test it on a simple question first.",
    ],
  },
  {
    slug: "customer-feedback-sentiment",
    title: "Customer Feedback Sentiment Classifier",
    category: "research-and-analysis",
    summary:
      "Collect customer feedback through a form, classify its sentiment with OpenAI and log it in Google Sheets.",
    problem:
      "Feedback forms produce a pile of text that nobody tags, so negative feedback sits unread next to praise.",
    useCase:
      "A small business shares a feedback form. Each submission is classified by sentiment and saved with the original answers to a Google Sheet, so the team can filter for unhappy customers.",
    roles: ["operations", "founder", "marketer"],
    howItWorks: [
      "A form collects customer feedback.",
      "OpenAI classifies the sentiment of the feedback text.",
      "Merges the form answers with the result.",
      "Adds a row to Google Sheets.",
    ],
    youNeed: ["An OpenAI API key", "A Google Sheet, such as a copy of the author's example"],
    staysManual: ["Someone follows up with customers who left negative feedback."],
    watchOuts: [
      "Spell out the sentiment labels you want in the prompt so results stay consistent.",
    ],
  },
  {
    slug: "form-feedback-summary-report",
    title: "Summarize Form Feedback into an Email Report",
    category: "research-and-analysis",
    summary:
      "Summarize all responses to a feedback form with OpenAI and email the report as formatted HTML.",
    problem:
      "Survey responses are collected but rarely read in full, and writing a summary for the team takes hours.",
    useCase:
      "After an event survey closes, the organizer runs the workflow. It groups all answers by question, asks OpenAI for an overall analysis, converts the result to HTML and emails the report.",
    roles: ["operations", "marketer", "founder"],
    howItWorks: [
      "Reads responses from a Google Sheet linked to Google Forms.",
      "Combines all answers for each question.",
      "OpenAI writes a summary report in Markdown.",
      "Converts it to HTML and sends it with Gmail.",
    ],
    youNeed: ["A Google Sheet of form responses", "An OpenAI API key", "A Gmail account"],
    staysManual: ["People decide what to change based on the report."],
    watchOuts: [
      "Very long forms or many responses may need splitting into smaller batches, as the author notes.",
    ],
  },

  // Documents & Finance
  {
    slug: "invoice-data-extraction",
    title: "Extract Invoice Data from Email into Google Sheets",
    category: "documents-and-finance",
    summary:
      "Watch Gmail for supplier invoices, parse the PDF with LlamaParse, extract the fields with AI and add them to Google Sheets.",
    problem:
      "Invoices arrive as email attachments, and someone types the date, number, supplier and line items into a spreadsheet or accounting tool.",
    useCase:
      "A finance assistant receives invoices from a supplier. Each email with an attachment is picked up, the PDF is parsed with its tables intact, AI extracts fields such as invoice date, invoice number, purchase order and supplier details, the data is added to a sheet and the email is labelled as synced.",
    roles: ["operations", "founder"],
    howItWorks: [
      "A Gmail trigger watches for emails from a chosen sender that have an attachment and no invoice synced label.",
      "Sends the PDF to LlamaParse, which keeps tables and structure.",
      "An AI chain with a structured output parser extracts the invoice fields.",
      "Adds the data to Google Sheets.",
      "Applies the invoice synced label so the email is not processed twice.",
    ],
    youNeed: [
      "A Gmail account",
      "A LlamaCloud account for LlamaParse",
      "An OpenAI API key",
      "A Google Sheet",
    ],
    staysManual: [
      "Finance checks extracted amounts before booking or paying.",
      "Approval and payment stay with your team.",
    ],
    watchOuts: [
      "The prompt leaves a field blank when the AI cannot find it. Do not fill blanks with guesses.",
      "The author mentions a free LlamaCloud allowance at the time of writing. Check the current limits.",
    ],
  },
  {
    slug: "pdf-data-extraction",
    title: "Extract Data from PDFs with Claude or Gemini",
    category: "documents-and-finance",
    summary:
      "Send a PDF straight to Claude or Gemini to extract and reshape the information you need, and compare the two.",
    problem:
      "Classic PDF extraction chains OCR with a separate model, which loses layout and adds steps.",
    useCase:
      "An operations analyst picks a PDF in Google Drive and writes what to extract in a prompt. The file is sent to both Claude and Gemini in a single step each, so the analyst can compare results before choosing a model.",
    roles: ["operations", "developer"],
    howItWorks: [
      "Downloads a PDF from Google Drive.",
      "Encodes the file so it can be sent inside an API request.",
      "Uses your prompt to define what to extract and how to transform it.",
      "Sends the PDF and prompt to Claude and to Gemini through HTTP requests.",
    ],
    youNeed: [
      "A Google Drive account",
      "An Anthropic API key, a Gemini API key, or both",
    ],
    staysManual: ["You compare the outputs and choose the model for production use."],
    watchOuts: [
      "Ask for JSON output, as the notes show, when the data feeds another system.",
      "Disable one of the API calls if you only want to use one model.",
    ],
  },
  {
    slug: "rfp-response-drafting",
    title: "Draft RFP Responses from Your Company Knowledge",
    category: "documents-and-finance",
    summary:
      "Extract every question from an RFP document and draft answers from your company documents with an OpenAI assistant.",
    problem:
      "Answering a request for proposal means finding each question in a long document and writing answers from scattered sales material. Teams skip RFPs they cannot staff.",
    useCase:
      "A sales team submits an RFP document through an API call. The workflow creates a Google Doc for the response, extracts the questions exactly as written, answers each one with an OpenAI assistant that has your sales and marketing documents, and records every question and answer in the doc.",
    roles: ["sales", "founder", "operations"],
    howItWorks: [
      "A webhook receives the RFP document.",
      "Creates a new Google Doc for the response.",
      "An AI chain extracts all questions meant for the supplier into a list.",
      "Loops through the questions and asks an OpenAI assistant with your company documents to answer each one.",
      "Writes each question and answer into the doc, with Slack and Gmail nodes for notifying the team.",
    ],
    youNeed: [
      "An OpenAI assistant set up with your company documents",
      "A Google Docs account",
      "Slack and Gmail for notifications",
      "An OpenAI API key",
    ],
    staysManual: [
      "A person reviews and edits every answer before submission.",
      "Pricing and legal commitments are written by your team.",
    ],
    watchOuts: [
      "Secure the webhook before using it in production, as the author warns.",
      "Answers are only as current as the documents in the assistant.",
    ],
  },
  {
    slug: "bank-statement-transcription",
    title: "Transcribe Bank Statements into Structured Text",
    category: "documents-and-finance",
    summary:
      "Convert bank statement PDFs, including scans, into Markdown with a vision model, then extract rows such as deposits.",
    problem:
      "Bank statements come as PDFs or scans that normal text extraction mangles, especially tables. Reconciling them means retyping.",
    useCase:
      "A bookkeeper puts a statement in Google Drive. Each page becomes an image, Gemini transcribes it to Markdown, and a second step lists every deposit row for reconciliation.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Downloads the bank statement PDF from Google Drive.",
      "Splits the pages into images with a Stirling PDF service.",
      "Resizes the images and has Gemini transcribe each page to Markdown.",
      "Joins the pages and uses an AI extractor to list the deposit table rows.",
    ],
    youNeed: [
      "A Google Drive account",
      "A Gemini API key",
      "Stirling PDF, ideally self-hosted for privacy",
    ],
    staysManual: ["A person checks totals against the original statement."],
    watchOuts: [
      "Statements contain sensitive financial data. Self-host the PDF service rather than using a public one.",
      "Vision models transcribe rather than copy exactly. Verify the amounts.",
    ],
  },
  {
    slug: "remove-pii-from-csv",
    title: "Remove Personal Data from CSV Files",
    category: "documents-and-finance",
    summary:
      "Watch a Google Drive folder for CSV files, detect personal data columns with OpenAI and upload a cleaned copy.",
    problem:
      "Teams need to share data exports with vendors or analysts, but removing names, emails and phone numbers by hand is error prone.",
    useCase:
      "An analyst drops an export into a watched folder. OpenAI identifies which columns contain personal data, those columns are removed, and the sanitized file is uploaded back to Google Drive.",
    roles: ["operations", "developer"],
    howItWorks: [
      "A Google Drive trigger detects new CSV files in a folder.",
      "Downloads and reads the file.",
      "OpenAI returns the names of the columns that contain personal data.",
      "Removes those columns.",
      "Uploads the sanitized CSV to Google Drive.",
    ],
    youNeed: ["A Google Drive account", "An OpenAI API key"],
    staysManual: ["Someone checks the cleaned file before it is shared."],
    watchOuts: [
      "The file's data is sent to OpenAI to find personal data. Make sure that fits your privacy obligations.",
      "Personal data inside free text columns may not be detected.",
    ],
  },

  // HR & Recruiting
  {
    slug: "job-applicant-scoring",
    title: "Job Applicant Scoring and Interview Scheduling",
    category: "hr-and-recruiting",
    summary:
      "Score job applicants against the job description with AI, shortlist strong ones, generate interview questions and book a call.",
    problem:
      "Recruiters read every CV to find the few worth talking to, then write questions and coordinate calendars by email.",
    useCase:
      "A hiring manager publishes an application form. Each CV is scored against the job description, strong candidates get tailored questions and a personalized email, and a call is booked on the interviewer's calendar, with everything tracked in Airtable.",
    roles: ["operations", "founder"],
    howItWorks: [
      "An application form collects the candidate's details and CV, stored in Airtable and Google Drive.",
      "An AI agent compares the CV with the job description and records a score and reason in Airtable.",
      "Candidates above your threshold are shortlisted and get questions generated from the job description and CV.",
      "AI writes a personalized email inviting the candidate to a call.",
      "An agent checks the interviewer's Google Calendar, books a slot and updates Airtable.",
    ],
    youNeed: [
      "An Airtable base set up from the Simple Applicant Tracker template",
      "Google Drive and Google Calendar",
      "An OpenAI API key",
      "An SMTP email account",
    ],
    staysManual: [
      "Hiring decisions stay with people.",
      "Review scores and reasons before rejecting anyone.",
    ],
    watchOuts: [
      "Automated scoring can encode bias. Audit results across candidate groups and check local hiring laws.",
      "Change the form description and prompts for each role you hire for.",
    ],
  },
  {
    slug: "resume-screening-vision-ai",
    title: "Screen Resumes with Vision AI",
    category: "hr-and-recruiting",
    summary:
      "Turn a resume PDF into an image and let a vision model assess fit, which resists hidden text meant to trick AI screeners.",
    problem:
      "Some applicants hide invisible instructions in resumes to manipulate AI screening. Text-based parsing reads those instructions as real content.",
    useCase:
      "A recruiter pulls a candidate's resume from Google Drive or an applicant tracking system. The PDF is converted to an image, and Gemini reads what a person would see and judges fit for the role, so hidden text has no effect.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Downloads the resume PDF from Google Drive.",
      "Converts the PDF to an image with Stirling PDF and reduces the resolution.",
      "A multimodal Gemini model evaluates the image against the role.",
      "Returns the assessment for the next step in your hiring process.",
    ],
    youNeed: [
      "Google Drive or an applicant tracking system",
      "A Gemini API key",
      "Stirling PDF",
    ],
    staysManual: ["A recruiter decides whether to move the candidate forward."],
    watchOuts: [
      "Reading resumes as images does not remove bias. Keep human review.",
      "Candidate data is sensitive. Self-host the PDF converter where you can.",
    ],
  },

  // Assistants & Knowledge
  {
    slug: "company-documents-chatbot",
    title: "Company Documents Chatbot for Employee Questions",
    category: "assistants-and-knowledge",
    summary:
      "An employee chatbot that answers questions from company documents in Google Drive, updated as files are added or changed.",
    problem:
      "Employees ask HR and operations the same policy questions because the answers are buried in documents that are hard to search.",
    useCase:
      "An HR team keeps policies in a Google Drive folder. New and updated files are loaded into Pinecone automatically, and employees ask the chat agent questions, which it answers from the retrieved documents.",
    roles: ["operations", "founder"],
    howItWorks: [
      "Google Drive triggers watch a folder for new and updated files.",
      "Files are split, embedded with Gemini and stored in a Pinecone index.",
      "A chat trigger receives employee questions.",
      "An AI agent retrieves relevant passages with a vector store tool and answers with Gemini.",
    ],
    youNeed: [
      "A Google Drive folder for company documents",
      "A Gemini API key from Google AI Studio",
      "A Pinecone account and index",
    ],
    staysManual: [
      "HR owns the documents and keeps them current.",
      "Sensitive cases go to a person.",
    ],
    watchOuts: [
      "Answers are only as good as the documents in the folder.",
      "Restrict who can reach the chat when the documents are internal.",
    ],
  },
  {
    slug: "it-help-desk-slack-bot",
    title: "IT Help Desk Slack Bot on Your Knowledge Base",
    category: "assistants-and-knowledge",
    summary:
      "A Slack bot that answers employees' IT questions in direct messages using your Confluence knowledge base.",
    problem:
      "IT teams answer the same questions in Slack every day while the answers already sit in the company wiki.",
    useCase:
      "An employee messages the bot in Slack. It acknowledges the message, an AI agent searches Confluence through a custom tool workflow, and the answer replaces the acknowledgement, with memory of the recent conversation in that channel.",
    roles: ["operations", "developer"],
    howItWorks: [
      "A webhook receives Slack Events API messages and answers Slack's verification challenge.",
      "Ignores messages from bots and sends a quick received message.",
      "An AI agent with conversation memory calls a knowledge base tool, built as a separate workflow that searches Confluence.",
      "Deletes the received message and posts the final answer.",
    ],
    youNeed: [
      "A Slack app subscribed to the Events API",
      "A Confluence site with search API access",
      "An OpenAI API key",
      "A second workflow for the knowledge base tool",
    ],
    staysManual: [
      "IT keeps the knowledge base accurate.",
      "Access requests and incidents still go to the IT team.",
    ],
    watchOuts: [
      "Connect the tool workflow by entering its ID in the custom tool node.",
      "The bot only knows what the knowledge base contains.",
    ],
  },
  {
    slug: "telegram-ai-assistant",
    title: "Telegram AI Assistant with Image Generation",
    category: "assistants-and-knowledge",
    summary:
      "A Telegram assistant that remembers the conversation and can generate images on request.",
    problem:
      "Teams want a quick AI assistant in the chat app they already use, not another web tool to open.",
    useCase:
      "A founder messages their Telegram bot. The agent remembers recent messages in that chat, addresses the user by name, and when asked to draw something calls an image generation tool and sends the result back in Telegram.",
    roles: ["founder", "operations", "developer"],
    howItWorks: [
      "A Telegram trigger listens for incoming messages.",
      "An AI agent keeps a window of recent messages for each chat as memory.",
      "An HTTP tool calls OpenAI image generation when the user asks for an image.",
      "Telegram nodes send the reply and the image link.",
    ],
    youNeed: ["A Telegram bot token from BotFather", "An OpenAI API key"],
    staysManual: ["You decide who may use the bot. Add a user check if it should be private."],
    watchOuts: [
      "Anyone who finds the bot can message it until you restrict users.",
      "Image generation costs more than text replies.",
    ],
    blueprints: ["telegram-langchain-ai-assistant"],
  },
  {
    slug: "meeting-transcript-follow-ups",
    title: "Turn Meeting Transcripts into Follow-Up Actions",
    category: "assistants-and-knowledge",
    summary:
      "Pull a Google Meet transcript, summarize it and let an AI agent book any follow-up meetings with the right attendees.",
    problem:
      "Meetings end with agreed next steps, but notes and follow-up invites wait until someone finds the time.",
    useCase:
      "After a call, the workflow retrieves the Meet transcript, the agent writes notes with the key points, and if a follow-up meeting was agreed it creates a Google Calendar event and invites the people who should attend.",
    roles: ["founder", "operations", "sales"],
    howItWorks: [
      "Retrieves the meeting transcript from Google's API with an HTTP request.",
      "Sends it to an AI agent that summarizes the key points and identifies follow-up actions.",
      "The agent calls a tool workflow, routed by a switch, to create calendar events.",
      "The tool creates the Google Calendar event and adds attendees.",
    ],
    youNeed: [
      "Google Workspace with Meet transcripts",
      "A Google OAuth credential with the required scopes",
      "An OpenAI API key",
    ],
    staysManual: ["Check the invites the agent creates, especially the attendee list."],
    watchOuts: [
      "There is no built-in Meet transcript node, so the HTTP request and scopes need care.",
      "Agents can invite the wrong people. Start by sending invites only to yourself.",
    ],
  },
  {
    slug: "chat-with-postgres",
    title: "Chat with Your Postgres Database",
    category: "assistants-and-knowledge",
    summary:
      "Ask questions about your Postgres data in plain language and let an AI agent write and run the SQL.",
    problem:
      "Business users wait on engineers or analysts for answers to simple database questions.",
    useCase:
      "An operations lead opens the chat and asks which customers ordered most last month. The agent reads the schema, inspects the table definitions, writes a query, runs it and replies with the answer.",
    roles: ["operations", "developer", "founder"],
    howItWorks: [
      "A chat trigger receives the question.",
      "The agent lists schemas and tables and reads table definitions.",
      "It writes and runs a SQL query with the Postgres tool.",
      "It answers in the chat and remembers recent messages.",
    ],
    youNeed: ["A Postgres database", "An OpenAI API key"],
    staysManual: ["Connect with a read-only database user so the agent cannot change data."],
    watchOuts: [
      "The agent can run any query the database user allows. Never connect it with write access.",
      "Do not make the chat public if the data is private, even though the template allows it.",
    ],
  },
];
