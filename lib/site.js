// Shared company constants.
export const PHONE_MAIN = { label: '+1 (331) 264-4343', short: '+1 331 264 4343', tel: 'tel:+13312644343' };
export const PHONE_OO = { label: '(331) 264-8196', tel: 'tel:+13312648196' };
export const PHONE_OO_2 = { label: '(312) 796-2626', tel: 'tel:+13127962626' };
export const EMAIL = 'hr@joshua-llc.com';
export const ADDRESS = '21W311 Ahlstrand Rd, Lombard, IL 60148';
export const YARD_ADDRESS = 'Caterpillar Dr, Oswego, IL 60543';
export const INSTAGRAM = 'https://www.instagram.com/joshuameuzelaarllc/';
export const FACEBOOK = 'https://www.facebook.com/joshuameuzelaarllc';
export const PRESENTATION_PDF = 'https://drive.google.com/uc?export=download&id=1COs9aOnF3Nfea4b8z48voovjKOKLk-cV';

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/owner-operators', label: 'Owner Operators' },
  { href: '/trucks', label: 'Trucks' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

// Pages rendered over the live 3D highway, with the section ids that drive the camera.
// `keys` picks camera keyframes (0–6) when a page has fewer than 7 sections.
export const SCENE_ROUTES = {
  '/': { ids: ['home-top', 'services', 'plans', 'proud', 'reviews', 'faq', 'home-contact'] },
  '/owner-operators': { ids: ['top', 'pricing', 'calculator', 'settlement', 'why', 'requirements', 'contact'] },
  '/jobs': { ids: ['jobs-top', 'why-work', 'apply'], keys: [0, 4, 6] },
  '/about': { ids: ['about-top', 'founding', 'mission', 'growth', 'network', 'brokers', 'about-contact'] },
  '/contact': { ids: ['contact-top', 'history', 'contact-form'], keys: [0, 1, 5] },
  '/apply': { ids: ['apply-top'], keys: [0] },
};

// Short 10DLC-compliant opt-in: brand, purpose, frequency, rates, STOP/HELP, "not a condition", policy links.
// (The last sentence is rendered as links by the form — keep it exactly "Privacy Policy & Terms.")
export const SMS_CONSENT =
  'I agree to receive recruiting and application SMS from Joshua Meuzelaar LLC at the number provided. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of employment. Privacy Policy & Terms.';
