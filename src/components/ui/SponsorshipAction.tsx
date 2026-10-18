import type { SponsorshipProfile, SponsorshipSettings } from "@/lib/sponsorship/types";

export default function SponsorshipAction({ profile, settings }: {
  profile?: SponsorshipProfile;
  settings: SponsorshipSettings;
}) {
  const available = !profile || profile.sponsorshipStatus === "available";
  const paymentUrl = !available ? null : profile?.paymentUrl || settings.paymentUrl;
  const subject = profile
    ? `Child sponsorship enquiry — ${profile.slug}`
    : "Child sponsorship enquiry";
  const contactUrl = `mailto:info@annurmw.com?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="sponsor-payment-action">
      {paymentUrl ? (
        <>
          <a className="sponsor-button sponsor-button--primary" href={paymentUrl} target="_blank" rel="noopener noreferrer">
            Continue to payment <span aria-hidden="true">↗</span>
            <span className="sponsor-sr-only"> (opens the external payment site in a new tab)</span>
          </a>
          <p className="sponsor-payment-note">Payment takes place on a separate site. Availability and sponsorship arrangements are confirmed by An Nur.</p>
        </>
      ) : !available ? (
        <>
          <button type="button" className="sponsor-button sponsor-button--primary" disabled>
            Not open for sponsorship
          </button>
          <p className="sponsor-payment-note">
            Our team can help you explore other ways to support a child.
          </p>
        </>
      ) : (
        <>
          <a className="sponsor-button sponsor-button--primary" href={contactUrl}>
            Enquire about sponsorship <span aria-hidden="true">↗</span>
          </a>
          <p className="sponsor-payment-note">{settings.paymentNote}</p>
        </>
      )}
      {(paymentUrl || !available) && (
        <a className="sponsor-contact-link" href={contactUrl}>
          Have a question? Email our team <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}
