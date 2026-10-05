import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

const PORT = process.env.PORT || 3000;
const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey: process.env.OPENAI_API_KEY}) : null;

function requireKey(res){
  if(!client){
    res.status(503).json({error:"OPENAI_API_KEY is not configured on the server."});
    return false;
  }
  return true;
}

app.get("/api/health",(req,res)=>res.json({ok:true, aiConfigured:Boolean(client)}));

app.post("/api/drama", async (req,res)=>{
  if(!requireKey(res)) return;
  const {idea, genre="Romance & Suspense", length="3 minutes", setting="Modern Nigeria",
         format="Vertical 9:16", language="English", episode="Episode 1"} = req.body || {};
  if(!idea?.trim()) return res.status(400).json({error:"Story idea is required."});

  const instructions = `You are DramaForge AI, a professional short-form African TV drama writer and production planner.
Create an original, binge-worthy adult drama suitable for TikTok, Facebook Reels and YouTube Shorts.
Use natural dialogue and culturally believable Nigerian settings when Nigeria is selected.
Avoid explicit sexual content. Focus on romance, emotion, suspense, conflict and strong cliffhangers.
Return ONLY valid JSON matching the requested structure. Make scenes production-ready and keep character identities consistent.`;

  const input = {
    idea, genre, length, setting, format, language, episode,
    requirements: {
      title:true, hook:true, synopsis:true,
      characters:"3-6 characters with fixed visual identity, personality and voice notes",
      screenplay:"scene-by-scene with action and natural dialogue",
      scenes:"6-12 scenes; each needs duration, location, action, dialogue, camera, sound, and a video_prompt",
      cliffhanger:true,
      continuity:"include a continuity bible for future episodes"
    }
  };

  try{
    const response = await client.responses.create({
      model:"gpt-6-astra",
      instructions,
      input: JSON.stringify(input),
      text:{
        format:{
          type:"json_schema",
          name:"drama_package",
          strict:true,
          schema:{
            type:"object",
            additionalProperties:false,
            properties:{
              title:{type:"string"}, hook:{type:"string"}, synopsis:{type:"string"},
              episode:{type:"string"}, setting:{type:"string"}, format:{type:"string"},
              characters:{type:"array",items:{type:"object",additionalProperties:false,properties:{
                name:{type:"string"}, role:{type:"string"}, visual_identity:{type:"string"},
                personality:{type:"string"}, voice:{type:"string"}
              },required:["name","role","visual_identity","personality","voice"]}},
              scenes:{type:"array",items:{type:"object",additionalProperties:false,properties:{
                number:{type:"integer"}, title:{type:"string"}, duration_seconds:{type:"integer"},
                location:{type:"string"}, action:{type:"string"}, dialogue:{type:"string"},
                camera:{type:"string"}, sound:{type:"string"}, video_prompt:{type:"string"}
              },required:["number","title","duration_seconds","location","action","dialogue","camera","sound","video_prompt"]}},
              continuity_bible:{type:"string"}, cliffhanger:{type:"string"}
            },
            required:["title","hook","synopsis","episode","setting","format","characters","scenes","continuity_bible","cliffhanger"]
          }
        }
      }
    });
    res.json(JSON.parse(response.output_text));
  }catch(e){
    console.error(e);
    res.status(500).json({error:e?.message || "Drama generation failed."});
  }
});

app.post("/api/video", async (req,res)=>{
  if(!requireKey(res)) return;
  const {prompt, seconds=8, size="720x1280"} = req.body || {};
  if(!prompt?.trim()) return res.status(400).json({error:"Video prompt is required."});
  try{
    const video = await client.videos.create({
      model:"sora-2",
      prompt,
      seconds:String(Math.min(12,Math.max(4,Number(seconds)))),
      size
    });
    res.json(video);
  }catch(e){
    console.error(e);
    res.status(500).json({error:e?.message || "Video job failed."});
  }
});

app.get("/api/video/:id", async (req,res)=>{
  if(!requireKey(res)) return;
  try{
    const video = await client.videos.retrieve(req.params.id);
    res.json(video);
  }catch(e){
    res.status(500).json({error:e?.message || "Could not retrieve video."});
  }
});

app.get("/api/video/:id/content", async (req,res)=>{
  if(!requireKey(res)) return;
  try{
    const content = await client.videos.downloadContent(req.params.id);
    res.setHeader("Content-Type","video/mp4");
    const arrayBuffer = await content.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  }catch(e){
    res.status(500).json({error:e?.message || "Could not download video."});
  }
});

app.use((req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`DramaForge AI running on http://localhost:${PORT}`));
