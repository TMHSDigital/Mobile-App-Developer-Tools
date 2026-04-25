---
name: mobile-ai-features
description: Integrate AI APIs (OpenAI, Anthropic, Google AI) into a React Native/Expo app. Covers vision, text generation, and audio transcription with secure API key management. Use when the user wants to add AI-powered features to their mobile app.
standards-version: 1.7.0
---

# Mobile AI Features

## Trigger

Use this skill when the user:

- Wants to add AI-powered features to a mobile app
- Needs to send images to a vision API (GPT-4o, Claude, Gemini)
- Wants text generation or chatbot functionality
- Needs audio transcription (Whisper)
- Asks about securing API keys in a mobile app
- Mentions "AI", "GPT", "Claude", "Gemini", "vision", "transcription", "chatbot", or "LLM"

## Required Inputs

- **AI provider**: OpenAI, Anthropic, or Google AI
- **Features needed**: vision, text generation, audio transcription, or a combination
- **Backend strategy**: edge function (Cloudflare Workers, Vercel Edge), server (Express, Fastify), or serverless (AWS Lambda, Supabase Edge Functions)

## Workflow

1. **Never bundle API keys in the app.** Mobile app binaries can be decompiled. Anyone with the APK or IPA can extract hardcoded keys.

   Instead, use a backend proxy:

   ```
   Mobile App  -->  Your Backend  -->  AI Provider
                    (holds API key)
   ```

   The backend holds the API key. The mobile app authenticates with your backend using user auth tokens.

2. **Set up a minimal backend proxy.** Example with Cloudflare Workers:

   ```typescript
   export default {
     async fetch(request: Request): Promise<Response> {
       const { prompt, image } = await request.json();

       const response = await fetch("https://api.openai.com/v1/chat/completions", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${env.OPENAI_API_KEY}`,
         },
         body: JSON.stringify({
           model: "gpt-4o",
           messages: [
             {
               role: "user",
               content: image
                 ? [
                     { type: "text", text: prompt },
                     { type: "image_url", image_url: { url: image } },
                   ]
                 : prompt,
             },
           ],
           max_tokens: 1024,
         }),
       });

       return response;
     },
   };
   ```

   Deploy this and point your app at its URL.

3. **Create an API client in the app.** In `lib/ai.ts`:

   ```tsx
   const API_BASE = "https://your-worker.your-domain.workers.dev";

   interface AIResponse {
     text: string;
     usage: { prompt_tokens: number; completion_tokens: number };
   }

   export async function generateText(
     prompt: string,
     authToken: string,
   ): Promise<AIResponse> {
     const res = await fetch(`${API_BASE}/generate`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${authToken}`,
       },
       body: JSON.stringify({ prompt }),
     });

     if (!res.ok) {
       const error = await res.text();
       throw new Error(`AI request failed: ${res.status} ${error}`);
     }

     return res.json();
   }

   export async function analyzeImage(
     imageBase64: string,
     prompt: string,
     authToken: string,
   ): Promise<AIResponse> {
     const res = await fetch(`${API_BASE}/vision`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${authToken}`,
       },
       body: JSON.stringify({
         prompt,
         image: `data:image/jpeg;base64,${imageBase64}`,
       }),
     });

     if (!res.ok) throw new Error(`Vision request failed: ${res.status}`);
     return res.json();
   }
   ```

4. **Use vision with expo-camera.** Capture a photo and send it to the vision API:

   ```tsx
   import { CameraView } from "expo-camera";
   import { useRef } from "react";
   import { analyzeImage } from "@/lib/ai";

   const cameraRef = useRef<CameraView>(null);

   async function captureAndAnalyze() {
     if (!cameraRef.current) return;

     const photo = await cameraRef.current.takePictureAsync({
       base64: true,
       quality: 0.5,
     });

     if (!photo?.base64) return;

     const result = await analyzeImage(
       photo.base64,
       "Describe what you see in this image.",
       userAuthToken,
     );

     console.log(result.text);
   }
   ```

   Use `quality: 0.5` or lower to reduce payload size. A full-resolution photo can be 5MB+ in base64.

5. **Streaming responses.** For chat UIs, stream tokens as they arrive:

   ```tsx
   export async function streamText(
     prompt: string,
     authToken: string,
     onToken: (token: string) => void,
   ): Promise<void> {
     const res = await fetch(`${API_BASE}/stream`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${authToken}`,
       },
       body: JSON.stringify({ prompt, stream: true }),
     });

     if (!res.ok) throw new Error(`Stream failed: ${res.status}`);
     if (!res.body) throw new Error("No response body");

     const reader = res.body.getReader();
     const decoder = new TextDecoder();

     while (true) {
       const { done, value } = await reader.read();
       if (done) break;
       const chunk = decoder.decode(value, { stream: true });
       onToken(chunk);
     }
   }
   ```

   Usage in a component:

   ```tsx
   const [response, setResponse] = useState("");

   async function handleSend() {
     setResponse("");
     await streamText(prompt, authToken, (token) => {
       setResponse((prev) => prev + token);
     });
   }
   ```

6. **Audio transcription.** Record audio with expo-av and send to Whisper:

   ```bash
   npx expo install expo-av
   ```

   ```tsx
   import { Audio } from "expo-av";

   const [recording, setRecording] = useState<Audio.Recording | null>(null);

   async function startRecording() {
     await Audio.requestPermissionsAsync();
     await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
     const { recording } = await Audio.Recording.createAsync(
       Audio.RecordingOptionsPresets.HIGH_QUALITY,
     );
     setRecording(recording);
   }

   async function stopAndTranscribe() {
     if (!recording) return;
     await recording.stopAndUnloadAsync();
     const uri = recording.getURI();
     if (!uri) return;

     const formData = new FormData();
     formData.append("file", {
       uri,
       type: "audio/m4a",
       name: "recording.m4a",
     } as any);

     const res = await fetch(`${API_BASE}/transcribe`, {
       method: "POST",
       headers: { Authorization: `Bearer ${authToken}` },
       body: formData,
     });

     const { text } = await res.json();
     console.log("Transcription:", text);
   }
   ```

## Key References

- [OpenAI API: Vision](https://platform.openai.com/docs/guides/vision)
- [Anthropic API: Vision](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [Google AI: Gemini](https://ai.google.dev/gemini-api/docs)
- [expo-av: Audio recording](https://docs.expo.dev/versions/latest/sdk/av/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

## Example Interaction

**User:** "I want to take a photo and have AI describe what's in it."

**Agent:**
1. Sets up expo-camera with `mobile_installDependency`
2. Adds camera permission with `mobile_addPermission`
3. Scaffolds an AI client with `mobile_integrateAI` (provider: openai, features: vision)
4. Creates a camera screen that captures a photo and sends base64 to the vision endpoint
5. Displays the AI description below the photo preview
6. Warns about not bundling API keys and recommends a backend proxy

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Scaffold AI client | `mobile_integrateAI` | Create API client file with provider config and TypeScript types |
| Install expo-camera | `mobile_installDependency` | For vision features that use the camera |
| Install expo-av | `mobile_installDependency` | For audio recording and transcription |
| Add permissions | `mobile_addPermission` | Add camera/microphone permission rationale |
| Check build | `mobile_checkBuildHealth` | Verify project builds after adding native modules |

## Common Pitfalls

1. **Bundling API keys in the app** - This is the most common and most dangerous mistake. Mobile apps can be reverse-engineered. Always proxy through a backend you control.
2. **Sending full-resolution images** - A 12MP photo is 5-10MB in base64. Use `quality: 0.3-0.5` in `takePictureAsync` and resize before sending. This also reduces API costs.
3. **No error handling for network failures** - Mobile apps lose connectivity. Wrap AI calls in try/catch, show user-friendly errors, and implement retry with exponential backoff.
4. **Ignoring costs** - Vision API calls cost more than text. Show users an estimate or add rate limiting on your backend. GPT-4o vision is roughly $0.01-0.03 per image.
5. **Blocking the UI during AI calls** - AI responses can take 2-10 seconds. Show a loading indicator and use streaming for chat interfaces.
6. **Not setting a timeout** - Add `AbortController` with a 30-second timeout to prevent indefinite hangs on slow connections.

## See Also

- [Mobile Camera Integration](../mobile-camera-integration/SKILL.md) - capture photos to send to vision APIs
- [Mobile Permissions](../mobile-permissions/SKILL.md) - handle camera and microphone permissions
