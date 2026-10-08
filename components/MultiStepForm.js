'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { SMS_CONSENT } from '@/lib/site';

// Config-driven multi-step form.
// steps: Field[][]; Field = { name, label, type, required, options, max, accept, hint, error, unit, placeholder }
// type: text | email | tel | number | textarea | select | choice | file | check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Placeholders by field name (a field's own `placeholder` wins).
const PH_BY_NAME = {
  fullName: 'John Smith',
  name: 'John Smith',
  email: 'john.smith@example.com',
  age: 'e.g. 32',
  experienceLength: 'e.g. 3',
  truckModelYear: 'e.g. Freightliner Cascadia 2020',
  question: 'Type your question here…',
};
const PH_BY_TYPE = { tel: '+1 (___) ___-____', email: 'john.smith@example.com', textarea: 'Type your message…' };
const placeholderFor = (f) => f.placeholder || PH_BY_NAME[f.name] || PH_BY_TYPE[f.type];

// US phone mask: "3125550199" → "+1 (312) 555-0199". A leading country code 1 is dropped.
const usDigits = (v) => {
  let d = String(v).replace(/\D/g, '');
  if (d.startsWith('1')) d = d.slice(1);
  return d.slice(0, 10);
};
export function formatUSPhone(v) {
  const d = usDigits(v);
  if (!d) return '';
  let out = `+1 (${d.slice(0, 3)}`;
  if (d.length > 3) out += `) ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6)}`;
  return out;
}

function ConsentText({ text }) {
  if (text !== SMS_CONSENT) return text;
  // The consent text ends with "Privacy Policy & Terms." — render those as links (required for 10DLC review).
  const head = text.replace(/Privacy Policy & Terms\.$/, '');
  return (
    <>
      {head}<Link href="/privacy-policy">Privacy Policy</Link> &amp; <Link href="/terms-and-conditions">Terms</Link>.
    </>
  );
}

const initialValue = (f) => {
  if (f.type === 'choice') return [];
  if (f.type === 'check') return false;
  if (f.type === 'file') return null;
  return '';
};

export default function MultiStepForm({ id, steps, submitLabel = 'Submit', success, className = '' }) {
  const uid = useId();
  const all = steps.flat();
  const [values, setValues] = useState(() => {
    const v = {};
    for (const f of all) {
      v[f.name] = initialValue(f);
      if (f.unit) v[f.unit.name] = f.unit.options[0];
    }
    return v;
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | sending | done | failed

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };

  const validate = (fields) => {
    const errs = {};
    for (const f of fields) {
      const v = values[f.name];
      const empty = v == null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
      if (f.required && empty) errs[f.name] = f.error || (f.type === 'choice' ? 'Please choose an option.' : 'This field is required.');
      else if (f.type === 'email' && v && !EMAIL_RE.test(v)) errs[f.name] = f.error || 'Please enter a valid email address.';
      else if (f.type === 'tel' && v && usDigits(v).length !== 10) errs[f.name] = 'Please enter a valid US phone number: +1 (XXX) XXX-XXXX.';
      else if (f.type === 'file' && v && f.maxMB && v.size > f.maxMB * 1024 * 1024) errs[f.name] = `File is larger than ${f.maxMB} MB.`;
    }
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) document.getElementById(`${uid}-${first}`)?.focus();
    return !first;
  };

  const next = () => {
    if (validate(steps[step])) setStep((s) => s + 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (step < steps.length - 1) return next();
    if (!validate(steps[step])) return;
    setStatus('sending');
    const fd = new FormData();
    fd.append('form', id);
    fd.append('page', location.pathname);
    for (const f of all) {
      const v = values[f.name];
      if (f.type === 'file') { if (v) fd.append(f.name, v); }
      else fd.append(f.name, Array.isArray(v) ? v.join(', ') : String(v));
      if (f.unit) fd.append(f.unit.name, values[f.unit.name]);
    }
    try {
      const res = await fetch('/api/lead', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  const reset = () => {
    const v = {};
    for (const f of all) {
      v[f.name] = initialValue(f);
      if (f.unit) v[f.unit.name] = f.unit.options[0];
    }
    setValues(v);
    setErrors({});
    setStep(0);
    setStatus('idle');
  };

  if (status === 'done') {
    return (
      <div className={`form-success ${className}`} role="status">
        <div className="form-success__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h3>{success.title}</h3>
        <p>{success.text}</p>
        <button type="button" className="link-btn" onClick={reset}>Send another</button>
      </div>
    );
  }

  const multi = steps.length > 1;
  const fields = steps[step];

  return (
    <form className={`mform ${className}`} onSubmit={submit} noValidate>
      {multi && (
        <div className="mform__progress">
          <div className="mform__steplabel">STEP {step + 1} OF {steps.length}</div>
          <div className="mform__bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}>
            <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      )}
      <div className="mform__fields">
        {fields.map((f) => (
          <Field key={f.name} f={f} id={`${uid}-${f.name}`} value={values[f.name]} unitValue={f.unit ? values[f.unit.name] : null} error={errors[f.name]} set={set} />
        ))}
      </div>
      {status === 'failed' && (
        <p className="mform__fail" role="alert">We couldn&apos;t send that right now. Please try again or call +1 (331) 264-4343.</p>
      )}
      <div className="mform__actions">
        {multi && step > 0 && (
          <button type="button" className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>Back</button>
        )}
        <button type="submit" className="btn btn-primary mform__go" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : step < steps.length - 1 ? 'Next' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ f, id, value, unitValue, error, set }) {
  const errId = `${id}-err`;
  const common = {
    id,
    name: f.name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : f.hint ? `${id}-hint` : undefined,
  };
  const label = (
    <span className="mfield__label">
      {f.label}
      {f.required && <span className="req" aria-hidden="true"> *</span>}
    </span>
  );

  let control;
  switch (f.type) {
    case 'textarea':
      control = <textarea {...common} className="input" rows={4} value={value} placeholder={placeholderFor(f)} onChange={(e) => set(f.name, e.target.value)} />;
      break;
    case 'select':
      control = (
        <select {...common} className="input" value={value} onChange={(e) => set(f.name, e.target.value)}>
          <option value="">{f.placeholder || 'Select…'}</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case 'choice': {
      const max = f.max || 1;
      control = (
        <div className="pills" role="group" aria-labelledby={`${id}-lbl`} id={id} tabIndex={-1}>
          {f.options.map((o) => {
            const on = value.includes(o);
            return (
              <button
                type="button"
                key={o}
                className="pill"
                aria-pressed={on}
                onClick={() => {
                  if (max === 1) set(f.name, on ? [] : [o]);
                  else if (on) set(f.name, value.filter((x) => x !== o));
                  else if (value.length < max) set(f.name, [...value, o]);
                }}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case 'file':
      control = (
        <label className={`dropbox ${value ? 'has-file' : ''}`} htmlFor={id}>
          <input {...common} type="file" accept={f.accept} className="sr-only" onChange={(e) => set(f.name, e.target.files?.[0] || null)} />
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="dropbox__name">{value ? value.name : 'Choose a file or drop it here'}</span>
        </label>
      );
      break;
    case 'check':
      return (
        <div className="mfield">
          <label className="check">
            <input {...common} type="checkbox" checked={value} onChange={(e) => set(f.name, e.target.checked)} />
            <span className="check__box" aria-hidden="true" />
            <span className="check__text"><ConsentText text={f.text} /></span>
          </label>
          {error && <p className="mfield__error" id={errId}>{error}</p>}
        </div>
      );
    default:
      control = (
        <input
          {...common}
          className="input"
          type={f.type}
          value={value}
          placeholder={placeholderFor(f)}
          inputMode={f.type === 'tel' ? 'tel' : f.type === 'number' ? 'numeric' : undefined}
          autoComplete={f.autoComplete}
          maxLength={f.type === 'tel' ? 17 : undefined}
          min={f.type === 'number' ? 0 : undefined}
          onChange={(e) => {
            if (f.type !== 'tel') return set(f.name, e.target.value);
            const next = e.target.value;
            // Backspacing over mask punctuation (")", " ", "-") should delete the digit before it.
            const removedOnlyMask = next.length < value.length && usDigits(next).length === usDigits(value).length;
            const digits = removedOnlyMask ? usDigits(next).slice(0, -1) : usDigits(next);
            set(f.name, formatUSPhone(digits));
          }}
        />
      );
  }

  return (
    <div className="mfield">
      {f.type === 'choice' ? <span id={`${id}-lbl`}>{label}</span> : <label htmlFor={id}>{label}</label>}
      {f.unit ? (
        <div className="unit-row">
          {control}
          <div className="seg seg--sm" role="group" aria-label={`${f.label} unit`}>
            {f.unit.options.map((o) => (
              <button type="button" key={o} aria-pressed={unitValue === o} onClick={() => set(f.unit.name, o)}>{o}</button>
            ))}
          </div>
        </div>
      ) : control}
      {f.hint && !error && <p className="mfield__hint" id={`${id}-hint`}>{f.hint}</p>}
      {error && <p className="mfield__error" id={errId}>{error}</p>}
    </div>
  );
}
