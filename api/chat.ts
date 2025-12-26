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
      return new Response(JSON.stringify({ reply: "（設定エラー：VercelにAPIキーが登録されていません）" }), { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      You are an intense and realistic role-play training AI.
      Role: ${config.level === 'professor' ? 'Strict University Professor' : config.level === 'middle' ? 'Curious Junior High Student' : 'University Student'}
      Current Mode: ${config.mode}
      Reply in Japanese unless the user speaks English.
      Keep it short and conversational.
    `;

    const lastUserMessage = messages[messages.length - 1].text;
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood." }] },
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
    return new Response(JSON.stringify({ reply: "（AI呼び出しエラーが発生しました）" }), { status: 200 });
  }
}
