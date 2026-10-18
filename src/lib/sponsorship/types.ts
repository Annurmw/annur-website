export type SponsorshipProgramme =
  | "Education"
  | "Care & wellbeing"
  | "Education & care";

export type SponsorshipProfile = {
  slug: string;
  displayName: string;
  ageGroup: string;
  programme: SponsorshipProgramme;
  region: string;
  summary: string;
  story: string;
  aspiration: string;
  supportAreas: string[];
  image: string;
  imageAlt: string;
  publicationStatus: "draft" | "published";
  sponsorshipStatus: "available" | "supported" | "paused";
  featured: boolean;
  order: number;
  paymentUrl: string | null;
};

export type SponsorshipSettings = {
  eyebrow: string;
  heading: string;
  headingAccent: string;
  introduction: string;
  heroImage: string;
  heroImageAlt: string;
  sectionHeading: string;
  sectionIntroduction: string;
  paymentUrl: string | null;
  paymentNote: string;
  faqs: { question: string; answer: string }[];
};
