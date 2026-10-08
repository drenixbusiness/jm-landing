'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SCENE_ROUTES } from '@/lib/site';

// One persistent WebGL canvas for the whole site. It is created on the first 3D page,
// paused (and hidden) on solid pages like the truck catalog, and re-targeted to the
// current page's sections on every client-side navigation.
export default function SceneBackground({ glbUrl, signFont }) {
  const pathname = usePathname();
  const cfg = SCENE_ROUTES[pathname];
  const canvasRef = useRef(null);
  const ctl = useRef(null);
  const starting = useRef(false);
  const unmounted = useRef(false);
  const cfgRef = useRef(cfg);
  const [live, setLive] = useState(false);
  cfgRef.current = cfg;

  useEffect(() => {
    document.documentElement.dataset.scene = cfg ? 'on' : 'off';
    if (!cfg) {
      ctl.current?.setPaused(true);
      return;
    }
    if (ctl.current) {
      ctl.current.setPaused(false);
      // Wait for the new page's sections to be laid out.
      requestAnimationFrame(() => ctl.current?.setSections(cfg.ids, cfg.keys));
      return;
    }
    if (starting.current) return;
    starting.current = true;
    const tod = new URLSearchParams(location.search).get('tod') || 'auto';
    const start = () =>
      import('@/lib/scene')
        .then(({ initScene }) => {
          const c = cfgRef.current || cfg;
          return initScene(canvasRef.current, { ids: c.ids, keys: c.keys, timeOfDay: tod, glbUrl, fontFamily: signFont });
        })
        .then((teardown) => {
          if (unmounted.current) return teardown();
          ctl.current = teardown;
          const c = cfgRef.current;
          if (!c) teardown.setPaused(true);
          else teardown.setSections(c.ids, c.keys);
          setLive(true);
        })
        .catch((err) => {
          console.warn('[scene] WebGL unavailable, showing static background', err);
        })
        .finally(() => { starting.current = false; });
    // Let the page paint first, then boot the scene.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
    idle(start, { timeout: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      ctl.current?.();
      ctl.current = null;
    };
  }, []);

  return (
    <div className="scene" data-active={cfg ? 'true' : 'false'} data-live={live ? 'true' : 'false'} aria-hidden="true">
      <canvas ref={canvasRef} className="scene__canvas" />
      <div className="scene__vignette" />
    </div>
  );
}
