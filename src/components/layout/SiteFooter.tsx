import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site-data";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="doc-container footer-grid">
        <div className="footer-brand-col">
          <Link className="brand brand--footer" href="/">
            <span className="brand-mark brand-mark--image" aria-hidden="true">
              <Image
                src="/annur-logo.jpg"
                alt="An Nur Charity Foundation Logo"
                width={44}
                height={44}
                className="brand-logo-img"
              />
            </span>
            <span className="brand-text">
              <strong>AN NUR</strong>
              <span>Charity Foundation</span>
            </span>
          </Link>
          <p className="footer-copy">
            {site.description}
          </p>
        </div>

        <div className="footer-col">
          <h3>Explore</h3>
          <ul className="footer-links">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/about#vision-mission">Vision &amp; Mission</Link></li>
            <li><Link href="/about#madinah-model">The Madinah Model</Link></li>
            <li><Link href="/impact-stories">Impact Stories</Link></li>
            <li><Link href="/sponsor-a-child">Sponsor a Child</Link></li>
            <li><Link href="/gallery/all">Photo Gallery</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Our Work</h3>
          <ul className="footer-links">
            <li><Link href="/our-work/education">Education</Link></li>
            <li><Link href="/our-work/agriculture">Agricultural Development</Link></li>
            <li><Link href="/our-work/orphan-care">Islamic Center &amp; Boarding</Link></li>
            <li><Link href="/our-work/social-welfare">Social Welfare</Link></li>
            <li><Link href="/our-work/economic-empowerment">Economic Empowerment</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Trust &amp; Governance</h3>
          <ul className="footer-trust-list">
            <li><span>✓</span> Registered Non-Profit</li>
            <li><span>✓</span> Government Recognized</li>
            <li><span>✓</span> CONGOMA Member</li>
            <li><span>✓</span> 0% Management Fees</li>
          </ul>
        </div>
      </div>

      <div className="doc-container footer-sub">
        <p>© {new Date().getFullYear()} An Nur Charity Foundation. All rights reserved.</p>
        <div className="footer-sub-links">
          <Link href="/contact">Contact &amp; Inquiries</Link>
          <span aria-hidden="true">&bull;</span>
          <Link href="/about">Strategic Vision 2050</Link>
        </div>
      </div>
    </footer>
  );
}
