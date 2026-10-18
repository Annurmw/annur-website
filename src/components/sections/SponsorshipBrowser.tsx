"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import type { SponsorshipProfile } from "@/lib/sponsorship/types";

const statusLabels = {
  available: "Open for enquiries",
  supported: "Currently supported",
  paused: "Enquiries paused",
};

export function SponsorshipPortrait({
  profile,
  priority = false,
}: {
  profile: SponsorshipProfile;
  priority?: boolean;
}) {
  if (profile.image) {
    return (
      <Image
        src={profile.image}
        alt={profile.imageAlt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 380px"
        className="sponsor-profile-image"
      />
    );
  }

  return (
    <div className={`sponsor-portrait-placeholder sponsor-portrait-placeholder--${profile.order % 3}`}>
      <span aria-hidden="true"><Icon name="graduation" size={56} /></span>
      <span>Photograph not displayed</span>
    </div>
  );
}

export default function SponsorshipBrowser({ profiles }: { profiles: SponsorshipProfile[] }) {
  const [query, setQuery] = useState("");
  const [programme, setProgramme] = useState("all");
  const [ageGroup, setAgeGroup] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const programmes = [...new Set(profiles.map((profile) => profile.programme))].sort();
  const ageGroups = [...new Set(profiles.map((profile) => profile.ageGroup))].sort((a, b) => parseInt(a) - parseInt(b));
  const hasFilters = Boolean(query.trim() || programme !== "all" || ageGroup !== "all");

  const visibleProfiles = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
    return profiles.filter((profile) => {
      const matchesQuery = !normalizedQuery ||
        [profile.displayName, profile.summary, profile.programme, profile.region]
          .join(" ").toLocaleLowerCase().includes(normalizedQuery);
      return matchesQuery && (programme === "all" || profile.programme === programme) &&
        (ageGroup === "all" || profile.ageGroup === ageGroup);
    });
  }, [profiles, deferredQuery, programme, ageGroup]);

  function clearFilters() {
    setQuery("");
    setProgramme("all");
    setAgeGroup("all");
  }

  if (profiles.length === 0) {
    return (
      <div className="sponsor-empty-state">
        <span aria-hidden="true"><Icon name="heart" size={32} /></span>
        <h3>A thoughtful beginning.</h3>
        <p>Contact An Nur to discuss current child sponsorship options and how you can help.</p>
        <a className="sponsor-button sponsor-button--secondary" href="mailto:info@annurmw.com?subject=Child%20sponsorship%20enquiry">
          Contact our team <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  return (
    <div className="sponsor-browser">
      <div className="sponsor-filter-panel" role="search" aria-label="Find a sponsorship profile">
        <label className="sponsor-filter sponsor-filter--search" htmlFor="sponsor-search">
          <span>Find a profile</span>
          <input
            id="sponsor-search"
            type="search"
            placeholder="Search a name or programme"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-controls="sponsor-profiles"
          />
        </label>
        <label className="sponsor-filter" htmlFor="sponsor-programme">
          <span>Programme</span>
          <select id="sponsor-programme" value={programme} onChange={(event) => setProgramme(event.target.value)} aria-controls="sponsor-profiles">
            <option value="all">All programmes</option>
            {programmes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="sponsor-filter" htmlFor="sponsor-age">
          <span>Age group</span>
          <select id="sponsor-age" value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} aria-controls="sponsor-profiles">
            <option value="all">All age groups</option>
            {ageGroups.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className="sponsor-results-line">
        <p role="status" aria-live="polite" aria-atomic="true">
          {visibleProfiles.length} {visibleProfiles.length === 1 ? "profile" : "profiles"} to explore
        </p>
        {hasFilters && <button type="button" onClick={clearFilters}>Clear filters <span aria-hidden="true">×</span></button>}
      </div>

      <div id="sponsor-profiles">
        {visibleProfiles.length === 0 ? (
          <div className="sponsor-empty-state">
            <span aria-hidden="true"><Icon name="search" size={32} /></span>
            <h3>No profiles match just yet.</h3>
            <p>Try another name, programme or age group, or clear your filters to browse all profiles.</p>
            <button type="button" className="sponsor-button sponsor-button--secondary" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="sponsor-profile-grid">
            {visibleProfiles.map((profile) => (
              <article className="sponsor-card" key={profile.slug}>
                <div className="sponsor-card__media"><SponsorshipPortrait profile={profile} /></div>
                <div className="sponsor-card__body">
                  <span className={`sponsor-status sponsor-status--${profile.sponsorshipStatus}`}>
                    {statusLabels[profile.sponsorshipStatus]}
                  </span>
                  <p className="sponsor-card__eyebrow">{profile.programme}</p>
                  <h3 className="sponsor-card__title">Meet {profile.displayName}</h3>
                  <p className="sponsor-card__meta"><span>{profile.ageGroup}</span><span>{profile.region}</span></p>
                  <p className="sponsor-card__summary">{profile.summary}</p>
                  <div className="sponsor-card__footer">
                    <Link href={`/sponsor-a-child/${profile.slug}`} aria-label={`Read ${profile.displayName}'s profile`}>
                      Read profile <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
