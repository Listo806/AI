import React, { useState } from "react";

export default function Buy() {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "👋 Hi there! I’m your AI Property Finder. Tell me what kind of home you’re looking for — location, budget, or style!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { from: "user", text: input.trim() };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const aiMessage = {
        from: "ai",
        text:
          "Great! Based on your request, here are a few options I’d recommend. In the future, I’ll show live listings from our AI Matchmaker system.",
      };
      setMessages((m) => [...m, aiMessage]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white text-gray-800">
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-semibold text-sm">
              AI
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-wide text-gray-900">ListoQasa</span>
              <span className="text-xs text-gray-500 -mt-0.5">AI Real Estate</span>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Home
          </button>
        </nav>
      </header>

      <main className="flex flex-col flex-grow items-center justify-center pt-32 pb-16 px-4">
        <h1 className="text-4xl md:text-5xl font-light italic text-gray-900 mb-6 text-center">
          Find Your Dream Home — <span className="text-blue-600">Powered by AI</span>
        </h1>
        <p className="text-gray-600 text-center max-w-2xl mb-12">
          Ask me anything about homes, condos, or investments — I’ll search and match properties based on your goals.
        </p>

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm ${
                    m.from === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 text-sm px-4 py-2 rounded-2xl rounded-bl-none animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex border-t border-gray-100">
            <input
              type="text"
              className="flex-grow px-4 py-3 text-sm outline-none"
              placeholder="Type your question or property request..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition"
            >
              Send
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Future version will use real AI responses and live data from Listo Qasa’s property network.
        </p>
      </main>
    </div>
  );
}

