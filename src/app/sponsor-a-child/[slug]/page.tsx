import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import Icon from "@/components/ui/Icon";
import SponsorshipAction from "@/components/ui/SponsorshipAction";
import { SponsorshipPortrait } from "@/components/sections/SponsorshipBrowser";
import { getSponsorshipProfiles, getSponsorshipProfileBySlug, getSponsorshipSettings } from "@/lib/sponsorship/content";
import { site } from "@/lib/site-data";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  const profiles = getSponsorshipProfiles();
  // Next's static export requires a parameter even before the first publication.
  // This sentinel returns notFound and never becomes a profile or a sitemap entry.
  return profiles.length ? profiles.map(({ slug }) => ({ slug })) : [{ slug: "_unpublished" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = getSponsorshipProfileBySlug(slug);
  if (!profile) return { robots: { index: false, follow: false } };
  return {
    title: `Meet ${profile.displayName} · Sponsor a Child`,
    description: profile.summary,
    alternates: { canonical: `${site.url}/sponsor-a-child/${profile.slug}` },
    openGraph: { title: `Meet ${profile.displayName} | An Nur`, description: profile.summary, url: `${site.url}/sponsor-a-child/${profile.slug}`, type: "website" },
  };
}

export default async function SponsorshipProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = getSponsorshipProfileBySlug(slug);
  if (!profile) notFound();
  const settings = getSponsorshipSettings();

  return (
    <>
      <SiteHeader />
      <main className="sponsor-page sponsor-detail-page">
        <section className="sponsor-section">
          <div className="doc-container">
            <nav className="sponsor-breadcrumb" aria-label="Breadcrumb"><Link href="/sponsor-a-child">← Sponsor a Child</Link><span aria-hidden="true">/</span><span>{profile.displayName}</span></nav>
            <div className="sponsor-detail-layout">
              <article>
                <div className="sponsor-detail-media"><SponsorshipPortrait profile={profile} priority /></div>
                <div className="sponsor-detail-copy">
                  <p className="sponsor-eyebrow">{profile.programme} · {profile.region}</p>
                  <h1 className="sponsor-hero__title">Meet <span>{profile.displayName}.</span></h1>
                  <p className="sponsor-hero__lead">{profile.summary}</p>
                  <dl className="sponsor-detail-facts"><div><dt>Age group</dt><dd>{profile.ageGroup}</dd></div><div><dt>Programme</dt><dd>{profile.programme}</dd></div><div><dt>Region</dt><dd>{profile.region}</dd></div></dl>
                  <div className="sponsor-detail-story"><h2>A little about {profile.displayName}</h2>{profile.story.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                  {profile.aspiration && <div className="sponsor-aspiration"><span aria-hidden="true"><Icon name="spark" size={24} /></span><div><h2>Looking ahead</h2><p>{profile.aspiration}</p></div></div>}
                </div>
              </article>
              <aside className="sponsor-detail-sidebar" aria-label="Sponsorship details">
                <div className="sponsor-payment-card">
                  <span className={`sponsor-status sponsor-status--${profile.sponsorshipStatus}`}>{profile.sponsorshipStatus === "available" ? "Open for enquiries" : profile.sponsorshipStatus === "supported" ? "Currently supported" : "Enquiries paused"}</span>
                  <h2>Be part of a brighter beginning.</h2><p>Take a thoughtful next step. Our team will confirm the support covered and the arrangements for this sponsorship.</p>
                  {profile.supportAreas.length > 0 && <><h3>Support being sought</h3><ul className="sponsor-support-list">{profile.supportAreas.map((area) => <li key={area}><span aria-hidden="true">✓</span>{area}</li>)}</ul></>}
                  <SponsorshipAction profile={profile} settings={settings} />
                </div>
                <div className="sponsor-safeguard-note"><span aria-hidden="true"><Icon name="shield" size={22} /></span><p>Every child's dignity matters. Profiles use approved public information; personal contact details and private case records are not shared here.</p></div>
              </aside>
            </div>
          </div>
        </section>
        <section className="sponsor-section sponsor-section--tint"><div className="doc-container sponsor-final-panel"><div><p className="sponsor-eyebrow">Part of something bigger</p><h2 className="sponsor-section__title">Children grow within communities.</h2><p>Discover how An Nur connects education, care and self-reliance across Malawi.</p></div><Link className="sponsor-button sponsor-button--secondary" href="/our-work">Explore our work <span aria-hidden="true">→</span></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
