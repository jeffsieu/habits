"use client";

import { useState } from "react";
import { inspirationalQuotes, Quote } from "@/lib/quotes";

export function useRandomQuote(): Quote {
  const [quote] = useState<Quote>(() => {
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    return inspirationalQuotes[randomIndex];
  });

  return quote;
}
