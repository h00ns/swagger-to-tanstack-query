/**
 * Code surface (DESIGN.md §3.6) for the selected generated file: runtime Shiki
 * highlight into a bg-surface-inset well, with Copy (Copy→Check, aria-live) and
 * Download (current file as a .ts Blob) plus a Copy-all action. Highlighting is
 * debounced and only runs for the selected file to keep the main thread responsive.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Files } from "lucide-react";
import type { GeneratedFile } from "swagger-to-tanstack-query/core";
import { highlightCode, langForPath } from "./highlighter";

interface CodeViewerProps {
  file: GeneratedFile;
  allFiles: GeneratedFile[];
}

function CopyButton({
  getText,
  label,
  icon,
}: {
  getText: () => string;
  label: string;
  icon: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — silently no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[0.8125rem] text-text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {copied ? <Check size={16} aria-hidden="true" className="text-success" /> : icon}
      <span>{copied ? "Copied" : label}</span>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

export default function CodeViewer({ file, allFiles }: CodeViewerProps) {
  const [html, setHtml] = useState<string | null>(null);

  // Debounced, selected-file-only highlight via the shared memoized highlighter.
  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    const t = window.setTimeout(() => {
      highlightCode(file.content, langForPath(file.path))
        .then((out) => {
          if (!cancelled) setHtml(out);
        })
        .catch(() => {
          if (!cancelled) setHtml(null);
        });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [file.content, file.path]);

  const download = () => {
    const blob = new Blob([file.content], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.path.split("/").pop() ?? "file.ts";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllText = () =>
    allFiles.map((f) => `// ${f.path}\n${f.content}`).join("\n\n");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-4)]">
      {/* Title bar */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border-muted bg-surface-raised px-3">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/90" />
        </div>
        <span className="truncate font-mono text-[0.8125rem] text-text-muted">{file.path}</span>
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <CopyButton getText={copyAllText} label="Copy all" icon={<Files size={16} aria-hidden="true" />} />
          <CopyButton getText={() => file.content} label="Copy" icon={<Copy size={16} aria-hidden="true" />} />
          <button
            type="button"
            onClick={download}
            aria-label="Download this file"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[0.8125rem] text-text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Download size={16} aria-hidden="true" />
            <span>Download</span>
          </button>
        </span>
      </div>

      {/* Well */}
      <div className="min-h-0 flex-1 overflow-auto bg-surface-inset [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[0.875rem] [&_pre]:leading-[1.65] [&_code]:font-mono">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="m-0 whitespace-pre p-4 font-mono text-[0.875rem] leading-[1.65] text-text-muted">
            {file.content}
          </pre>
        )}
      </div>
    </div>
  );
}
