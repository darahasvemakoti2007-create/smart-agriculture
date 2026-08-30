"use client";

import React, { useState, useEffect, useRef } from "react";
import { chatWithFarmAI, ChatMessage } from "@/app/dashboard/chat/actions";
import { useLanguage } from "@/components/LanguageContext";

const langLocales: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  bn: "bn-IN",
};

const chatTranslations = {
  en: {
    placeholder: "Ask AgriBot in English, Hindi, Telugu, Tamil, Bengali...",
    welcome: "Hello! I am **AgriBot**. I have synced with your crops, soil telemetry, recent weather metrics, and active notifications.\n\nAsk me anything in your preferred language about your farm health, irrigation, alerts, or crops!",
    listening: "AgriBot is listening... Speak in your language",
    suggestions: ["Soil health summary", "Any weather concerns?", "List active alerts", "Review crop health"],
    speakTip: "🔊 Read Aloud",
    stop: "⏹ Stop",
  },
  hi: {
    placeholder: "अपनी भाषा (हिंदी, अंग्रेजी, तेलुगु...) में पूछें...",
    welcome: "नमस्ते! मैं **AgriBot** हूँ। मैंने आपके खेत, मिट्टी के डेटा, मौसम और अलर्ट की जानकारी सिंक कर ली है।\n\nअपनी पसंदीदा भाषा में खेती, सिंचाई, मिट्टी या फसल संबंधी कोई भी सवाल पूछें!",
    listening: "AgriBot सुन रहा है... अपनी भाषा में बोलें",
    suggestions: ["मिट्टी स्वास्थ्य सारांश", "मौसम संबंधी सलाह?", "सक्रिय अलर्ट दिखाएं", "फसल स्वास्थ्य समीक्षा"],
    speakTip: "🔊 बोलकर सुनाएं",
    stop: "⏹ रोकें",
  },
  te: {
    placeholder: "మీ భాషలో (తెలుగు, ఇంగ్లీష్, హిందీ...) అడగండి...",
    welcome: "నమస్కారం! నేను **AgriBot**. మీ పంటలు, నేల డేటా, వాతావరణ సమాచారం మరియు హెచ్చరికలను సింక్ చేశాను.\n\nమీ పొలం ఆరోగ్యం, నీటి పారుదల, పంట తెగుళ్ల గురించి మీ మాతృభాషలోనే నన్ను అడగండి!",
    listening: "AgriBot వింటోంది... మీ భాషలో మాట్లాడండి",
    suggestions: ["నేల ఆరోగ్య సారాంశం", "వాతావరణ సమాచారం?", "సక్రియ అలర్ట్‌ల జాబితా", "పంట ఆరోగ్యం"],
    speakTip: "🔊 చదివి వినిపించు",
    stop: "⏹ ఆపు",
  },
  ta: {
    placeholder: "உங்கள் மொழியில் (தமிழ், ஆங்கிலம், இந்தி...) கேளுங்கள்...",
    welcome: "வணக்கம்! நான் **AgriBot**. உங்கள் பண்ணை தரவு, மண் அளவீடுகள் மற்றும் வானிலை தகவல்களை ஒருங்கிணைத்துள்ளேன்.\n\nஉங்கள் பண்ணை ஆரோக்கியம், நீர்ப்பாசனம் மற்றும் பயிர்கள் பற்றி உங்கள் சொந்த மொழியில் கேளுங்கள்!",
    listening: "AgriBot கேட்கிறது... உங்கள் மொழியில் பேசுங்கள்",
    suggestions: ["மண் ஆரோக்கியம் சுருக்கம்", "வானிலை எச்சரிக்கைகள்?", "செயலில் உள்ள எச்சரிக்கைகள்", "பயிர் ஆரோக்கியம்"],
    speakTip: "🔊 வாசித்துக்காட்டு",
    stop: "⏹ நிறுத்து",
  },
  bn: {
    placeholder: "আপনার ভাষায় (বাংলা, ইংরেজি, হিন্দি...) জিজ্ঞাসা করুন...",
    welcome: "নমস্কার! আমি **AgriBot**। আমি আপনার খামার, মাটির উপাত্ত, আবহাওয়া এবং সতর্কতা সিঙ্ক করেছি।\n\nআপনার খামারের স্বাস্থ্য, সেচ বা ফসল সম্পর্কিত যেকোনো প্রশ্ন আপনার নিজস্ব ভাষায় জিজ্ঞাসা করুন!",
    listening: "AgriBot শুনছে... আপনার ভাষায় বলুন",
    suggestions: ["মাটির স্বাস্থ্যের সারসংক্ষেপ", "আবহাওয়া সতর্কতা?", "সক্রিয় সতর্কতা তালিকা", "ফসলের স্বাস্থ্য পরীক্ষা"],
    speakTip: "🔊 পড়ে শোনান",
    stop: "⏹ থামুন",
  },
};

export default function FarmAIChat() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const t = chatTranslations[language] || chatTranslations.en;

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = langLocales[language] || "en-IN";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Voice Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      const targetLocale = langLocales[language] || "en-IN";
      recognitionRef.current.lang = targetLocale;
      recognitionRef.current.start();
    }
  };

  // Text-To-Speech
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Remove Markdown patterns
      const cleanText = text
        .replace(/[*#_`~[\]()]/g, "")
        .replace(/-\s+/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Auto detect script or fallback to language locale
      let speakLang = langLocales[language] || "en-IN";
      if (/[\u0C00-\u0C7F]/.test(cleanText)) speakLang = "te-IN"; // Telugu script
      else if (/[\u0900-\u097F]/.test(cleanText)) speakLang = "hi-IN"; // Hindi script
      else if (/[\u0B80-\u0BFF]/.test(cleanText)) speakLang = "ta-IN"; // Tamil script
      else if (/[\u0980-\u09FF]/.test(cleanText)) speakLang = "bn-IN"; // Bengali script

      utterance.lang = speakLang;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Handle Send Message
  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    if (isSpeaking) {
      stopSpeaking();
    }

    const newUserMessage = { role: "user" as const, text: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const historyToSend: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await chatWithFarmAI(trimmed, historyToSend);
      if (res.success && res.reply) {
        const botReply = { role: "model" as const, text: res.reply };
        setMessages((prev) => [...prev, botReply]);
        if (autoSpeak) {
          speakText(res.reply);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model" as const, text: res.error || "Sorry, I could not process that request." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model" as const, text: "Sorry, I encountered an error connecting to AgriBot." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Chat Open state
  const toggleChat = () => {
    if (isOpen && isSpeaking) {
      stopSpeaking();
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={toggleChat}
        aria-label="Open AgriBot Chat"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-green-600 to-emerald-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-green-400/35"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <div className="relative">
            <span className="text-2xl">💬</span>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[550px] bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-lg transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-4 py-3.5 flex items-center justify-between text-white shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold text-lg border border-white/10">
                🌱
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight leading-tight">AgriBot Assistant</h3>
                <p className="text-[10px] text-green-100 font-semibold opacity-90">Multilingual Farm Decision Support</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Speaker Vocal Settings */}
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  autoSpeak
                    ? "bg-white/20 text-white"
                    : "text-green-200 hover:text-white hover:bg-white/10"
                }`}
                title={autoSpeak ? "Auto-vocal responses ON" : "Auto-vocal responses OFF"}
              >
                {autoSpeak ? "🔊 Voice On" : "🔇 Voice Off"}
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-lg bg-red-650/40 text-white text-xs font-semibold cursor-pointer hover:bg-red-600/50"
                  title="Stop speaking"
                >
                  {t.stop}
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm">
            {/* Welcome Msg */}
            <div className="flex gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm shrink-0">
                🤖
              </div>
              <div className="bg-zinc-150/70 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 p-3 rounded-2xl rounded-tl-xs leading-relaxed shadow-2xs border border-zinc-200/50 dark:border-zinc-800/50 whitespace-pre-line">
                {t.welcome}
              </div>
            </div>

            {/* Conversation list */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 border ${
                    msg.role === "user"
                      ? "bg-green-600 text-white border-green-500"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {msg.role === "user" ? "🧑‍🌾" : "🤖"}
                </div>
                <div
                  className={`p-3 rounded-2xl leading-relaxed shadow-2xs ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-tr-xs"
                      : "bg-zinc-150/70 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 rounded-tl-xs border border-zinc-200/50 dark:border-zinc-800/50"
                  }`}
                >
                  {/* Basic parsing helper for clean text/Markdown display */}
                  <div className="whitespace-pre-line">
                    {msg.text.split("\n").map((line, lIdx) => {
                      // Process basic bold syntax **text**
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={lIdx} className="mb-1 last:mb-0">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={pIdx} className="font-extrabold text-green-700 dark:text-green-400">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  {msg.role === "model" && (
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-1.5">
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-[10px] font-semibold text-zinc-500 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400 cursor-pointer"
                      >
                        {t.speakTip}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm shrink-0">
                  🤖
                </div>
                <div className="bg-zinc-150/70 dark:bg-zinc-900/70 p-3 rounded-2xl rounded-tl-xs border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 bg-green-550 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-green-550 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2.5 h-2.5 bg-green-550 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills */}
          {messages.length === 0 && (
            <div className="px-4 py-2 shrink-0 flex flex-wrap gap-1.5 border-t border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-900/20">
              {t.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-green-50 dark:hover:bg-green-950/20 text-zinc-700 dark:text-zinc-350 hover:text-green-700 dark:hover:text-green-400 border border-zinc-200 dark:border-zinc-800 hover:border-green-300 dark:hover:border-green-800 transition-colors cursor-pointer font-semibold"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Audio Wave Feedback */}
          {isListening && (
            <div className="px-4 py-1.5 shrink-0 bg-red-50/40 dark:bg-red-950/10 border-t border-red-100/30 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="font-semibold animate-pulse">{t.listening}</span>
              </div>
              <button
                onClick={toggleListening}
                className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 cursor-pointer"
              >
                {t.stop}
              </button>
            </div>
          )}

          {/* Input Footer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20 flex gap-2 items-center shrink-0"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? "bg-red-550 border-red-550 text-white animate-pulse"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
                title={isListening ? "Stop voice recognition" : "Start voice recognition"}
              >
                🎙️
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-green-600 hover:bg-green-650 text-white transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
}
