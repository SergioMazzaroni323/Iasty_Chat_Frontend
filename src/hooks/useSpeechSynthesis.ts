"use client";

import { useCallback, useEffect, useState } from "react";
import { markdownToPlainText } from "@/lib/markdownToPlainText";

export function useSpeechSynthesis(lang = "en-US") {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (markdown: string, onComplete?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      const text = markdownToPlainText(markdown);
      if (!text) {
        onComplete?.();
        return;
      }

      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onend = () => {
        setSpeaking(false);
        onComplete?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onComplete?.();
      };

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [lang, stop]
  );

  return { supported, speaking, speak, stop };
}
