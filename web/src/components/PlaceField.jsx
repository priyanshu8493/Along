import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { PinIcon, SearchIcon, XIcon } from './Icons.jsx';

export default function PlaceField({
  label,
  value,
  onChange,
  tone = 'a',
  placeholder,
  active,
  onActivate,
}) {
  const [text, setText] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const wrapRef = useRef(null);
  const reqRef = useRef(0);

  useEffect(() => {
    // Only sync when a place is actually chosen. If the parent clears the value
    // while the user is typing, keep their text intact.
    if (value?.name) {
      setText(value.name);
      setWarning('');
    }
  }, [value?.name]);

  useEffect(() => {
    const onDoc = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const query = text.trim();
    if (!query || query === value?.name || query.length < 3) {
      setResults([]);
      setBusy(false);
      return undefined;
    }

    const id = ++reqRef.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const data = await api(`/geocode?q=${encodeURIComponent(query)}`, {
          auth: false,
          signal: controller.signal,
        });
        if (id !== reqRef.current) return;
        setResults(data.results || []);
        setOpen(true);
        setWarning(data.warning || '');
      } catch (err) {
        if (err.name === 'AbortError' || id !== reqRef.current) return;
        setResults([]);
        setWarning('Address search is unavailable — click the map to drop a pin.');
      } finally {
        if (id === reqRef.current) setBusy(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, value?.name]);

  const handleText = (event) => {
    const next = event.target.value;
    setText(next);
    setWarning('');
    if (value && next !== value.name) onChange(null);
    setOpen(true);
  };

  const pick = (place) => {
    onChange(place);
    setText(place.name);
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    onChange(null);
    setText('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div
      className={`place-field ${active ? 'is-active' : ''}`}
      ref={wrapRef}
      onFocus={onActivate}
    >
      <div className="place-label">
        <span className={`dot dot-${tone}`} />
        {label}
      </div>
      <div className="place-input">
        <SearchIcon className="place-search-icon" />
        <input
          value={text}
          onChange={handleText}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
        {busy && <span className="mini-spinner" />}
        {text && (
          <button
            type="button"
            className="place-clear"
            onClick={clear}
            aria-label={`Clear ${label}`}
          >
            <XIcon />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="suggestions">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng},${result.name}`}>
              <button type="button" onClick={() => pick(result)}>
                <PinIcon />
                <span>{result.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {warning && <p className="field-hint warn">{warning}</p>}
    </div>
  );
}
