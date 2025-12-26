// api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { messages, config } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // 1. 鍵がない場合のチェック
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        reply: "【原因：APIキーが読み込めていません】\nVercelのSettingsでキーを設定し、必ず「Redeploy」してください。" 
      }), { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      You are an intense and realistic role-play training AI.
      Role: ${config.level}
      Current Mode: ${config.mode}
      Reply in Japanese.
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

  } catch (error: any) {
    // ★ここが探偵ポイント！エラーの正体をそのまま画面に返します
    console.error(error);
    const errorMsg = error.message || String(error);
    
    return new Response(JSON.stringify({ 
      reply: `【エラー原因判明！】\nGoogleからの返答エラーです。\n\n詳細: ${errorMsg}` 
    }), { status: 200 });
  }
}
