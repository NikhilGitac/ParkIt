"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Bot,
  User,
  Car,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  ChevronRight,
  Loader2,
  RotateCcw,
  Compass,
  Zap,
  Info,
} from "lucide-react";
import { ParkingSpace, GREATER_NOIDA_CENTER } from "@/lib/parking-data";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  suggestedSpaces?: ParkingSpace[];
  timestamp: string;
  isAiPowered?: boolean;
}

const QUICK_PROMPTS = [
  "Find parking under ₹50 for 2 hours",
  "Covered parking near Pari Chowk",
  "EV charging spot near Knowledge Park",
  "Cheapest parking spot nearby",
];

export default function AssistantView() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: "Hello! I'm your ParKit AI Concierge. Tell me where you're heading, your budget, or vehicle preferences, and I'll find and reserve the best verified spots for you.",
      timestamp: "Just now",
      isAiPowered: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Acquire driver location
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          });
        },
        () => {
          setUserLocation(GREATER_NOIDA_CENTER);
        },
        { timeout: 6000 }
      );
    } else {
      setUserLocation(GREATER_NOIDA_CENTER);
    }
  }, []);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isSubmitting) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend.trim(),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          user_location: userLocation || GREATER_NOIDA_CENTER,
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            sender: "assistant",
            text: data.response,
            suggestedSpaces: data.suggested_spaces || [],
            timestamp: "Just now",
            isAiPowered: data.ai_powered || false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            sender: "assistant",
            text: "I couldn't reach the parking service. Please check your network or select a spot directly from the map.",
            timestamp: "Just now",
          },
        ]);
      }
    } catch (err) {
      console.error("Assistant chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: "assistant",
          text: "I'm having trouble connecting right now. You can still browse all available spaces directly on the driver map.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "msg-welcome-reset",
        sender: "assistant",
        text: "Chat cleared! How can I help you find parking today?",
        timestamp: "Just now",
        isAiPowered: true,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/driver"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] hover:text-[#26b878] transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Map</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-[#0B1F3A] text-[#2FD08A] flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 fill-[#2FD08A]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2FD08A] ring-2 ring-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base text-[#0B1F3A] leading-none">
                  ParKit Concierge
                </h1>
                <span className="text-[10px] font-bold bg-[#FFC93C]/30 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-full">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Always active • Greater Noida, UP
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            title="Reset Chat"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <Link
            href="/driver"
            className="text-xs font-extrabold bg-[#0B1F3A] hover:bg-[#163359] text-white px-3 py-1.5 rounded-xl shadow-xs transition-colors"
          >
            Map View
          </Link>
        </div>
      </header>

      {/* Chat Messages Feed */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Sender Label & Avatar */}
            <div
              className={`flex items-center gap-2 mb-1.5 text-[11px] font-bold ${
                msg.sender === "user" ? "text-slate-500" : "text-emerald-700"
              }`}
            >
              {msg.sender === "assistant" && (
                <>
                  <div className="w-5 h-5 rounded-md bg-[#0B1F3A] text-[#2FD08A] flex items-center justify-center">
                    <Sparkles className="w-3 h-3 fill-[#2FD08A]" />
                  </div>
                  <span>ParKit Assistant</span>
                  {msg.isAiPowered && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 rounded">
                      Gemini
                    </span>
                  )}
                </>
              )}
              {msg.sender === "user" && (
                <>
                  <span>You</span>
                  <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                </>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-2xl max-w-lg sm:max-w-xl text-xs sm:text-sm leading-relaxed shadow-soft ${
                msg.sender === "user"
                  ? "bg-[#0B1F3A] text-white rounded-tr-xs"
                  : "bg-white text-[#0B1F3A] border border-slate-200/90 rounded-tl-xs"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>

            {/* Requirement 6: Suggested Parking Cards directly under the AI response */}
            {msg.suggestedSpaces && msg.suggestedSpaces.length > 0 && (
              <div className="mt-3.5 w-full max-w-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 px-1">
                  <Car className="w-3.5 h-3.5 text-[#2FD08A]" />
                  <span>Recommended Parking Bays ({msg.suggestedSpaces.length})</span>
                </div>

                <div className="space-y-2.5">
                  {msg.suggestedSpaces.map((space, idx) => (
                    <div
                      key={space.id}
                      className="bg-white rounded-2xl p-3 border border-slate-200 shadow-soft hover:shadow-soft-lg hover:border-[#2FD08A] transition-all flex flex-col sm:flex-row items-center gap-3.5 group"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-28 h-28 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <Image
                          src={
                            space.photo_url ||
                            "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={space.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-[#FFC93C] text-[#0B1F3A] text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                            Best match
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-[#0B1F3A]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur">
                          ₹{space.price_per_hour}/hr
                        </div>
                      </div>

                      {/* Info & Action */}
                      <div className="flex-1 min-w-0 w-full space-y-1 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-[#0B1F3A] truncate">
                            {space.title}
                          </h4>
                          <div className="flex items-center gap-0.5 text-xs font-bold text-[#0B1F3A] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 shrink-0">
                            <Star className="w-3 h-3 fill-[#FFC93C] text-[#FFC93C]" />
                            <span>{space.rating}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#2FD08A] shrink-0" />
                          <span className="truncate">{space.address}</span>
                        </p>

                        <div className="pt-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {space.distance_km ? `${Math.round(space.distance_km * 1000)}m away` : "Nearby"}
                          </span>

                          <Link
                            href={`/driver/space/${space.id}`}
                            className="inline-flex items-center gap-1 bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                          >
                            <span>Book Now</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing / Processing indicator */}
        {isSubmitting && (
          <div className="flex flex-col items-start space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700">
              <div className="w-5 h-5 rounded-md bg-[#0B1F3A] text-[#2FD08A] flex items-center justify-center">
                <Sparkles className="w-3 h-3 fill-[#2FD08A]" />
              </div>
              <span>ParKit Concierge</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-soft flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2FD08A]" />
              <span className="text-xs text-slate-500 font-medium">
                Searching verified bays and availability...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Suggested Quick Prompts */}
      <div className="px-4 sm:px-6 py-2 bg-slate-100/70 border-t border-slate-200/60 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
            Suggestions:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isSubmitting}
              className="shrink-0 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0B1F3A] px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Input Field */}
      <footer className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for parking (e.g. Under ₹50 near Pari Chowk for 2 hours)..."
              disabled={isSubmitting}
              className="w-full bg-slate-50 focus:bg-white text-xs sm:text-sm font-medium text-[#0B1F3A] placeholder:text-slate-400 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#2FD08A] focus:ring-2 focus:ring-[#2FD08A]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              !inputText.trim() || isSubmitting
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#2FD08A] hover:bg-[#26b878] text-[#0B1F3A] shadow-soft hover:shadow-md active:scale-95"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0B1F3A]" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
