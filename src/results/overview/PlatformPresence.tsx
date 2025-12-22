import { getPlatformPresence } from "@/results/data/analyticsData";
import { Globe, CheckCircle2, XCircle } from "lucide-react";

/**
 * Fix common URL issues
 */
const cleanUrl = (url: string): string => {
  if (!url || typeof url !== "string") return "";

  let cleaned = url.trim();

  // Fix double domain issues (e.g., wikipedia.orgorg → wikipedia.org)
  cleaned = cleaned.replace(/\.([a-z]+)\1(?=\/)/gi, ".$1");

  // Ensure proper protocol
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = "https://" + cleaned;
  }

  return cleaned;
};

/**
 * Extract base domain from full URL
 * Example: https://reddit.com/some/path → https://reddit.com
 */
const extractDomain = (url: string): string => {
  try {
    const cleaned = cleanUrl(url);
    if (!cleaned) return "";
    return new URL(cleaned).origin;
  } catch {
    return "";
  }
};

const FAVICON_URL_TEMPLATE =
  import.meta.env.VITE_FAVICON_URL_TEMPLATE || 'https://www.google.com/s2/favicons?domain={domain}&sz=128';

/**
 * Generate favicon URL using env template
 */
const faviconFromUrl = (url: string): string => {
  if (!url) return "";

  const domain = extractDomain(url);
  if (!domain) return "";

  return FAVICON_URL_TEMPLATE.replace("{domain}", domain);
};

/**
 * Auto-generate labels from keys
 * Example: product_hunt → Product Hunt
 */
const autoLabel = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const PlatformPresence = () => {
  const platformPresence = getPlatformPresence();

  const platforms = Object.entries(platformPresence).map(([key, url]) => {
    const cleanedUrl = cleanUrl(url as string);

    return {
      key,
      label: autoLabel(key),
      icon: faviconFromUrl(cleanedUrl),
      status: cleanedUrl ? "present" : "missing",
    };
  });

  const presentCount = platforms.filter(
    (p) => p.status === "present"
  ).length;

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Platform Presence Summary
          </h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {presentCount}/{platforms.length} platforms
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Brand presence on key AI-relevant platforms
      </p>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {platforms.map((platform) => (
          <div
            key={platform.key}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              platform.status === "present"
                ? "border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            {/* ICON + LABEL */}
            <div className="flex items-center gap-2">
              <img
                src={platform.icon}
                alt={platform.label}
                className="w-5 h-5 rounded-full object-contain bg-white flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="font-medium text-sm text-foreground">
                {platform.label}
              </span>
            </div>

            {/* STATUS INDICATOR ONLY (NO LINKS) */}
            {platform.status === "present" ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
