import fs from "node:fs";
import path from "node:path";
import type {
  SponsorshipProfile,
  SponsorshipProgramme,
  SponsorshipSettings,
} from "./types";

const MAX_CONTENT_BYTES = 64 * 1024;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STORED_SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const CARD_SUMMARY_LENGTH = 240;
const AGE_GROUPS = new Set([
  "5–7 years",
  "8–10 years",
  "11–13 years",
  "14–17 years",
]);
const PROGRAMMES = new Set<SponsorshipProgramme>([
  "Education",
  "Care & wellbeing",
  "Education & care",
]);

const defaultSettings: SponsorshipSettings = {
  eyebrow: "Sponsor a child",
  heading: "Help a child build",
  headingAccent: "a brighter future.",
  introduction:
    "Stand alongside children in Malawi as they learn, grow, and look ahead. Your support can help An Nur respond to assessed education and care needs with dignity.",
  heroImage: "/editorial/education-story.png",
  heroImageAlt:
    "A teacher and children learning together in a classroom, shown as general programme context",
  sectionHeading: "Small acts of care. Possibilities for tomorrow.",
  sectionIntroduction:
    "Explore approved profiles and the opportunities support could help create. Names are public aliases and ages are shown in groups to protect each child's identity.",
  paymentUrl: null,
  paymentNote:
    "Contact An Nur to discuss current sponsorship options, support needs and payment arrangements. Our team can share an approved external payment page where applicable.",
  faqs: [
    {
      question: "What could my sponsorship support?",
      answer:
        "Support may contribute to education or everyday care, depending on a child's assessed needs and the programme available. An Nur can explain the current options before you make a commitment.",
    },
    {
      question: "How do I begin sponsoring a child?",
      answer:
        "Contact An Nur to discuss current sponsorship options and the support you would like to offer. Our team can explain the arrangements and share an approved external payment link where applicable.",
    },
    {
      question: "Why are names and ages presented this way?",
      answer:
        "Public profiles use aliases, age groups, and broad regions to protect children's privacy. Only information and imagery approved for public sharing should appear here.",
    },
    {
      question: "Can I choose the amount or frequency of support?",
      answer:
        "Please ask An Nur about the available sponsorship arrangements. Amounts, frequency, and any payment-provider terms should be confirmed before you give.",
    },
  ],
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(filePath: string): JsonObject | null {
  try {
    // Refuse links and oversized files; malformed content must not break the site.
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.size > MAX_CONTENT_BYTES) return null;
    const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

function textField(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (
    !text ||
    text.length > maxLength ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)
  ) {
    return null;
  }
  return text;
}

function isBlankText(value: unknown): boolean {
  return value === undefined || value === null ||
    (typeof value === "string" && !value.trim());
}

function optionalTextField(value: unknown, maxLength: number): string | null {
  return isBlankText(value) ? "" : textField(value, maxLength);
}

function profileSlugField(value: unknown): string | null {
  const slug = textField(value, 80);
  // Only normalize case, never remove characters or invent a new identifier.
  // ASCII validation before lowercasing avoids accepting Unicode lookalikes.
  return slug && STORED_SLUG_PATTERN.test(slug) ? slug.toLowerCase() : null;
}

function cardSummary(story: string): string {
  const text = story.replace(/\s+/g, " ").trim();
  const characters = Array.from(text);
  if (characters.length <= CARD_SUMMARY_LENGTH) return text;

  const excerpt = characters.slice(0, CARD_SUMMARY_LENGTH - 1);
  const lastSpace = excerpt.lastIndexOf(" ");
  // Prefer whole words; still bound long words without splitting Unicode pairs.
  const boundary = lastSpace >= Math.floor(excerpt.length / 2) ? lastSpace : excerpt.length;
  return `${excerpt.slice(0, boundary).join("").trimEnd()}…`;
}

function imageField(value: unknown): string | null {
  if (value === undefined || value === "") return "";
  const image = textField(value, 2048);
  if (
    !image ||
    !image.startsWith("/") ||
    image.startsWith("//") ||
    /[\u0000-\u001f\u007f\\?#]/.test(image) ||
    /(?:^|\/)\.\.(?:\/|$)/.test(image) ||
    /%2e|%2f|%5c/i.test(image)
  ) {
    return null;
  }
  return image;
}

function paymentUrlField(value: unknown): string | null {
  const text = textField(value, 2048);
  if (!text || !/^https:\/\//i.test(text) || /[\s\\]/.test(text)) return null;
  try {
    const url = new URL(text);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function supportAreasField(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) return null;
  const areas = value.map((area: unknown) => textField(area, 100));
  if (areas.some((area) => area === null)) return null;
  return [...new Set(areas as string[])];
}

function parseProfile(data: JsonObject, filename: string): SponsorshipProfile | null {
  // Drafts are not private storage. Only explicitly approved public records leave
  // this reader; publication and sponsorship availability are separate decisions.
  if (
    data.publicationStatus !== "published" ||
    data.publicationApproved !== true ||
    data.isDemo === true
  ) {
    return null;
  }

  const slug = profileSlugField(data.slug);
  const displayName = textField(data.displayName, 60);
  const ageGroup = textField(data.ageGroup, 30);
  const programme = textField(data.programme, 40);
  const region = textField(data.region, 100);
  // The single CMS description drives both the card and the full profile.
  // Preserve older summary-only entries without rewriting any stored content.
  const story = isBlankText(data.story)
    ? textField(data.summary, 500)
    : textField(data.story, 6000);
  const aspiration = optionalTextField(data.aspiration, 500);
  const supportAreas = supportAreasField(data.supportAreas);
  const image = imageField(data.image);
  const imageAlt =
    textField(data.imageAlt, 300) ?? (image === "" ? "Photograph not displayed" : null);
  const sponsorshipStatus = data.sponsorshipStatus;

  if (
    !slug ||
    !SLUG_PATTERN.test(slug) ||
    filename !== `${slug}.json` ||
    !displayName ||
    !ageGroup ||
    !AGE_GROUPS.has(ageGroup) ||
    !programme ||
    !PROGRAMMES.has(programme as SponsorshipProgramme) ||
    !region ||
    !story ||
    aspiration === null ||
    !supportAreas ||
    image === null ||
    !imageAlt ||
    (sponsorshipStatus !== "available" &&
      sponsorshipStatus !== "supported" &&
      sponsorshipStatus !== "paused")
  ) {
    return null;
  }

  return {
    slug,
    displayName,
    ageGroup,
    programme: programme as SponsorshipProgramme,
    region,
    summary: cardSummary(story),
    story,
    aspiration,
    supportAreas,
    image,
    imageAlt,
    publicationStatus: "published",
    sponsorshipStatus,
    featured: data.featured === true,
    order:
      typeof data.order === "number" &&
      Number.isSafeInteger(data.order) &&
      data.order >= 0 &&
      data.order <= 9999
        ? data.order
        : 100,
    paymentUrl: paymentUrlField(data.paymentUrl),
  };
}

export function getSponsorshipSettings(): SponsorshipSettings {
  const data = readJson(path.join(process.cwd(), "content", "sponsor-a-child.json")) ?? {};
  const faqs = Array.isArray(data.faqs)
    ? data.faqs.slice(0, 12).flatMap((faq: unknown) => {
        if (!isObject(faq)) return [];
        const question = textField(faq.question, 200);
        const answer = textField(faq.answer, 1500);
        return question && answer ? [{ question, answer }] : [];
      })
    : defaultSettings.faqs.map((faq) => ({ ...faq }));
  const heroImage = imageField(data.heroImage);
  const heroImageAlt = textField(data.heroImageAlt, 300);

  return {
    eyebrow: textField(data.eyebrow, 80) ?? defaultSettings.eyebrow,
    heading: textField(data.heading, 120) ?? defaultSettings.heading,
    headingAccent: textField(data.headingAccent, 120) ?? defaultSettings.headingAccent,
    introduction: textField(data.introduction, 1000) ?? defaultSettings.introduction,
    heroImage:
      data.heroImage === ""
        ? ""
        : heroImage && heroImageAlt
          ? heroImage
          : defaultSettings.heroImage,
    heroImageAlt:
      data.heroImage === ""
        ? ""
        : heroImage && heroImageAlt
          ? heroImageAlt
          : defaultSettings.heroImageAlt,
    sectionHeading: textField(data.sectionHeading, 160) ?? defaultSettings.sectionHeading,
    sectionIntroduction:
      textField(data.sectionIntroduction, 1000) ?? defaultSettings.sectionIntroduction,
    paymentUrl: paymentUrlField(data.paymentUrl),
    paymentNote: textField(data.paymentNote, 1000) ?? defaultSettings.paymentNote,
    faqs,
  };
}

export function getSponsorshipProfiles(): SponsorshipProfile[] {
  const directory = path.join(process.cwd(), "content", "sponsorships");
  let filenames: string[] = [];
  try {
    filenames = fs.readdirSync(directory).filter((filename) => filename.endsWith(".json"));
  } catch {
    // A new or empty CMS collection is a normal state.
  }

  const profiles = filenames
    .sort()
    .flatMap((filename) => {
      const data = readJson(path.join(directory, filename));
      const profile = data ? parseProfile(data, filename) : null;
      return profile ? [profile] : [];
    })
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        a.order - b.order ||
        a.slug.localeCompare(b.slug),
    );

  return profiles;
}

export function getSponsorshipProfileBySlug(slug: string): SponsorshipProfile | null {
  if (typeof slug !== "string" || slug.length > 80 || !SLUG_PATTERN.test(slug)) {
    return null;
  }
  return getSponsorshipProfiles().find((profile) => profile.slug === slug) ?? null;
}

export function formatSponsorshipStatus(profile: SponsorshipProfile): string {
  switch (profile.sponsorshipStatus) {
    case "available":
      return "Open for enquiries";
    case "supported":
      return "Currently supported";
    case "paused":
      return "Enquiries paused";
  }
}
