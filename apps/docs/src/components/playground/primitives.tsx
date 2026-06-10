/**
 * Small, fully-typed form primitives for the playground config pane, built to the
 * DESIGN.md §3.8 (inputs/toggles) and §3.10 (status pill) specs. Kept local to the
 * playground so they can stay lean and a11y-complete without touching shared files.
 */
import { useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  mono?: boolean;
  disabled?: boolean;
}

/** Labelled text input following the shared field shell. */
export function Field({ label, value, onChange, placeholder, helper, mono, disabled }: FieldProps) {
  const id = useId();
  const helperId = helper ? `${id}-helper` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.875rem] font-semibold text-text">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-describedby={helperId}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "h-10 rounded-md border border-border bg-surface-inset px-3 text-[0.875rem] text-text",
          "placeholder:text-text-faint transition-colors",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[var(--glow-primary-sm)]",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-faint",
          mono ? "font-mono" : "font-sans",
        ].join(" ")}
      />
      {helper && (
        <p id={helperId} className="text-xs text-text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper?: string;
  disabled?: boolean;
}

/** Accessible switch toggle (role="switch", aria-checked). */
export function Toggle({ label, checked, onChange, helper, disabled }: ToggleProps) {
  const id = useId();
  const helperId = helper ? `${id}-helper` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[0.875rem] font-semibold text-text">
          {label}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={helperId}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={[
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary shadow-[var(--glow-primary-sm)]" : "bg-surface-raised",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none",
              checked ? "left-[18px]" : "left-0.5",
            ].join(" ")}
          />
        </button>
      </div>
      {helper && (
        <p id={helperId} className="text-xs text-text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}

export type ValidityState = "valid" | "invalid" | "parsing";

/** Validity status pill (DESIGN.md §3.10). */
export function StatusPill({ state }: { state: ValidityState }) {
  const config = {
    valid: {
      cls: "bg-success-soft text-success",
      icon: <CheckCircle2 size={14} aria-hidden="true" />,
      label: "Valid spec",
    },
    invalid: {
      cls: "bg-danger-soft text-danger",
      icon: <AlertCircle size={14} aria-hidden="true" />,
      label: "Invalid spec",
    },
    parsing: {
      cls: "bg-surface-raised text-text-muted",
      icon: <Loader2 size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />,
      label: "Parsing…",
    },
  }[state];

  return (
    <span
      aria-live="polite"
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${config.cls}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
