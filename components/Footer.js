import Link from 'next/link';
import { ADDRESS, EMAIL, FACEBOOK, INSTAGRAM, PHONE_MAIN } from '@/lib/site';
import SceneAttribution from './SceneAttribution';

export default function Footer({ hasGlb }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <img src="/assets/jm-lockup-white.png" alt="Joshua Meuzelaar Express Trucking" className="site-footer__logo" width="1629" height="312" loading="lazy" />
            <p className="muted">Dry van transportation across the United States since 2020.</p>
          </div>
          <div>
            <p className="eyebrow">Pages</p>
            <ul className="site-footer__list">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/owner-operators">Owner Operators</Link></li>
              <li><Link href="/trucks">Trucks</Link></li>
              <li><Link href="/jobs">Jobs</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/apply">Driver Application</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Contact</p>
            <ul className="site-footer__list">
              <li><a href={PHONE_MAIN.tel}>{PHONE_MAIN.short}</a> <span className="faint">(Any time 24/7)</span></li>
              <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              <li className="muted">{ADDRESS}</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Follow</p>
            <ul className="site-footer__list">
              <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={FACEBOOK} target="_blank" rel="noopener noreferrer">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© 2025 - JOSHUA MEUZELAAR LLC</span>
          <span className="site-footer__legal">
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/terms-and-conditions">Terms and Conditions</Link>
          </span>
        </div>
        <SceneAttribution hasGlb={hasGlb} />
      </div>
    </footer>
  );
}
