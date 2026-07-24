require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");
const path = require("path");
const config = require("./config");

const app = express();
app.use(express.json());

// ---- CORS: only allow the hotel's own website(s) to call this backend ----
const corsOptions = {
  origin: function (origin, callback) {
    if (config.allowedOrigins.includes("*") || !origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};
app.use(cors(corsOptions));

// ---- Rate limiting: caps requests per IP to control API cost / abuse ----
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,              // 20 messages per minute per visitor
  message: { error: "Too many messages — please slow down a moment." }
});

// ---- Serve the embeddable widget file ----
app.use(express.static(path.join(__dirname, "public")));

// ---- Public config the widget needs (safe, non-secret info only) ----
app.get("/api/config", (req, res) => {
  res.json({
    hotelName: config.hotelName,
    greeting: config.greeting,
    primaryColor: config.primaryColor,
    accentColor: config.accentColor,
    bookingUrl: config.bookingUrl
  });
});

// ---- The main chat endpoint the widget calls ----
app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const { messages, language } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }
    // Basic sanity cap so one guest can't send a huge payload
    if (messages.length > 40) {
      return res.status(400).json({ error: "conversation too long, please refresh" });
    }

    const systemPrompt = buildSystemPrompt(language);

    // Gemini uses "user" / "model" roles (not "assistant"), and wraps text in a
    // "parts" array instead of a plain "content" string.
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const GEMINI_MODEL = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 1000 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res.status(502).json({ error: "AI service error, please try again" });
    }

    const data = await response.json();
    const raw = ((data.candidates || [])[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();

    let parsed;
    try {
      const cleaned = raw.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        reply: raw || "I'm having trouble on my end — let me get the front desk to help.",
        escalate: true,
        reason: "parse error",
        upsell: null
      };
    }

    // Fire a Slack notification on escalation, if configured. Never blocks the guest's reply.
    if (parsed.escalate && config.slackWebhookUrl) {
      notifySlack(parsed.reason).catch((e) => console.error("Slack webhook failed:", e.message));
    }

    res.json(parsed);
  } catch (err) {
    console.error("Chat endpoint error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

function buildSystemPrompt(language) {
  const langLine =
    language && language !== "auto"
      ? `The guest has selected ${language} as their preferred language. Reply ONLY in ${language}, regardless of what language they type in.`
      : `Detect the language the guest is writing in and reply in that same language automatically — you support any major language fluently.`;

  return `You are the front-desk chat assistant embedded on ${config.hotelName}'s website. Answer ONLY using the knowledge base below — never invent rates, policies, or amenities that aren't in it.

${config.knowledgeBase}

LANGUAGE: ${langLine}

UPSELLING: Where it fits naturally (never forced, never on an escalation or complaint), you may suggest ONE relevant paid add-on from the knowledge base — but only when it genuinely matches what the guest is asking about. Keep suggestions to no more than one per reply, phrased as a soft offer, never pushy.

Respond to the guest's latest message. You MUST reply with ONLY a raw JSON object, no markdown fences, no preamble, matching exactly this shape:
{"reply": "<your reply to the guest, 1-3 sentences, warm and hospitable, plain language, in the required language>", "escalate": <true or false>, "reason": "<short internal reason, e.g. 'noise complaint' or 'none' if not escalating>", "upsell": <null, or {"label": "<short 2-4 word chip label in the required language>", "detail": "<one short sentence pitch in the required language>"}>}

Set "escalate" true whenever the knowledge base says to escalate, or when you don't have enough information to answer accurately. When escalating, "reply" should acknowledge the request warmly and say you're notifying the front desk team — never attempt to resolve refunds, complaints, emergencies, or group bookings yourself, and never include an upsell alongside an escalation.`;
}

async function notifySlack(reason) {
  await fetch(config.slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🔔 ${config.hotelName} chatbot escalation: ${reason || "needs staff attention"}`
    })
  });
}

app.get("/", (req, res) => {
  res.send(`${config.hotelName} chatbot backend is running. Embed widget.js on your site to use it.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${config.hotelName} chatbot backend listening on port ${PORT}`);
});
