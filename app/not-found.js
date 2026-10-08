import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="solid-page">
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="plate plate--slab">
            <div className="plate__inner" style={{ textAlign: 'center' }}>
              <p className="eyebrow" style={{ color: '#fff' }}>404 · Wrong exit</p>
              <h1 style={{ fontSize: 'clamp(44px,7vw,84px)' }}>Page not found</h1>
              <Link href="/" className="btn btn-white">Back to Home</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
