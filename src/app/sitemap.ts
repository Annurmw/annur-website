import type { MetadataRoute } from "next";
import { getImpactStories } from "@/lib/content";
import { getSponsorshipProfiles } from "@/lib/sponsorship/content";
import {
  galleryCategories,
  partners,
  programs,
  site,
} from "@/lib/site-data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const impactStories = getImpactStories();

  return [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    {
      url: `${site.url}/about`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/impact-stories`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/sponsor-a-child`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...getSponsorshipProfiles().map((profile) => ({
      url: `${site.url}/sponsor-a-child/${profile.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...programs.map((item) => ({
      url: `${site.url}/our-work/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...impactStories.map((item) => ({
      url: `${site.url}/impact-stories/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...galleryCategories
      .filter((item) => item.slug !== "all")
      .map((item) => ({
        url: `${site.url}/gallery/${item.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ...partners.map((item) => ({
      url: `${site.url}/partners/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
