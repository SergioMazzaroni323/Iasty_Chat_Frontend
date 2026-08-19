export function formatApiError(message: string): string {
  try {
    const data = JSON.parse(message);
    const err = data?.error;
    if (err?.code === "unsupported_country_region_territory") {
      return (
        "OpenAI blocked this server's region/IP. Add OPENROUTER_API_KEY to Backend/.env " +
        "for automatic fallback, or set GPT_PROVIDER=openrouter."
      );
    }
    if (typeof err?.message === "string") return err.message;
  } catch {
    // not JSON
  }

  if (message.includes("unsupported_country_region_territory")) {
    return (
      "OpenAI blocked this server's region/IP. Add OPENROUTER_API_KEY to Backend/.env " +
      "for automatic fallback, or set GPT_PROVIDER=openrouter."
    );
  }

  return message;
}
