// src/App.tsx
// AKITA Presentation Trainer - Vercel Edition (Connected to Gemini)
import { useState, useRef, useEffect } from 'react';
import { Mic, Send, StopCircle, User, Bot, Upload, Settings, CheckCircle2, Clock, HelpCircle } from 'lucide-react';

// --- 型定義 ---
type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
};

type AppMode = 'presentation' | 'document';
type Level = 'middle' | 'university' | 'professor';

// --- メインコンポーネント ---
function App() {
  const [isChatStarted, setIsChatStarted] = useState(false);

  // 設定項目（初期値）
  const [mode, setMode] = useState<AppMode>('presentation');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<Level>('university');
  const [presDuration, setPresDuration] = useState(2);
  const [qaDuration, setQaDuration] = useState(2);

  // チャット機能用の状態
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'en-US'; 
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };
    }
  }, []);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const startTraining = () => {
    const initialPrompt = `Training Mode: ${mode.toUpperCase()}
Judge Level: ${level.toUpperCase()}
Presentation Time: ${presDuration} min
Q&A Time: ${qaDuration} min

(System: Settings applied. The AI judge is ready.)`;

    const initialMessage: Message = {
      id: 1,
      text: initialPrompt,
      sender: 'ai'
    };
    setMessages([initialMessage]);
    setIsChatStarted(true);
  };

  // ★ここが以前と違います（デモ応答を削除し、本物のAIへ接続）
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. ユーザーのメッセージを表示
    const userMsg: Message = { id: Date.now(), text: inputText, sender: 'user' };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. Vercel上のAIサーバー(api/chat)にデータを送る
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          config: {
            level,
            presDuration,
            qaDuration,
            mode
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      // 3. AIからの返事を受け取って表示
      const aiMsg: Message = {
        id: Date.now() + 1,
        text: data.reply || "（エラー：AIからの応答がありませんでした）",
        sender: 'ai'
      };
      setMessages([...newHistory, aiMsg]);

    } catch (error) {
      console.error("Error:", error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: "申し訳ありません。エラーが発生しました。インターネット接続を確認してください。",
        sender: 'ai'
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 画面1: 設定画面 ---
  if (!isChatStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-4xl w-full border border-slate-100">
          <div className="text-center mb-10">
            <div className="inline-block bg-blue-600 p-3 rounded-2xl mb-4 shadow-md">
               <Settings className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">AKITA プレゼントレーニング</h1>
            <p className="text-slate-500 text-sm font-medium">モードを選択し、メールアドレスを入力し、目的に合わせて審査員のレベルと時間を設定しましょう。</p>
          </div>

          <div className="space-y-8">
            {/* 1. モード選択 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">
                <CheckCircle2 size={16} className="text-blue-500"/> トレーニングモードを選択
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setMode('presentation')} className={`p-5 rounded-2xl border-2 text-left transition-all group ${mode === 'presentation' ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${mode === 'presentation' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}><Mic size={20} /></div>
                    <span className={`font-bold text-lg ${mode === 'presentation' ? 'text-blue-900' : 'text-slate-700'}`}>プレゼン練習</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-12 leading-relaxed">自身の発表からQ&Aまで、本番さながらのフルプロセスを練習します。</p>
                </button>
                <button onClick={() => setMode('document')} className={`p-5 rounded-2xl border-2 text-left transition-all group ${mode === 'document' ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                   <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${mode === 'document' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}><Upload size={20} /></div>
                    <span className={`font-bold text-lg ${mode === 'document' ? 'text-blue-900' : 'text-slate-700'}`}>資料ディスカッション</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-12 leading-relaxed">発表はせず、アップロードした資料に基づいたQ&Aに特化して議論します。</p>
                </button>
              </div>
            </div>

            {/* 2. メールアドレス */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider"><Settings size={16} className="text-blue-500"/> メールアドレス (結果送信先)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@akita-pu.ac.jp" className="w-full p-4 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-300"/>
            </div>

            {/* 3. 審査員レベル */}
            <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider"><User size={16} className="text-blue-500"/> 審査員のレベル</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  {(['middle', 'university', 'professor'] as Level[]).map((l) => (
                    <button key={l} onClick={() => setLevel(l)} className={`flex-1 py-3 text-sm rounded-lg transition-all font-bold ${level === l ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                      {l === 'middle' ? '中学生' : l === 'university' ? '大学生' : '大学教員'}
                    </button>
                  ))}
                </div>
            </div>

            {/* 4. 時間設定 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider"><Clock size={16} className="text-blue-500"/> プレゼン時間</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  {[2, 4, 6].map((m) => (
                    <button key={m} onClick={() => setPresDuration(m)} className={`flex-1 py-3 text-sm rounded-lg transition-all font-bold ${presDuration === m ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                      {m}分
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider"><HelpCircle size={16} className="text-blue-500"/> Q&A時間</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  {[2, 3, 4].map((m) => (
                    <button key={m} onClick={() => setQaDuration(m)} className={`flex-1 py-3 text-sm rounded-lg transition-all font-bold ${qaDuration === m ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                      {m}分
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. ファイルアップロード (今は見た目だけ) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider"><Upload size={16} className="text-blue-500"/> プレゼン資料 (PDFのみ推奨)</label>
              <div className="border-3 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group bg-slate-50/50">
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm border border-slate-100"><Upload className="text-blue-500" size={28} /></div>
                <p className="text-sm font-bold text-slate-700 mb-1">※チャット接続テスト中（アップロード機能は次回実装します）</p>
              </div>
            </div>

            <button onClick={startTraining} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg">
              <CheckCircle2 size={24} /> トレーニングを開始
            </button>
          </div>
        </div>
        <div className="mt-8 text-slate-400 text-xs font-medium">© 2024 AceTalk Academic Trainer. Powered by Gemini.</div>
      </div>
    );
  }

  // --- 画面2: チャット画面 ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800">
      <header className="w-full max-w-4xl bg-white p-4 rounded-2xl shadow-sm mb-4 flex items-center justify-between border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-md"><Bot className="text-white w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Presentation Practice</h1>
            <div className="flex gap-3 text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
                <span className="bg-slate-100 px-2 py-1 rounded-md">Judge: {level}</span>
                <span className="bg-slate-100 px-2 py-1 rounded-md">Pres: {presDuration}min</span>
                <span className="bg-slate-100 px-2 py-1 rounded-md">Q&A: {qaDuration}min</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsChatStarted(false)} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold bg-slate-100 px-4 py-2 rounded-xl transition-colors">
          <Settings size={16} /> 設定に戻る
        </button>
      </header>

      <div className="flex-1 w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 h-[60vh]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-slate-100' : 'bg-blue-600'}`}>
                {msg.sender === 'user' ? <User size={24} className="text-slate-500"/> : <Bot size={24} className="text-white" />}
              </div>
              <div className={`p-5 rounded-3xl max-w-[80%] leading-relaxed text-[15px] ${msg.sender === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-blue-50 text-blue-900 rounded-tl-none'}`}>
                <div className="font-bold mb-1 text-xs opacity-50 mb-2">{msg.sender === 'user' ? 'YOU' : `AI JUDGE (${level.toUpperCase()})`}</div>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-5 animate-pulse">
               <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-sm"><Bot size={24} className="text-white" /></div>
               <div className="p-5 bg-blue-50 rounded-3xl rounded-tl-none text-blue-900 text-[15px] flex items-center gap-2 font-medium">
                 <Clock size={16} className="animate-spin"/> Thinking...
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-4">
            <button onClick={toggleMic} className={`p-4 rounded-full transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100' : 'bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>
              {isListening ? <StopCircle size={24} /> : <Mic size={24} />}
            </button>
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type or speak here..." className="flex-1 p-4 rounded-full border-2 border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white shadow-sm text-lg font-medium" onKeyPress={(e) => e.key === 'Enter' && sendMessage()}/>
            <button onClick={sendMessage} disabled={isLoading || !inputText} className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95">
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;