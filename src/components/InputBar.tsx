"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Globe, Image as ImageIcon, Mic, Paperclip, Send, Volume2, X } from "lucide-react";
import { ChatAttachment, api, getSendMode, SendMode, setSendMode } from "@/lib/api";
import { formatApiError } from "@/lib/formatError";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AdditionalDataMultiSelect } from "./AdditionalDataMultiSelect";
import { HoverChip } from "./HoverChip";

const MAX_LINES = 5;
const MODEL_UNAVAILABLE = "This model didn't available at this version";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
const FILE_ACCEPT = `.pdf,application/pdf,${IMAGE_ACCEPT}`;

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read image"));
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

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
  onSend: (content: string, attachment?: ChatAttachment) => void;
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
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [parsingAttachment, setParsingAttachment] = useState(false);
  const [attachError, setAttachError] = useState("");
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
  const attachmentRef = useRef(attachment);
  attachmentRef.current = attachment;

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
    if ((!trimmed && !attachmentRef.current) || disabled || parsingAttachment) return;
    onSend(trimmed, attachmentRef.current ?? undefined);
    setValue("");
    setAttachment(null);
    setAttachError("");
    clearSpeechError();
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.overflowY = "hidden";
      }
    });
  }, [clearSpeechError, disabled, onSend, parsingAttachment, stopSpeech]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setParsingAttachment(true);
    setAttachError("");
    try {
      if (isPdfFile(file)) {
        const parsed = await api.parsePdf(file);
        setAttachment({
          kind: "pdf",
          filename: parsed.filename,
          text: parsed.text,
          pageCount: parsed.page_count,
          tokenEstimate: parsed.token_estimate,
        });
        return;
      }

      if (!isImageFile(file)) {
        throw new Error("Unsupported file. Attach a PDF or image (PNG, JPEG, WEBP, GIF).");
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error("Image exceeds 4MB limit");
      }

      const dataUrl = await readFileAsDataUrl(file);
      const mime = file.type || "image/jpeg";
      setAttachment({
        kind: "image",
        filename: file.name || "image",
        mime,
        dataUrl,
      });
    } catch (err) {
      setAttachError(err instanceof Error ? formatApiError(err.message) : "Failed to attach file");
      setAttachment(null);
    } finally {
      setParsingAttachment(false);
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
      if (trimmed && !disabled && !parsingAttachment && !attachmentRef.current) {
        handleSend();
      }
    });
  }, [disabled, handleSend, parsingAttachment, voiceReplyEnabled]);

  const beginVoiceInput = useCallback(() => {
    if (!speechSupported || disabled || parsingAttachment) return;
    startSpeech(appendFinalTranscript, handleVoiceSessionEnd);
  }, [
    appendFinalTranscript,
    disabled,
    handleVoiceSessionEnd,
    parsingAttachment,
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

  const canSend = Boolean(value.trim() || attachment);
  const voiceInputDisabled = disabled || parsingAttachment || !speechSupported;
  const voiceModeDisabled = disabled || !voiceModeSupported;

  return (
    <div className="p-4 pt-2">
      <div className="surface-3d rounded-2xl">
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={handleFileSelect}
        />

        {attachment?.kind === "pdf" && (
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
                {attachment.filename}
              </span>
              <span className="shrink-0 text-xs" style={{ color: "var(--fg-muted)" }}>
                {attachment.pageCount} pg · ~{attachment.tokenEstimate.toLocaleString()} tokens
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="btn-icon h-8 w-8"
              aria-label="Remove PDF"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {attachment?.kind === "image" && (
          <div
            className="flex items-center gap-2 px-4 pt-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm"
              style={{
                background: "color-mix(in srgb, var(--accent-from) 8%, var(--bg-elevated))",
                border: "1px solid color-mix(in srgb, var(--accent-from) 15%, transparent)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.dataUrl}
                alt={attachment.filename}
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <ImageIcon size={13} style={{ color: "var(--accent-from)" }} />
                  <span className="truncate" style={{ color: "var(--fg-primary)" }}>
                    {attachment.filename}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Use a vision model (GPT-4o, Claude, Gemini…)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="btn-icon h-8 w-8"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {(attachError || speechError) && (
          <p className="px-4 pt-3 text-xs" style={{ color: "#ef4444" }}>
            {attachError || speechError}
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
            <HoverChip label="Attach PDF or image" icon={<Paperclip size={13} />} placement="top">
              <button
                type="button"
                disabled={disabled || parsingAttachment}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach PDF or image"
                className={`btn-icon h-9 w-9 ${attachment ? "active" : ""} ${disabled || parsingAttachment ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <Paperclip size={16} />
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
              disabled={disabled || !canSend || parsingAttachment}
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
