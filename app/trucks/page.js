import TruckCatalog from '@/components/TruckCatalog';
import { PhoneIcon } from '@/components/Icons';
import { getTrucks } from '@/lib/trucks';
import { PHONE_MAIN } from '@/lib/site';

export const revalidate = 600;

export const metadata = {
  title: 'Truck Catalog',
  description: 'Browse available Volvo, Peterbilt, International and Freightliner trucks at Joshua Meuzelaar LLC. See photos, pay and location, then call recruiting.',
};

export default async function TrucksPage() {
  const trucks = await getTrucks();
  return (
    <div className="solid-page">
      <section className="trucks-hero">
        <div className="container trucks-hero__grid">
          <div>
            <p className="eyebrow">JOSHUA MEUZELAAR LLC · THE FLEET</p>
            <h1>Find your next truck.</h1>
            <p className="lead">Explore the photos. Get the details. Talk to recruiting.</p>
          </div>
          <div className="plate plate--slab count-badge">
            <div className="plate__inner">
              <b className="tnum">{trucks.length}</b>
              <span>trucks in the catalog</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <TruckCatalog trucks={trucks} />
          <div className="plate plate--slab cta-plate" style={{ marginTop: 'clamp(40px,6vw,72px)' }}>
            <div className="plate__inner">
              <h2>Found your next truck? Call to confirm availability and next steps.</h2>
              <a href={PHONE_MAIN.tel} className="btn btn-white"><PhoneIcon />{PHONE_MAIN.label}</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
