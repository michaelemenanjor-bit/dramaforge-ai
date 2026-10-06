import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function requireKey(res) {
  if (!GEMINI_API_KEY) {
    res.status(503).json({
      error: "GEMINI_API_KEY is not configured on the server."
    });
    return false;
  }
  return true;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(GEMINI_API_KEY),
    provider: "Google Gemini"
  });
});

app.post("/api/drama", async (req, res) => {

  if (!requireKey(res)) return;

  const {
    idea,
    genre = "Romance & Suspense",
    length = "3 minutes",
    setting = "Modern Nigeria",
    format = "Vertical 9:16",
    language = "English",
    episode = "Episode 1"
  } = req.body || {};

  if (!idea?.trim()) {
    return res.status(400).json({
      error: "Story idea is required."
    });
  }

  const systemInstruction = `
You are DramaForge AI, a professional short-form African TV drama writer and production planner.

Create an original, binge-worthy adult drama suitable for TikTok, Facebook Reels and YouTube Shorts.

Use natural dialogue and culturally believable Nigerian settings when Nigeria is selected.

Focus on romance, emotion, suspense, conflict and strong cliffhangers.

Avoid explicit sexual content.

Keep character identities visually and personally consistent.

Create production-ready scenes.

Return ONLY valid JSON matching the requested structure.
`;

  const userPrompt = `
Create a complete short drama using these requirements:

Story idea:
${idea}

Genre:
${genre}

Length:
${length}

Setting:
${setting}

Format:
${format}

Language:
${language}

Episode:
${episode}

Requirements:

- Create a strong title.
- Create a powerful opening hook.
- Create a short synopsis.
- Create 3 to 6 important characters.
- Give every character a fixed visual identity.
- Give every character personality and voice notes.
- Create 6 to 12 scenes.
- Every scene must include:
  number
  title
  duration_seconds
  location
  action
  dialogue
  camera
  sound
  video_prompt
- Make dialogue natural and believable.
- Make the story suitable for short-form social media.
- End with a strong cliffhanger.
- Include a continuity bible that can be used for future episodes.
`;

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      hook: { type: "string" },
      synopsis: { type: "string" },
      episode: { type: "string" },
      setting: { type: "string" },
      format: { type: "string" },

      characters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            visual_identity: { type: "string" },
            personality: { type: "string" },
            voice: { type: "string" }
          },
          required: [
            "name",
            "role",
            "visual_identity",
            "personality",
            "voice"
          ]
        }
      },

      scenes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: { type: "integer" },
            title: { type: "string" },
            duration_seconds: { type: "integer" },
            location: { type: "string" },
            action: { type: "string" },
            dialogue: { type: "string" },
            camera: { type: "string" },
            sound: { type: "string" },
            video_prompt: { type: "string" }
          },
          required: [
            "number",
            "title",
            "duration_seconds",
            "location",
            "action",
            "dialogue",
            "camera",
            "sound",
            "video_prompt"
          ]
        }
      },

      continuity_bible: {
        type: "string"
      },

      cliffhanger: {
        type: "string"
      }
    },

    required: [
      "title",
      "hook",
      "synopsis",
      "episode",
      "setting",
      "format",
      "characters",
      "scenes",
      "continuity_bible",
      "cliffhanger"
    ]
  };

  try {

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: userPrompt
                }
              ]
            }
          ],

          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.9
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    const drama = JSON.parse(text);

    res.json(drama);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        error?.message ||
        "Drama generation failed."
    });
  }
});


/*
  Video generation is temporarily disabled because
  the previous version used OpenAI's video API.

  We will connect a video provider separately.
*/

app.post("/api/video", async (req, res) => {

  res.status(501).json({
    error:
      "Video generation is not connected yet. Drama generation is working with Gemini."
  });

});


app.get("/api/video/:id", async (req, res) => {

  res.status(501).json({
    error:
      "Video generation is not connected yet."
  });

});


app.get("/api/video/:id/content", async (req, res) => {

  res.status(501).json({
    error:
      "Video generation is not connected yet."
  });

});


app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});


app.listen(PORT, () => {
  console.log(
    `DramaForge AI running on http://localhost:${PORT}`
  );
});
