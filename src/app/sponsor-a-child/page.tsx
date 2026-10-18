import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import Icon from "@/components/ui/Icon";
import SponsorshipAction from "@/components/ui/SponsorshipAction";
import SponsorshipBrowser from "@/components/sections/SponsorshipBrowser";
import { getSponsorshipProfiles, getSponsorshipSettings } from "@/lib/sponsorship/content";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Sponsor a Child",
  description: "Help make room for a child's future. Explore child sponsorship with An Nur Charity Foundation in Malawi.",
  alternates: { canonical: `${site.url}/sponsor-a-child` },
  openGraph: {
    title: "Sponsor a Child | An Nur Charity Foundation",
    description: "Care today. Possibility tomorrow. Explore child sponsorship with An Nur in Malawi.",
    url: `${site.url}/sponsor-a-child`,
    type: "website",
  },
};

const supportAreas = [
  { icon: "graduation" as const, title: "Room to learn", text: "Education can open doors. Help create space for learning, curiosity and the confidence to keep going." },
  { icon: "heart" as const, title: "Care that matters", text: "Consistent care helps children feel valued. Support a thoughtful approach to everyday wellbeing and dignity." },
  { icon: "community" as const, title: "A stronger tomorrow", text: "A child's future belongs within a thriving community. Support that grows with families can create lasting possibility." },
];

const steps = [
  { title: "Find a connection", text: "Explore approved profiles and the programmes behind them. Learn about each child's interests and the support being sought." },
  { title: "Speak with our team", text: "Contact An Nur to discuss current sponsorship options, the support needed and the payment arrangements." },
  { title: "Choose with clarity", text: "Before you commit, ask about the support covered, the sponsorship terms and how you can stay informed." },
];

export default function SponsorAChildPage() {
  const settings = getSponsorshipSettings();
  const profiles = getSponsorshipProfiles();

  return (
    <>
      <SiteHeader />
      <main className="sponsor-page" id="sponsor-main">
        <section className="sponsor-hero" aria-labelledby="sponsor-title">
          <div className="doc-container sponsor-hero__layout">
            <div className="sponsor-hero__copy">
              <p className="sponsor-eyebrow"><span aria-hidden="true" />{settings.eyebrow}</p>
              <h1 className="sponsor-hero__title" id="sponsor-title">{settings.heading}<span>{settings.headingAccent}</span></h1>
              <p className="sponsor-hero__lead">{settings.introduction}</p>
              <div className="sponsor-actions">
                <a className="sponsor-button sponsor-button--primary" href="#meet-the-children">Explore profiles <span aria-hidden="true">→</span></a>
                <a className="sponsor-button sponsor-button--secondary" href="#how-it-works">How sponsorship works</a>
              </div>
              <p className="sponsor-hero__note"><span aria-hidden="true"><Icon name="shield" size={18} /></span>Rooted in dignity. Guided by community.</p>
            </div>
            <figure className="sponsor-hero__figure">
              <div className="sponsor-hero__image">
                {settings.heroImage ? (
                  <Image src={settings.heroImage} alt={settings.heroImageAlt} fill priority sizes="(max-width: 960px) 100vw, 560px" />
                ) : <div className="sponsor-portrait-placeholder"><Icon name="graduation" size={72} /></div>}
                <div className="sponsor-hero__seal">
                  <span aria-hidden="true"><Icon name="leaf" size={24} /></span>
                  <div><strong>Small beginnings.</strong><span>Lasting possibilities.</span></div>
                </div>
              </div>
              <figcaption className="sponsor-hero__caption">Programme context, not an individual sponsorship profile.</figcaption>
            </figure>
          </div>
        </section>

        <section className="sponsor-promise-strip" aria-label="Our approach to sponsorship">
          <div className="doc-container sponsor-promise-strip__inner">
            {[
              { icon: "heart" as const, title: "Dignity comes first", text: "Every child is more than a story." },
              { icon: "graduation" as const, title: "Opportunity to grow", text: "Care, learning and possibility." },
              { icon: "community" as const, title: "Connected to community", text: "Part of An Nur's wider work." },
            ].map((item) => (
              <div className="sponsor-promise" key={item.title}>
                <span aria-hidden="true"><Icon name={item.icon} size={23} /></span>
                <div><strong>{item.title}</strong><span>{item.text}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="sponsor-section" id="meet-the-children" aria-labelledby="sponsor-profiles-title">
          <div className="doc-container">
            <div className="sponsor-section-heading">
              <div><p className="sponsor-eyebrow">A future worth nurturing</p><h2 className="sponsor-section__title" id="sponsor-profiles-title">{settings.sectionHeading}</h2></div>
              <p>{settings.sectionIntroduction}</p>
            </div>
            <SponsorshipBrowser profiles={profiles} />
          </div>
        </section>

        <section className="sponsor-section sponsor-section--tint" aria-labelledby="sponsor-support-title">
          <div className="doc-container">
            <div className="sponsor-section-heading">
              <div><p className="sponsor-eyebrow">More than a contribution</p><h2 className="sponsor-section__title" id="sponsor-support-title">Make room for possibility.</h2></div>
              <p>The right support is shaped around a child's needs. Our team will explain what each sponsorship covers before you commit.</p>
            </div>
            <div className="sponsor-support-grid">
              {supportAreas.map((item, index) => (
                <article className="sponsor-support-card" key={item.title}>
                  <div className="sponsor-support-card__top"><span aria-hidden="true"><Icon name={item.icon} size={28} /></span><span className="sponsor-support-card__number">0{index + 1}</span></div>
                  <h3>{item.title}</h3><p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sponsor-section" id="how-it-works" aria-labelledby="sponsor-how-title">
          <div className="doc-container">
            <div className="sponsor-section-heading">
              <div><p className="sponsor-eyebrow">A clear path to getting involved</p><h2 className="sponsor-section__title" id="sponsor-how-title">A connection. A commitment.<br />A new possibility.</h2></div>
              <p>Choose with care and begin with clarity. Your questions, the sponsorship arrangements and a child's dignity all matter.</p>
            </div>
            <ol className="sponsor-steps">
              {steps.map((step, index) => <li key={step.title}><span className="sponsor-step__number" aria-hidden="true">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}
            </ol>
            <div className="sponsor-quote"><p className="sponsor-eyebrow">The heart of our work</p><blockquote>A little care today.<br />A world of possibility tomorrow.</blockquote><p>From relief to self-reliance, one thoughtful step at a time.</p></div>
          </div>
        </section>

        <section className="sponsor-section sponsor-section--tint" aria-labelledby="sponsor-faq-title">
          <div className="doc-container sponsor-faq-layout">
            <div><p className="sponsor-eyebrow">Good questions. Clear answers.</p><h2 className="sponsor-section__title" id="sponsor-faq-title">Before you begin.</h2><p className="sponsor-faq-introduction">We want you to feel informed, not rushed. If you would like to know more, our team is here to help.</p><a className="sponsor-contact-link" href="mailto:info@annurmw.com?subject=Child%20sponsorship%20question">Ask our team <span aria-hidden="true">↗</span></a></div>
            <div className="sponsor-faq-list">
              {settings.faqs.map((faq) => <details className="sponsor-faq" key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}
            </div>
          </div>
        </section>

        <section className="sponsor-section" aria-labelledby="sponsor-final-title">
          <div className="doc-container">
            <div className="sponsor-final-panel">
              <div><p className="sponsor-eyebrow">Be part of what comes next</p><h2 className="sponsor-section__title" id="sponsor-final-title">Your care can be<br />someone's beginning.</h2><p>Explore a connection, ask a question, or learn more about the community behind every child.</p></div>
              <div><SponsorshipAction settings={settings} /><Link className="sponsor-contact-link" href="/our-work">Discover An Nur's work <span aria-hidden="true">→</span></Link></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
