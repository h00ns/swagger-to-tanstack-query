/**
 * Playground root. Holds spec text + config state, runs a debounced (400ms)
 * client-side `generate()`, and lays out three panes (Config / Spec / Output)
 * responsively: 3-col desktop, 2-col tablet (config+spec stacked via tabs),
 * single-column mobile with segmented Config · Spec · Output tabs.
 */
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DEFAULT_CONFIG, generate, type PlaygroundConfig } from "../../lib/generate";
import type { GeneratedFile } from "swagger-to-tanstack-query/core";
import { EXAMPLES, exampleAsText, type Example } from "../../lib/examples";
import ConfigPanel, { type SourceMode } from "./ConfigPanel";
import SpecEditor from "./SpecEditor";
import OutputPanel from "./OutputPanel";

export type GenStatus = "idle" | "parsing" | "ok" | "error";

type MobileTab = "config" | "spec" | "output";

const DEBOUNCE_MS = 400;

interface PaneProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  trailing?: React.ReactNode;
}

/** A panel with a caps header bar (DESIGN.md §4.3). */
function Pane({ label, children, className, trailing }: PaneProps) {
  return (
    <section className={`flex min-h-0 flex-col border-border bg-surface ${className ?? ""}`}>
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-border-muted px-4">
        <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-text-faint">
          {label}
        </h2>
        {trailing}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

function GeneratingChip() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted" role="status">
      <RefreshCw size={13} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      Generating
    </span>
  );
}

export default function Playground() {
  const [specText, setSpecText] = useState<string>(() => exampleAsText(EXAMPLES[0]));
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
  const [sourceMode, setSourceMode] = useState<SourceMode>("example");
  const [selectedExampleId, setSelectedExampleId] = useState<string>(EXAMPLES[0].id);

  const [status, setStatus] = useState<GenStatus>("parsing");
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<MobileTab>("output");
  const tabRefs = useRef<Record<MobileTab, HTMLButtonElement | null>>({
    config: null,
    spec: null,
    output: null,
  });

  const TABS: readonly MobileTab[] = ["config", "spec", "output"];

  const onTabKeyDown = (e: React.KeyboardEvent, current: MobileTab) => {
    const i = TABS.indexOf(current);
    let next: MobileTab | null = null;
    switch (e.key) {
      case "ArrowRight":
        next = TABS[(i + 1) % TABS.length];
        break;
      case "ArrowLeft":
        next = TABS[(i - 1 + TABS.length) % TABS.length];
        break;
      case "Home":
        next = TABS[0];
        break;
      case "End":
        next = TABS[TABS.length - 1];
        break;
      default:
        return;
    }
    e.preventDefault();
    setMobileTab(next);
    tabRefs.current[next]?.focus();
  };

  // Debounced auto-generate. A run id guards against out-of-order async results.
  const runId = useRef(0);
  useEffect(() => {
    const id = ++runId.current;
    setStatus("parsing");
    const t = window.setTimeout(() => {
      generate(specText, config)
        .then((result) => {
          if (id !== runId.current) return;
          setFiles(result.files);
          setError(null);
          setStatus("ok");
          setSelectedPath((prev) =>
            prev && result.files.some((f) => f.path === prev)
              ? prev
              : (result.files[0]?.path ?? null),
          );
        })
        .catch((e: unknown) => {
          if (id !== runId.current) return;
          setError(e instanceof Error ? e.message : "Unknown error generating code.");
          setStatus("error");
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [specText, config]);

  const patchConfig = (patch: Partial<PlaygroundConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const loadExample = (example: Example) => {
    setSelectedExampleId(example.id);
    setSpecText(exampleAsText(example));
  };

  const onSourceModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    if (mode === "example") {
      const ex = EXAMPLES.find((x) => x.id === selectedExampleId) ?? EXAMPLES[0];
      loadExample(ex);
    }
  };

  const generating = status === "parsing";

  const configNode = (
    <ConfigPanel
      config={config}
      onConfigChange={patchConfig}
      sourceMode={sourceMode}
      onSourceModeChange={onSourceModeChange}
      selectedExampleId={selectedExampleId}
      onLoadExample={loadExample}
    />
  );
  const specNode = <SpecEditor value={specText} onChange={setSpecText} />;
  const outputNode = (
    <OutputPanel
      status={status}
      files={files}
      error={error}
      selectedPath={selectedPath}
      onSelect={setSelectedPath}
    />
  );

  return (
    <div className="h-[calc(100dvh-var(--header-h))] overflow-hidden bg-bg text-text">
      {/* Desktop: 3 columns. Tablet: config+spec | output. */}
      <div className="hidden h-full md:grid md:grid-cols-[minmax(280px,340px)_1fr] lg:grid-cols-[340px_minmax(0,1fr)_minmax(0,1.1fr)]">
        <Pane label="Config" className="border-r">
          {configNode}
        </Pane>

        {/* On tablet, spec sits under config in the same column via a nested grid;
            on desktop it's its own column. */}
        <Pane label="Spec" className="border-r lg:border-r">
          {specNode}
        </Pane>

        <Pane
          label="Output"
          trailing={generating ? <GeneratingChip /> : null}
        >
          {outputNode}
        </Pane>
      </div>

      {/* Mobile: single column with segmented tabs. */}
      <div className="flex h-full flex-col md:hidden">
        <div
          role="tablist"
          aria-label="Playground panes"
          className="flex shrink-0 gap-1 border-b border-border-muted bg-surface px-2"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`pg-tab-${tab}`}
              ref={(el) => {
                tabRefs.current[tab] = el;
              }}
              aria-selected={mobileTab === tab}
              aria-controls={`pg-panel-${tab}`}
              tabIndex={mobileTab === tab ? 0 : -1}
              onClick={() => setMobileTab(tab)}
              onKeyDown={(e) => onTabKeyDown(e, tab)}
              className={[
                "relative h-9 flex-1 text-[0.875rem] capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                mobileTab === tab ? "text-text" : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              {tab}
              {mobileTab === tab && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary shadow-[var(--glow-primary-sm)]" />
              )}
            </button>
          ))}
        </div>

        <div className="relative min-h-0 flex-1">
          {generating && (
            <div className="absolute right-3 top-2 z-[var(--z-raised)]">
              <GeneratingChip />
            </div>
          )}
          <div
            role="tabpanel"
            id="pg-panel-config"
            aria-labelledby="pg-tab-config"
            tabIndex={0}
            hidden={mobileTab !== "config"}
            className="h-full overflow-auto bg-surface"
          >
            {configNode}
          </div>
          <div
            role="tabpanel"
            id="pg-panel-spec"
            aria-labelledby="pg-tab-spec"
            tabIndex={0}
            hidden={mobileTab !== "spec"}
            className="h-full bg-surface"
          >
            {specNode}
          </div>
          <div
            role="tabpanel"
            id="pg-panel-output"
            aria-labelledby="pg-tab-output"
            tabIndex={0}
            hidden={mobileTab !== "output"}
            className="h-full bg-surface"
          >
            {outputNode}
          </div>
        </div>
      </div>
    </div>
  );
}
