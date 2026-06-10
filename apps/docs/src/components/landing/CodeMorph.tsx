import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Sparkles, Check, Play } from "lucide-react";
import { EXAMPLES, type Line } from "./codeMorphData";

type Phase = "read" | "transmit" | "write" | "hold";

/** Phase durations (ms) — sum ≈ --dur-morph × 3 + hold (DESIGN.md §4.1.4). */
const TIMING: Record<Phase, number> = {
  read: 600,
  transmit: 500,
  write: 1100,
  hold: 2500,
};

const PER_LINE_REVEAL = 90; // staggered output line reveal during "write"

function TrafficDots() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className="size-2.5 rounded-full" style={{ background: "#FF6B5E", opacity: 0.9 }} />
      <span className="size-2.5 rounded-full" style={{ background: "#F2C14E", opacity: 0.9 }} />
      <span className="size-2.5 rounded-full" style={{ background: "#38E59B", opacity: 0.9 }} />
    </span>
  );
}

function CodeLine({ line }: { line: Line }) {
  return (
    <div className="whitespace-pre">
      {line.length === 0 ? (
        <span>&nbsp;</span>
      ) : (
        line.map((tok, i) => (
          <span key={i} style={{ color: tok.color }}>
            {tok.text}
          </span>
        ))
      )}
    </div>
  );
}

/** Static rendering of all lines (used in the reduced-motion fallback). */
function StaticLines({ lines }: { lines: Line[] }) {
  return (
    <div className="font-mono text-[13px] leading-[1.65]">
      {lines.map((line, i) => (
        <CodeLine key={i} line={line} />
      ))}
    </div>
  );
}

/** Output lines revealed progressively, with a blinking caret leading the active line. */
function AnimatedOutput({ lines, revealed, caret }: { lines: Line[]; revealed: number; caret: boolean }) {
  return (
    <div className="font-mono text-[13px] leading-[1.65]">
      {lines.map((line, i) => {
        const isVisible = i < revealed;
        const isActive = i === revealed - 1;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative whitespace-pre"
          >
            <CodeLine line={line} />
            {caret && isActive && (
              <span
                className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-primary align-middle"
                style={{ animation: "s2tq-caret 1.06s step-end infinite" }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function Pane({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-muted bg-surface-inset">
      <div className="flex h-9 items-center gap-2 border-b border-border-muted bg-surface px-3">
        <span className="font-mono text-[13px] text-text-muted">{title}</span>
        <span className="ml-auto">{badge}</span>
      </div>
      <div className="overflow-x-auto px-4 py-3">{children}</div>
    </div>
  );
}

export default function CodeMorph() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "0px" });

  // --- Animated (motion-allowed) state machine ---
  const [exampleIndex, setExampleIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("read");
  const [revealed, setRevealed] = useState(0);
  const [committed, setCommitted] = useState(false);

  // --- Reduced-motion manual replay state ---
  const [replayKey, setReplayKey] = useState(0);

  const example = EXAMPLES[exampleIndex];
  const playing = inView && !reduced;

  // Pause when the tab is hidden.
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const active = playing && tabVisible;

  // Drive the phase timeline.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = (current: Phase) => {
      if (cancelled) return;
      setPhase(current);

      if (current === "write") {
        setRevealed(0);
        setCommitted(false);
        example.output.forEach((_, i) => {
          timers.push(
            setTimeout(() => {
              if (!cancelled) setRevealed(i + 1);
            }, i * PER_LINE_REVEAL),
          );
        });
        // Commit pulse once all lines are in.
        timers.push(
          setTimeout(
            () => {
              if (!cancelled) setCommitted(true);
            },
            example.output.length * PER_LINE_REVEAL + 120,
          ),
        );
      }

      const next: Record<Phase, Phase> = { read: "transmit", transmit: "write", write: "hold", hold: "read" };
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          if (current === "hold") {
            setExampleIndex((idx) => (idx + 1) % EXAMPLES.length);
          }
          run(next[current]);
        }, TIMING[current]),
      );
    };

    run("read");
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // Restart the loop whenever activity resumes or the example changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, exampleIndex]);

  const connectorFilled = !reduced && (phase === "transmit" || phase === "write" || phase === "hold");
  const showCheck = !reduced && committed;

  return (
    <div ref={rootRef} className="relative">
      {/* Decorative narrative — hidden from AT; accessible code lives in §4.1.7. */}
      <div
        aria-hidden="true"
        className="relative rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-4)] sm:p-4"
        style={{ boxShadow: "var(--shadow-4), var(--glow-primary-lg)" }}
      >
        <div className="flex items-center gap-3 px-1 pb-3">
          <TrafficDots />
          <span className="font-mono text-xs text-text-faint">code-morph</span>
        </div>

        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-0">
          {/* Input */}
          <div className="flex-1">
            <Pane title="swagger.json">
              {reduced ? (
                <StaticLines lines={example.input} />
              ) : (
                <div className="relative">
                  <StaticLines lines={example.input} />
                  {/* Scan line during the read phase */}
                  <AnimatePresence>
                    {phase === "read" && (
                      <motion.div
                        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
                        }}
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: TIMING.read / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </Pane>
          </div>

          {/* Center node + connector */}
          <div className="flex shrink-0 items-center justify-center py-1 lg:flex-col lg:px-3 lg:py-0">
            <Connector vertical filled={connectorFilled} className="lg:hidden" />
            <Connector vertical={false} filled={connectorFilled} className="hidden lg:block" />
            <motion.span
              className="relative z-10 flex size-11 items-center justify-center rounded-full border border-border-strong bg-surface-raised"
              animate={
                !reduced && phase === "transmit"
                  ? { boxShadow: ["var(--glow-primary-sm)", "var(--glow-accent)", "var(--glow-primary-sm)"] }
                  : { boxShadow: "var(--glow-primary-sm)" }
              }
              transition={{ duration: 0.5 }}
            >
              <Sparkles size={20} style={{ color: "var(--color-accent)" }} aria-hidden="true" />
            </motion.span>
            <Connector vertical filled={connectorFilled} className="lg:hidden" />
            <Connector vertical={false} filled={connectorFilled} className="hidden lg:block" />
          </div>

          {/* Output */}
          <div className="flex-1">
            <motion.div
              animate={
                showCheck
                  ? { boxShadow: ["var(--glow-primary)", "0 0 0 transparent"] }
                  : { boxShadow: "0 0 0 transparent" }
              }
              transition={{ duration: 0.9 }}
              className="rounded-xl"
            >
              <Pane
                title={example.outputPath}
                badge={
                  <AnimatePresence>
                    {showCheck && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 font-mono text-[11px] text-success"
                      >
                        <Check size={12} aria-hidden="true" /> generated
                      </motion.span>
                    )}
                  </AnimatePresence>
                }
              >
                {reduced ? (
                  <ReducedReplay key={replayKey} input={example.input} output={example.output} />
                ) : (
                  <AnimatedOutput
                    lines={example.output}
                    revealed={phase === "write" ? revealed : phase === "hold" ? example.output.length : 0}
                    caret={phase === "write"}
                  />
                )}
              </Pane>
            </motion.div>
          </div>
        </div>

        {/* Reduced-motion replay control */}
        {reduced && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
            >
              <Play size={14} aria-hidden="true" /> Replay
            </button>
          </div>
        )}
      </div>

      {/* Accessible description of the decorative demo. */}
      <p className="sr-only">
        An OpenAPI {example.name} operation from swagger.json transforming into a typed {example.name} query
        function in {example.outputPath}.
      </p>

      <style>{`@keyframes s2tq-caret { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  );
}

/** Cyan connector that "fills" during the transmit phase. */
function Connector({
  vertical,
  filled,
  className = "",
}: {
  vertical: boolean;
  filled: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${vertical ? "relative h-4 w-[2px]" : "relative h-[2px] w-6"} ${className}`.trim()}
      style={{ background: "var(--color-border-strong)" }}
    >
      <motion.div
        className="absolute inset-0 origin-left"
        style={{ background: "var(--color-primary)", transformOrigin: vertical ? "top" : "left" }}
        initial={false}
        animate={{ scaleX: vertical ? 1 : filled ? 1 : 0, scaleY: vertical ? (filled ? 1 : 0) : 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}

/** Reduced-motion: crossfade between static input and output on user replay. */
function ReducedReplay({ input, output }: { input: Line[]; output: Line[] }) {
  const [showOutput, setShowOutput] = useState(false);
  useEffect(() => {
    setShowOutput(false);
    const id = setTimeout(() => setShowOutput(true), 400);
    return () => clearTimeout(id);
  }, [input, output]);

  return (
    <AnimatePresence mode="wait">
      {showOutput ? (
        <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
          <StaticLines lines={output} />
        </motion.div>
      ) : (
        <motion.div key="in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
          <StaticLines lines={input} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
