/**
 * Spec input pane: a labelled mono textarea (ligatures off, no wrap, spellcheck off,
 * tab size 2) plus a live validity status pill and a char/line count.
 */
import { useEffect, useMemo, useState } from "react";
import { parseSpecText } from "../../lib/generate";
import { StatusPill, type ValidityState } from "./primitives";

interface SpecEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SpecEditor({ value, onChange }: SpecEditorProps) {
  const [validity, setValidity] = useState<ValidityState>("parsing");

  // Validate (cheap parse) on a short debounce so typing stays smooth.
  useEffect(() => {
    setValidity("parsing");
    const t = window.setTimeout(() => {
      try {
        parseSpecText(value);
        setValidity("valid");
      } catch {
        setValidity("invalid");
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [value]);

  const counts = useMemo(() => {
    const lines = value.length === 0 ? 0 : value.split("\n").length;
    return { chars: value.length, lines };
  }, [value]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <label htmlFor="pg-spec" className="sr-only">
        OpenAPI specification
      </label>
      <textarea
        id="pg-spec"
        aria-label="OpenAPI specification"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        placeholder="Paste an OpenAPI 3.x / Swagger 2.0 document (JSON or YAML)…"
        className="min-h-0 flex-1 resize-none whitespace-pre overflow-auto bg-surface-inset p-4 font-mono text-[0.8125rem] leading-[1.6] text-text placeholder:text-text-faint [font-variant-ligatures:none] [tab-size:2] focus-visible:outline-none"
      />
      <div className="flex items-center justify-between gap-3 border-t border-border-muted px-4 py-2">
        <StatusPill state={validity} />
        <span className="font-mono text-xs text-text-faint tabular-nums">
          {counts.lines} lines · {counts.chars} chars
        </span>
      </div>
    </div>
  );
}
