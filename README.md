# Fix AI Website

A responsive Fix AI starter website with a gold loading screen, black/white workspace, multilingual chat UI, image upload to AI, browser speech input/output, and a local image editor.

## Included
- Gold circular loading animation branded **Fix AI**.
- Dark chat interface with a gold accent.
- Chat requests sent through a server endpoint (the API key is never placed in browser JavaScript).
- Image upload in chat for supported vision input.
- Image Studio: local file rename, brightness/contrast/saturation filters, and download.
- Speech recognition and text-to-speech where the browser/device supports them.
- Language selector and a response-language hint.

## Important limits
- Real AI answers require an OpenAI API key and internet access.
- This starter does not include AI image generation, background removal, or generative image editing. Image Studio performs ordinary browser-based visual filters.
- Speech recognition support varies by browser/device and may require microphone permission and an internet connection. This is not a continuous, low-latency realtime voice conversation.
- The website has no login, database, rate limiting, or production abuse protection. Add these before public deployment.
- Do not put your API key in `app.js` or any client-side file.

## Run locally
1. Install Node.js (version 18 or newer recommended).
2. Extract this folder.
3. Open a terminal in this folder and run: `npm install`
4. Copy `.env.example` to `.env`.
5. Put your API key after `OPENAI_API_KEY=` in `.env`.
6. Run: `npm start`
7. Open `http://localhost:3000`.

For mobile testing, the phone and computer should be on the same Wi-Fi if you host it on a computer. Use the computer's local network address instead of `localhost`. Microphone APIs may require HTTPS except on localhost; deployment should use HTTPS.

## Deployment
Deploy to a Node.js hosting service that supports environment variables. Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the host's secret/environment settings. Do not upload `.env` to a public repository.
