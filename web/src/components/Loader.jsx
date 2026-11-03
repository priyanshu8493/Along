export default function Loader({ label = 'Loading…', block = true }) {
  return (
    <div className={block ? 'loader-block' : 'loader-inline'} role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
