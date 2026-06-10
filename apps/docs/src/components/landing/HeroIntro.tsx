import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  installCmd: string;
  eyebrow: string;
  title: { before: string; accent: string; after: string };
  subhead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badges: string[];
  /** Where "Read the docs" links — localized (e.g. /docs/introduction or /ko/docs/introduction). */
  docsHref: string;
}

/** Button.astro class parity (DESIGN.md §3.1) so the React island matches the Astro buttons. */
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-[background-color,box-shadow,transform,border-color,color] duration-150 ease-[var(--ease-out-quad)] focus-visible:outline-2 h-12 px-6 text-lg";
const BTN_PRIMARY =
  "bg-primary text-text-on-primary shadow-[var(--shadow-2)] hover:-translate-y-px hover:bg-primary-hover hover:shadow-[var(--glow-primary-sm)] active:translate-y-0 active:bg-primary-press";
const BTN_SECONDARY =
  "border border-border-strong text-text hover:border-primary hover:bg-surface-raised hover:text-primary active:bg-surface";

export default function HeroIntro({
  installCmd,
  eyebrow,
  title,
  subhead,
  ctaPrimary,
  ctaSecondary,
  badges,
  docsHref,
}: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="text-center lg:text-left">
      <p
        className="s2tq-enter font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-primary"
        style={{ "--enter-delay": "0ms" } as React.CSSProperties}
      >
        {eyebrow}
      </p>

      <h1
        className="s2tq-enter mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-text sm:text-6xl lg:text-7xl"
        style={{ "--enter-delay": "80ms" } as React.CSSProperties}
      >
        {title.before}
        <span className="text-primary">{title.accent}</span>
        {title.after}
      </h1>

      <p
        className="s2tq-enter mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-text-muted lg:mx-0"
        style={{ "--enter-delay": "160ms" } as React.CSSProperties}
      >
        {subhead}
      </p>

      <div
        className="s2tq-enter mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
        style={{ "--enter-delay": "240ms" } as React.CSSProperties}
      >
        <a href="/playground" className={`${BTN_BASE} ${BTN_PRIMARY}`}>
          {ctaPrimary}
        </a>
        <a href={docsHref} className={`${BTN_BASE} ${BTN_SECONDARY}`}>
          {ctaSecondary}
        </a>
      </div>

      {/* One-line install with copy affordance */}
      <div
        className="s2tq-enter mx-auto mt-6 flex max-w-md items-center gap-2 overflow-hidden rounded-md border border-border bg-surface-inset px-3 py-2 lg:mx-0"
        style={{ "--enter-delay": "320ms" } as React.CSSProperties}
      >
        <span aria-hidden="true" className="font-mono text-sm text-text-faint">
          $
        </span>
        <code className="flex-1 truncate font-mono text-sm text-text">{installCmd}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied install command" : "Copy install command"}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
        >
          {copied ? (
            <Check size={15} className="text-success" aria-hidden="true" />
          ) : (
            <Copy size={15} aria-hidden="true" />
          )}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? "Copied" : ""}
        </span>
      </div>

      {/* Trust badges (Badge.astro parity, §3.10) */}
      <ul
        className="s2tq-enter mt-8 flex flex-wrap justify-center gap-2 lg:justify-start"
        style={{ "--enter-delay": "400ms" } as React.CSSProperties}
      >
        {badges.map((b) => (
          <li
            key={b}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1 font-mono text-xs text-text-muted"
          >
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
