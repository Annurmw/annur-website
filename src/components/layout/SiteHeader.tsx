"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import DonationModal from "@/components/ui/DonationModal";
import Icon from "@/components/ui/Icon";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Our Work", href: "/our-work" },
  { label: "Stories", href: "/impact-stories" },
  { label: "Gallery", href: "/gallery/all" },
  { label: "Contact", href: "/contact" },
];

function LogoMark() {
  return (
    <span className="brand-mark brand-mark--image" aria-hidden="true">
      <Image
        src="/annur-logo.jpg"
        alt="An Nur Charity Foundation Logo"
        width={44}
        height={44}
        className="brand-logo-img"
        priority
      />
    </span>
  );
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = donateOpen || menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [donateOpen, menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setDonateOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="AN NUR Charity Foundation home">
            <LogoMark />
            <span className="brand-text">
              <strong>AN NUR</strong>
              <span>Charity Foundation</span>
            </span>
          </Link>

          <button
            className="nav-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
          </button>

          <nav id="primary-navigation" className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link className="nav-sponsor-link" href="/sponsor-a-child" onClick={() => setMenuOpen(false)}>
              Sponsor a Child
            </Link>
          </nav>

          <div className="header-actions">
            <Link className="header-sponsor-link" href="/sponsor-a-child">
              Sponsor a Child
            </Link>
            <button className="btn btn-primary" type="button" onClick={() => setDonateOpen(true)}>
              <span aria-hidden="true" className="btn-icon">
                <Icon name="heart" size={18} />
              </span>
              <span>Donate Now</span>
            </button>
          </div>
        </div>
      </header>

      <DonationModal
        isOpen={donateOpen}
        onClose={() => setDonateOpen(false)}
      />
    </>
  );
}
