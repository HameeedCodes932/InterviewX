import en from "@/messages/en.json";

export type Locale = "en";
export type Messages = typeof en;

const catalogs: Record<Locale, Messages> = {
  en,
};

export const defaultLocale: Locale = "en";

/** Simple dictionary lookup. Swap catalogs when adding Urdu / other locales. */
export function getMessages(locale: Locale = defaultLocale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale];
}

export function t(
  messages: Messages,
  path: string,
  vars?: Record<string, string>,
): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  if (typeof cur !== "string") return path;
  if (!vars) return cur;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    cur,
  );
}
