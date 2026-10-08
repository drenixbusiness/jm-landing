'use client';

import { useState } from 'react';
import { PlusIcon } from './Icons';

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="accordion">
      {items.map(([q, a], i) => {
        const on = open === i;
        return (
          <div className="accordion__item" data-open={on} key={q}>
            <h3>
              <button type="button" className="accordion__q" aria-expanded={on} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(on ? -1 : i)}>
                <span>{q}</span>
                <PlusIcon className="accordion__icon" />
              </button>
            </h3>
            <div className="accordion__a" id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!on}>
              <p>{a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
