/**
 * Config pane: source selector (Paste / Example) + a form mapping PlaygroundConfig
 * 1:1. Selecting an example loads its text into the spec editor (via onLoadExample).
 */
import { ChevronDown } from "lucide-react";
import type { PlaygroundConfig } from "../../lib/generate";
import { EXAMPLES, type Example } from "../../lib/examples";
import { Field, Toggle } from "./primitives";

export type SourceMode = "paste" | "example";

interface ConfigPanelProps {
  config: PlaygroundConfig;
  onConfigChange: (patch: Partial<PlaygroundConfig>) => void;
  sourceMode: SourceMode;
  onSourceModeChange: (mode: SourceMode) => void;
  selectedExampleId: string;
  onLoadExample: (example: Example) => void;
}

export default function ConfigPanel({
  config,
  onConfigChange,
  sourceMode,
  onSourceModeChange,
  selectedExampleId,
  onLoadExample,
}: ConfigPanelProps) {
  const envelopeEnabled = config.dataField.trim().length > 0;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Source selector */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-text-faint">
          Source
        </legend>
        <div
          role="radiogroup"
          aria-label="Spec source"
          className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface-inset p-1"
        >
          {(["paste", "example"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={sourceMode === mode}
              onClick={() => onSourceModeChange(mode)}
              className={[
                "h-8 rounded-[6px] text-[0.875rem] capitalize transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset",
                sourceMode === mode
                  ? "bg-surface-raised text-text shadow-[var(--shadow-1)]"
                  : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              {mode}
            </button>
          ))}
        </div>

        {sourceMode === "example" && (
          <div className="relative mt-1">
            <label htmlFor="pg-example" className="sr-only">
              Choose an example spec
            </label>
            <select
              id="pg-example"
              value={selectedExampleId}
              onChange={(e) => {
                const ex = EXAMPLES.find((x) => x.id === e.target.value);
                if (ex) onLoadExample(ex);
              }}
              className="h-10 w-full appearance-none rounded-md border border-border bg-surface-inset px-3 pr-9 text-[0.875rem] text-text transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[var(--glow-primary-sm)]"
            >
              {EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <p className="mt-1.5 text-xs text-text-muted">
              {EXAMPLES.find((x) => x.id === selectedExampleId)?.description}
            </p>
          </div>
        )}
      </fieldset>

      <hr className="border-border-muted" />

      {/* Client */}
      <Field
        label="client.path"
        mono
        value={config.clientPath}
        placeholder="@/lib/axios"
        helper="Import path for your axios instance."
        onChange={(v) => onConfigChange({ clientPath: v })}
      />
      <Field
        label="client.name"
        mono
        value={config.clientName}
        placeholder="default"
        helper="Named export, or leave to use the default export."
        onChange={(v) => onConfigChange({ clientName: v })}
      />

      <hr className="border-border-muted" />

      {/* Response */}
      <Field
        label="response.dataField"
        mono
        value={config.dataField}
        placeholder="data"
        helper="Key the payload is unwrapped from. Empty = no unwrapping."
        onChange={(v) => onConfigChange({ dataField: v })}
      />

      <Toggle
        label="response.envelope"
        checked={envelopeEnabled && config.envelopePath.trim().length > 0}
        disabled={!envelopeEnabled}
        helper={envelopeEnabled ? "Wrap responses in a generic envelope type." : "Requires a dataField."}
        onChange={(on) =>
          onConfigChange(
            on
              ? { envelopePath: config.envelopePath || "@/lib/axios", envelopeName: config.envelopeName || "CommonResponse" }
              : { envelopePath: "" },
          )
        }
      />
      {envelopeEnabled && config.envelopePath.trim().length > 0 && (
        <div className="flex flex-col gap-4 border-l-2 border-border-muted pl-3">
          <Field
            label="envelope.path"
            mono
            value={config.envelopePath}
            placeholder="@/lib/axios"
            onChange={(v) => onConfigChange({ envelopePath: v })}
          />
          <Field
            label="envelope.name"
            mono
            value={config.envelopeName}
            placeholder="CommonResponse"
            onChange={(v) => onConfigChange({ envelopeName: v })}
          />
        </div>
      )}

      <hr className="border-border-muted" />

      {/* Error */}
      <Field
        label="error.path"
        mono
        value={config.errorPath}
        placeholder="@/lib/axios"
        helper="Import path for your typed error. Empty = no typed error."
        onChange={(v) => onConfigChange({ errorPath: v })}
      />
      <Field
        label="error.name"
        mono
        value={config.errorName}
        placeholder="ApiError"
        onChange={(v) => onConfigChange({ errorName: v })}
      />

      <hr className="border-border-muted" />

      <Toggle
        label="format"
        checked={config.format}
        helper="Run Prettier on the generated code."
        onChange={(v) => onConfigChange({ format: v })}
      />
    </div>
  );
}
