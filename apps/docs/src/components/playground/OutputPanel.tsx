/**
 * Output pane: switches between empty / loading (skeleton) / error (danger callout)
 * and the file-tree + code-viewer layout. Never shows a blank screen.
 */
import { FileCode2, OctagonAlert } from "lucide-react";
import type { GeneratedFile } from "swagger-to-tanstack-query/core";
import type { GenStatus } from "./Playground";
import FileTree from "./FileTree";
import CodeViewer from "./CodeViewer";

interface OutputPanelProps {
  status: GenStatus;
  files: GeneratedFile[];
  error: string | null;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <FileCode2 size={48} aria-hidden="true" className="text-text-faint" />
      <p className="max-w-xs text-[0.875rem] text-text-muted">
        Paste a spec or pick an example to see generated code.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full gap-3 p-4" aria-busy="true" aria-label="Generating code">
      <div className="hidden w-44 shrink-0 flex-col gap-2 sm:flex">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-5 animate-pulse rounded bg-surface-raised motion-reduce:animate-none"
            style={{ width: `${60 + ((i * 13) % 35)}%` }}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-surface-raised motion-reduce:animate-none"
            style={{ width: `${40 + ((i * 17) % 55)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-4">
      <div className="rounded-md border border-border border-l-[3px] border-l-danger bg-danger-soft p-4">
        <div className="flex items-start gap-2.5">
          <OctagonAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <h3 className="text-[0.875rem] font-semibold text-text">Could not generate code</h3>
            <p className="text-[0.875rem] text-text-muted">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutputPanel({ status, files, error, selectedPath, onSelect }: OutputPanelProps) {
  if (status === "error" && error) return <ErrorState error={error} />;
  // First-ever generation with no prior files: show loading; otherwise keep showing
  // the last good output while the next run is in flight (handled in Playground).
  if (status === "parsing" && files.length === 0) return <LoadingState />;
  if (files.length === 0) return <EmptyState />;

  const selected = files.find((f) => f.path === selectedPath) ?? files[0];

  return (
    <div className="flex h-full min-h-0">
      <div className="hidden w-52 shrink-0 overflow-auto border-r border-border-muted md:block">
        <FileTree files={files} selectedPath={selected.path} onSelect={onSelect} />
      </div>
      <div className="min-w-0 flex-1 p-3">
        <CodeViewer file={selected} allFiles={files} />
      </div>
    </div>
  );
}
