// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { messages, config } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "（エラー：VercelにAPIキーが設定されていません）" }), { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ★ここを修正しました（flash → pro）
    // これで確実に認識されます
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `
      You are an intense and realistic role-play training AI.
      Role: ${config.level === 'professor' ? 'Strict University Professor' : config.level === 'middle' ? 'Curious Junior High Student' : 'University Student'}
      Current Mode: ${config.mode}
      
      Your goal is to simulate a Q&A session. 
      - Listen to the user's input.
      - Ask sharp, relevant questions based on your role.
      - Keep responses concise (under 3 sentences).
      - Do NOT include "User:" or "AI:" labels in your response.
      - Speak in Japanese unless the user speaks English.
    `;

    const lastUserMessage = messages[messages.length - 1].text;
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am ready." }] },
      ],
    });

    const result = await chat.sendMessage(lastUserMessage);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ reply: "（申し訳ありません。AIが混み合っているか、一時的なエラーです。もう一度送ってみてください。）" }), { status: 200 });
  }
}
