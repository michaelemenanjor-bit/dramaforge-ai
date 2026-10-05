# DramaForge AI — Real Connected App

A mobile-friendly Node.js/Express app for generating short drama packages with the OpenAI API and submitting individual scene prompts to the OpenAI video API.

## Deploy on Render

1. Put this folder in a GitHub repository.
2. In Render, choose **New → Web Service** and connect the repository.
3. Render can use the included `render.yaml`, or enter:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check: `/api/health`
4. In Render **Environment**, add `OPENAI_API_KEY` with your OpenAI API key. Keep the key server-side; never put it in `public/index.html`.
5. Deploy. Render will give the app a public `onrender.com` URL.

## Local

Requires Node.js 20+.

```bash
npm install
export OPENAI_API_KEY="your_key_here"
npm start
```
Then open `http://localhost:3000`.

## What it does

- Generates a drama title, hook, synopsis, characters, scenes, dialogue, camera notes, sound notes, video prompts, continuity bible and cliffhanger.
- Sends individual scene prompts to the video-generation API.
- Polls video jobs and plays completed MP4 clips.

A full 3–10 minute episode is assembled from multiple short scene clips; this package does not yet stitch those clips into one final episode or add voice/music.

## Important

- API access and model availability depend on your OpenAI account.
- Video generation may incur API charges.
- Render's free web services can spin down after inactivity.
