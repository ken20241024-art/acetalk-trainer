// api/chat.js
// Vercel Serverless Function for Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge', // 高速なエッジ機能を使います
};

export default async function handler(req) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // 画面から送られてきたデータ（メッセージや設定）を受け取る
    const requestData = await req.json();
    const { messages, config } = requestData;

    // Vercelに設定する環境変数からキーを取得
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key not found on server' }), { status: 500 });
    }

    // Geminiの準備
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // システムプロンプト（AIへの役割指示）を作成
    // ここで先生の設定（レベルや時間）をAIに伝えます
    const systemPrompt = `
      You are an expert presentation trainer acting as a judge at Akita Prefectural University.
      
      Current Settings:
      - Judge Level: ${config.level} (adjust your tone and harshness accordingly)
      - Presentation Time: ${config.presDuration} min
      - Q&A Time: ${config.qaDuration} min
      - Mode: ${config.mode}
      
      Your Role:
      1. Listen to the user's input.
      2. If it's a presentation, evaluate logically. If it's Q&A, ask sharp questions based on the level.
      3. Be strictly professional.
      4. Keep responses concise (under 300 characters) unless analyzing a full speech.
      5. Speak mainly in Japanese unless the user speaks English.
    `;

    // 会話履歴の最後のメッセージを取得
    const lastMessage = messages[messages.length - 1].text;
    
    // AIへの命令文を作成
    const prompt = `${systemPrompt}\n\nUser's Input: ${lastMessage}\nAI Judge's Response:`;

    // AIに送信
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 結果を画面（App.tsx）に返す
    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'AI processing failed' }), { status: 500 });
  }
}
