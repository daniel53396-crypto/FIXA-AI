import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({limit:'12mb'}));
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({error:'AI is not configured yet. Add OPENAI_API_KEY to your .env file, then restart the server.'});
    }
    const {message, history = [], image, language = 'auto'} = req.body || {};
    if (!message && !image) return res.status(400).json({error:'Please enter a message or upload an image.'});
    const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    const languageHint = language && language !== 'auto' ? `The selected response language is ${language}. If practical, reply in that language.` : 'Reply in the same language the user uses.';
    const input = [];
    for (const item of history.slice(-10)) {
      if (!item || !['user','assistant'].includes(item.role) || typeof item.content !== 'string') continue;
      input.push({role:item.role, content:item.content.slice(0,12000)});
    }
    const content = [{type:'input_text', text:`${message || 'Please describe this image.'}\n\n${languageHint}`}];
    if (typeof image === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(image)) {
      content.push({type:'input_image', image_url:image});
    }
    input.push({role:'user', content});
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions: 'You are Fix AI, a friendly multilingual assistant. Be helpful, clear, and honest about limitations. Do not claim to have edited or generated an image unless an image tool actually did so.',
      input
    });
    res.json({answer:response.output_text || 'I could not create a text answer for that request.'});
  } catch (error) {
    console.error('Fix AI API error:', error?.message || error);
    const status = error?.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    res.status(status).json({error: status === 401 ? 'The API key was rejected. Check OPENAI_API_KEY.' : 'The AI request failed. Check server logs, API access, and billing/usage limits.'});
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`Fix AI running at http://localhost:${port}`));
