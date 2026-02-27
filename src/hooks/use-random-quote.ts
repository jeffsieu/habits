"use client";

import { useState, useEffect } from "react";
import { inspirationalQuotes, Quote } from "@/lib/quotes";

export function useRandomQuote(): Quote | null {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    setQuote(inspirationalQuotes[randomIndex]);
  }, []);

  return quote;
}
