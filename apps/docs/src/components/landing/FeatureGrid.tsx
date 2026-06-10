import { useEffect, useRef } from "react";
import {
  FolderTree,
  Workflow,
  Plug,
  PackageOpen,
  ShieldAlert,
  Braces,
  Upload,
  FileText,
  GitCompare,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface FeatureItem {
  key: string;
  title: string;
  description: string;
}

interface Props {
  items: FeatureItem[];
}

/** Map a stable feature key to its lucide icon. Keys are kept in sync with i18n/landing.ts. */
const ICONS: Record<string, LucideIcon> = {
  "controller-output": FolderTree,
  "tanstack-query": Workflow,
  "bring-your-own-axios": Plug,
  "envelope-unwrapping": PackageOpen,
  "typed-errors": ShieldAlert,
  "faithful-types": Braces,
  "headers-uploads": Upload,
  "docs-preserved": FileText,
  "spec-dialects": GitCompare,
  "safe-identifiers": ShieldCheck,
};

export default function FeatureGrid({ items }: Props) {
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const cards = cardRefs.current.filter((el): el is HTMLLIElement => el !== null);
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ key, title, description }, index) => {
        const Icon = ICONS[key] ?? FolderTree;
        return (
          <li
            key={key}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="s2tq-reveal group rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-2)] transition-[border-color,box-shadow,transform] duration-150 ease-[var(--ease-out-quad)] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-3)]"
            style={{ "--enter-delay": `${index * 60}ms` } as React.CSSProperties}
          >
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary transition-shadow duration-150 group-hover:shadow-[var(--glow-primary-sm)]">
              <Icon size={20} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
          </li>
        );
      })}
    </ul>
  );
}
