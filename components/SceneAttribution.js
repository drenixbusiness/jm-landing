'use client';

import { usePathname } from 'next/navigation';
import { SCENE_ROUTES } from '@/lib/site';

// CC BY 4.0 credit for the truck model; only shown on pages that render the 3D scene with it.
export default function SceneAttribution({ hasGlb }) {
  const pathname = usePathname();
  if (!hasGlb || !SCENE_ROUTES[pathname]) return null;
  return (
    <p className="site-footer__credit">
      This work is based on &quot;FREIGHTLINER CASCADIA 2020&quot; by liebherr996litronic (Sketchfab), licensed under CC BY 4.0.
    </p>
  );
}
