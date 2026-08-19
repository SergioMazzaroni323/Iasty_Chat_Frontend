"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Globe, Mic, Send, Volume2, X } from "lucide-react";
import { AttachedPdf, api, getSendMode, SendMode, setSendMode } from "@/lib/api";
import { formatApiError } from "@/lib/formatError";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AdditionalDataMultiSelect } from "./AdditionalDataMultiSelect";
import { HoverChip } from "./HoverChip";
const MAX_LINES = 5;
const MODEL_UNAVAILABLE = "This model didn't available at this version";

export type VoiceControls = {
  startListening: () => void;
  stopListening: () => void;
};

interface InputBarProps {
  models: { id: string; name: string; available: boolean }[];
  allowedModels: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  additionalData: { id: number; name: string }[];
  selectedAdditionalDataIds: number[];
  onAdditionalDataChange: (ids: number[]) => void;
  webSearchEnabled: boolean;
  canUseWebSearch: boolean;
  webSearchConfigured?: boolean;
  onWebSearchToggle: () => void;
  voiceReplyEnabled: boolean;
  voiceReplySupported: boolean;
  onVoiceReplyToggle: () => void;
  onRegisterVoiceControls?: (controls: VoiceControls) => void;
  onSend: (content: string, document?: AttachedPdf) => void;
  disabled?: boolean;
  initialValue?: string;
}

export function InputBar({
  models,
  allowedModels,
  selectedModel,
  onModelChange,
  additionalData,
  selectedAdditionalDataIds,
  onAdditionalDataChange,
  webSearchEnabled,
  canUseWebSearch,
  webSearchConfigured = true,
  onWebSearchToggle,
  voiceReplyEnabled,
  voiceReplySupported,
  onVoiceReplyToggle,
  onRegisterVoiceControls,
  onSend,
  disabled,
  initialValue = "",
}: InputBarProps) {
  const [value, setValue] = useState(initialValue);
  const [sendMode, setSendModeState] = useState<SendMode>("enter");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [attachedPdf, setAttachedPdf] = useState<AttachedPdf | null>(null);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    supported: speechSupported,
    listening,
    interimTranscript,
    error: speechError,
    start: startSpeech,
    toggle: toggleSpeech,
    stop: stopSpeech,
    clearError: clearSpeechError,
  } = useSpeechRecognition();

  const valueRef = useRef(value);
  valueRef.current = value;
  const attachedPdfRef = useRef(attachedPdf);
  attachedPdfRef.current = attachedPdf;

  const composedValue =
    value + (interimTranscript ? `${value && !value.endsWith(" ") ? " " : ""}${interimTranscript}` : "");

  useEffect(() => {
    setValue(initialValue);
    stopSpeech();
  }, [initialValue, stopSpeech]);

  useEffect(() => {
    setSendModeState(getSendMode());
  }, []);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const maxHeight = lineHeight * MAX_LINES + padding;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [composedValue, initialValue]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tierModels = models.filter((m) => allowedModels.includes(m.id));
  const selectedModelInfo =
    tierModels.find((m) => m.id === selectedModel) ??
    tierModels.find((m) => m.available) ??
    tierModels[0];

  const handleSend = useCallback(() => {
    stopSpeech();
    const trimmed = valueRef.current.trim();
    if ((!trimmed && !attachedPdfRef.current) || disabled || parsingPdf) return;
    onSend(trimmed, attachedPdfRef.current ?? undefined);
    setValue("");
    setAttachedPdf(null);
    setPdfError("");
    clearSpeechError();
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.overflowY = "hidden";
      }
    });
  }, [clearSpeechError, disabled, onSend, parsingPdf, stopSpeech]);

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setParsingPdf(true);
    setPdfError("");
    try {
      const parsed = await api.parsePdf(file);
      setAttachedPdf({
        filename: parsed.filename,
        text: parsed.text,
        pageCount: parsed.page_count,
        tokenEstimate: parsed.token_estimate,
      });
    } catch (err) {
      setPdfError(err instanceof Error ? formatApiError(err.message) : "Failed to parse PDF");
      setAttachedPdf(null);
    } finally {
      setParsingPdf(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const enterToSend = sendMode === "enter";
    const isSendKey = enterToSend
      ? e.key === "Enter" && !e.shiftKey
      : e.key === "Enter" && e.shiftKey;

    if (isSendKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const changeSendMode = (mode: SendMode) => {
    setSendModeState(mode);
    setSendMode(mode);
    setDropdownOpen(false);
  };

  const webActive = canUseWebSearch && webSearchConfigured && webSearchEnabled;
  const webTooltip = !canUseWebSearch
    ? "Web search requires Plus plan"
    : !webSearchConfigured
      ? "Web search is not available at this version"
      : webSearchEnabled
        ? "Turn off Web Search"
        : "Turn on Web Search";

  const handleTextChange = (nextValue: string) => {
    if (listening) stopSpeech();
    clearSpeechError();
    setValue(nextValue);
  };

  const appendFinalTranscript = useCallback((text: string) => {
    const chunk = text.trim();
    if (!chunk) return;
    setValue((prev) => {
      const trimmed = prev.trimEnd();
      const next = trimmed ? `${trimmed} ${chunk}` : chunk;
      valueRef.current = next;
      return next;
    });
  }, []);

  const handleVoiceSessionEnd = useCallback(() => {
    if (!voiceReplyEnabled) return;
    requestAnimationFrame(() => {
      const trimmed = valueRef.current.trim();
      if (trimmed && !disabled && !parsingPdf && !attachedPdfRef.current) {
        handleSend();
      }
    });
  }, [disabled, handleSend, parsingPdf, voiceReplyEnabled]);

  const beginVoiceInput = useCallback(() => {
    if (!speechSupported || disabled || parsingPdf) return;
    startSpeech(appendFinalTranscript, handleVoiceSessionEnd);
  }, [
    appendFinalTranscript,
    disabled,
    handleVoiceSessionEnd,
    parsingPdf,
    speechSupported,
    startSpeech,
  ]);

  useEffect(() => {
    onRegisterVoiceControls?.({
      startListening: beginVoiceInput,
      stopListening: stopSpeech,
    });
  }, [beginVoiceInput, onRegisterVoiceControls, stopSpeech]);

  useEffect(() => {
    if (!voiceReplyEnabled) {
      stopSpeech();
    }
  }, [voiceReplyEnabled, stopSpeech]);

  const voiceModeSupported = speechSupported && voiceReplySupported;
  const voiceModeActive = voiceModeSupported && voiceReplyEnabled;
  const voiceModeTooltip = !voiceModeSupported
    ? "Voice mode is not supported in this browser"
    : voiceReplyEnabled
      ? "Turn off voice mode"
      : "Turn on voice mode (speak and hear replies)";

  const voiceInputTooltip = !speechSupported
    ? "Voice input is not supported in this browser"
    : listening
      ? "Stop listening"
      : voiceModeActive
        ? "Start listening"
        : "Voice input";

  const canSend = Boolean(value.trim() || attachedPdf);
  const voiceInputDisabled = disabled || parsingPdf || !speechSupported;
  const voiceModeDisabled = disabled || !voiceModeSupported;

  return (
    <div className="p-4 pt-2">
      <div className="surface-3d rounded-2xl">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handlePdfSelect}
        />

        {attachedPdf && (
          <div
            className="flex items-center gap-2 px-4 pt-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm"
              style={{
                background: "color-mix(in srgb, var(--accent-from) 8%, var(--bg-elevated))",
                border: "1px solid color-mix(in srgb, var(--accent-from) 15%, transparent)",
              }}
            >
              <FileText size={15} style={{ color: "var(--accent-from)" }} />
              <span className="min-w-0 truncate" style={{ color: "var(--fg-primary)" }}>
                {attachedPdf.filename}
              </span>
              <span className="shrink-0 text-xs" style={{ color: "var(--fg-muted)" }}>
                {attachedPdf.pageCount} pg · ~{attachedPdf.tokenEstimate.toLocaleString()} tokens
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedPdf(null)}
              className="btn-icon h-8 w-8"
              aria-label="Remove PDF"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {(pdfError || speechError) && (
          <p className="px-4 pt-3 text-xs" style={{ color: "#ef4444" }}>
            {pdfError || speechError}
          </p>
        )}

        <textarea
          ref={textareaRef}
          value={composedValue}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? "Listening..." : "Ask anything..."}
          rows={1}
          disabled={disabled}
          className="block min-h-[52px] w-full resize-none bg-transparent px-5 py-4 text-[0.9375rem] leading-relaxed outline-none"
          style={{ color: "var(--fg-primary)" }}
        />

        <div
          className="relative flex items-center justify-between gap-3 overflow-visible px-3 py-2.5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-visible">
            <HoverChip label="Attach PDF" icon={<FileText size={13} />} placement="top">
              <button
                type="button"
                disabled={disabled || parsingPdf}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach PDF"
                className={`btn-icon h-9 w-9 ${attachedPdf ? "active" : ""} ${disabled || parsingPdf ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <FileText size={16} />
              </button>
            </HoverChip>

            <HoverChip label={webTooltip} icon={<Globe size={13} />} placement="top">
              <button
                type="button"
                disabled={!canUseWebSearch || !webSearchConfigured}
                onClick={onWebSearchToggle}
                aria-pressed={webActive}
                aria-label={webTooltip}
                className={`btn-icon h-9 w-9 ${webActive ? "active" : ""} ${!canUseWebSearch || !webSearchConfigured ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <Globe size={16} />
              </button>
            </HoverChip>

            <HoverChip label={voiceInputTooltip} icon={<Mic size={13} />} placement="top">
              <button
                type="button"
                disabled={voiceInputDisabled}
                onClick={() => toggleSpeech(appendFinalTranscript, handleVoiceSessionEnd)}
                aria-pressed={listening}
                aria-label={voiceInputTooltip}
                className={`btn-icon h-9 w-9 ${listening || (voiceModeActive && listening) ? "active" : ""} ${voiceInputDisabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <Mic size={16} />
              </button>
            </HoverChip>

            <HoverChip label={voiceModeTooltip} icon={<Volume2 size={13} />} placement="top">
              <button
                type="button"
                disabled={voiceModeDisabled}
                onClick={onVoiceReplyToggle}
                aria-pressed={voiceModeActive}
                aria-label={voiceModeTooltip}
                className={`btn-icon h-9 w-9 ${voiceModeActive ? "active" : ""} ${voiceModeDisabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <Volume2 size={16} />
              </button>
            </HoverChip>

            <div className="relative min-w-0 flex-1 sm:max-w-[180px] sm:flex-none" ref={modelMenuRef}>
              <button
                type="button"
                onClick={() => setModelMenuOpen((open) => !open)}
                disabled={disabled}
                className="input-field flex h-9 w-full items-center justify-between gap-1 truncate px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="truncate">{selectedModelInfo?.name ?? "Model"}</span>
                <ChevronDown size={14} className="shrink-0" />
              </button>
              {modelMenuOpen && (
                <div className="dropdown-menu absolute bottom-full left-0 z-20 mb-2 max-h-60 w-full min-w-[180px] overflow-y-auto py-1">
                  {tierModels.map((model) => {
                    const isSelected = model.id === selectedModel;
                    const button = (
                      <button
                        type="button"
                        disabled={!model.available}
                        onClick={() => {
                          if (!model.available) return;
                          onModelChange(model.id);
                          setModelMenuOpen(false);
                        }}
                        className={`dropdown-item w-full ${isSelected ? "active" : ""} ${!model.available ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        {model.name}
                      </button>
                    );

                    if (!model.available) {
                      return (
                        <HoverChip key={model.id} label={MODEL_UNAVAILABLE} placement="top">
                          <div className="w-full">{button}</div>
                        </HoverChip>
                      );
                    }

                    return <div key={model.id}>{button}</div>;
                  })}
                </div>
              )}
            </div>

            <AdditionalDataMultiSelect
              items={additionalData}
              selectedIds={selectedAdditionalDataIds}
              onChange={onAdditionalDataChange}
              disabled={disabled}
            />
          </div>

          <div className="flex shrink-0 overflow-hidden rounded-xl">
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !canSend || parsingPdf}
              className="btn-primary flex h-9 items-center gap-2 rounded-l-xl rounded-r-none px-4 text-sm"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn-icon h-9 w-8 rounded-l-none rounded-r-xl"
                style={{ borderLeft: "none" }}
              >
                <ChevronDown size={15} />
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu absolute bottom-full right-0 mb-2 w-52 py-1">
                  <button
                    onClick={() => changeSendMode("enter")}
                    className={`dropdown-item ${sendMode === "enter" ? "active" : ""}`}
                  >
                    Enter to send {sendMode === "enter" && "✓"}
                  </button>
                  <button
                    onClick={() => changeSendMode("shift-enter")}
                    className={`dropdown-item ${sendMode === "shift-enter" ? "active" : ""}`}
                  >
                    Shift + Enter to send {sendMode === "shift-enter" && "✓"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
