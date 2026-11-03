import { AlertCircle } from './AlertCircle.jsx';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <AlertCircle />
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="error-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
