"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang = "en-US") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef<(text: string) => void>(() => {});
  const onSessionEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    setSupported(true);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      if (finalText.trim()) {
        onFinalRef.current(finalText);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      const message =
        event.error === "not-allowed"
          ? "Microphone access was denied."
          : event.error === "no-speech"
            ? "No speech detected. Try again."
            : "Voice input failed. Try again.";
      setError(message);
      setListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");
      onSessionEndRef.current?.();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]);

  const stop = useCallback(() => {
    onSessionEndRef.current = null;
    recognitionRef.current?.stop();
    setListening(false);
    setInterimTranscript("");
  }, []);

  const start = useCallback(
    (onFinal: (text: string) => void, onSessionEnd?: () => void) => {
      const recognition = recognitionRef.current;
      if (!recognition) return;

      onFinalRef.current = onFinal;
      onSessionEndRef.current = onSessionEnd ?? null;
      setError("");
      setInterimTranscript("");

      try {
        recognition.start();
        setListening(true);
      } catch {
        recognition.stop();
        try {
          recognition.start();
          setListening(true);
        } catch {
          setError("Could not start voice input.");
        }
      }
    },
    []
  );

  const toggle = useCallback(
    (onFinal: (text: string) => void, onSessionEnd?: () => void) => {
      if (listening) {
        stop();
        return;
      }
      start(onFinal, onSessionEnd);
    },
    [listening, start, stop]
  );

  const clearError = useCallback(() => setError(""), []);

  return {
    supported,
    listening,
    interimTranscript,
    error,
    start,
    stop,
    toggle,
    clearError,
  };
}
