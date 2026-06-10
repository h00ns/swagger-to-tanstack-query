/**
 * File tree for generated output (DESIGN.md §3.7). Groups files by controller
 * folder (paths like `contact/apis.ts`). Full ARIA `tree`/`treeitem`/`group` with
 * roving tabindex: ↑/↓ navigate, ←/→ collapse/expand, Enter/Space select, Home/End.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, FileCode2, Folder, FolderOpen } from "lucide-react";
import type { GeneratedFile } from "swagger-to-tanstack-query/core";

interface FileTreeProps {
  files: GeneratedFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

interface TreeFolder {
  name: string;
  files: GeneratedFile[];
}

/** A flattened, currently-visible row: either a folder header or a file leaf. */
type Row =
  | { kind: "folder"; folder: string; level: 0 }
  | { kind: "file"; folder: string; path: string; name: string; level: 1 };

function groupByFolder(files: GeneratedFile[]): TreeFolder[] {
  const map = new Map<string, GeneratedFile[]>();
  for (const f of files) {
    const folder = f.path.includes("/") ? f.path.slice(0, f.path.indexOf("/")) : "";
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder)!.push(f);
  }
  return [...map.entries()].map(([name, list]) => ({ name, files: list }));
}

export default function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  const folders = useMemo(() => groupByFolder(files), [files]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Default: all folders open whenever the file set changes.
  useEffect(() => {
    setOpen(Object.fromEntries(folders.map((f) => [f.name, true])));
  }, [folders]);

  // Build the visible (flattened) rows from current open state.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const folder of folders) {
      out.push({ kind: "folder", folder: folder.name, level: 0 });
      if (open[folder.name]) {
        for (const f of folder.files) {
          const name = f.path.includes("/") ? f.path.slice(f.path.indexOf("/") + 1) : f.path;
          out.push({ kind: "file", folder: folder.name, path: f.path, name, level: 1 });
        }
      }
    }
    return out;
  }, [folders, open]);

  // Clamp activeIndex into range whenever the visible row count changes so the
  // roving tabindex always lands on a real row (otherwise the tree can become
  // unreachable by keyboard).
  useEffect(() => {
    setActiveIndex((i) => Math.max(0, Math.min(i, rows.length - 1)));
  }, [rows.length]);

  // Keep activeIndex aligned with the selected file when possible.
  useEffect(() => {
    if (!selectedPath) return;
    const idx = rows.findIndex((r) => r.kind === "file" && r.path === selectedPath);
    if (idx >= 0) setActiveIndex(idx);
  }, [selectedPath, rows]);

  const focusRow = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, rows.length - 1));
    setActiveIndex(clamped);
    rowRefs.current[clamped]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const row = rows[idx];
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRow(idx + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRow(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusRow(0);
        break;
      case "End":
        e.preventDefault();
        focusRow(rows.length - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (row.kind === "folder" && !open[row.folder]) {
          setOpen((o) => ({ ...o, [row.folder]: true }));
        } else {
          focusRow(idx + 1);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (row.kind === "folder" && open[row.folder]) {
          setOpen((o) => ({ ...o, [row.folder]: false }));
        } else if (row.kind === "file") {
          const parentIdx = rows.findIndex((r) => r.kind === "folder" && r.folder === row.folder);
          if (parentIdx >= 0) focusRow(parentIdx);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (row.kind === "folder") {
          setOpen((o) => ({ ...o, [row.folder]: !o[row.folder] }));
        } else {
          onSelect(row.path);
        }
        break;
    }
  };

  return (
    <div
      role="tree"
      aria-label="Generated files"
      className="overflow-auto py-2 font-mono text-[0.8125rem]"
    >
      {folders.map((folder) => {
        const folderRowIdx = rows.findIndex((r) => r.kind === "folder" && r.folder === folder.name);
        const isOpen = open[folder.name] ?? true;
        return (
          <div key={folder.name || "_root"} role="treeitem" aria-expanded={isOpen}>
            <div
              ref={(el) => {
                rowRefs.current[folderRowIdx] = el;
              }}
              tabIndex={activeIndex === folderRowIdx ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, folderRowIdx)}
              onClick={() => {
                setActiveIndex(folderRowIdx);
                setOpen((o) => ({ ...o, [folder.name]: !o[folder.name] }));
              }}
              className="flex h-7 cursor-pointer items-center gap-1.5 px-3 text-text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <ChevronRight
                size={14}
                aria-hidden="true"
                className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`}
              />
              {isOpen ? (
                <FolderOpen size={16} aria-hidden="true" className="shrink-0 text-primary" />
              ) : (
                <Folder size={16} aria-hidden="true" className="shrink-0" />
              )}
              <span className="truncate">{folder.name || "(root)"}</span>
            </div>

            {isOpen && (
              <div role="group">
                {folder.files.map((f) => {
                  const fileRowIdx = rows.findIndex((r) => r.kind === "file" && r.path === f.path);
                  const name = f.path.includes("/") ? f.path.slice(f.path.indexOf("/") + 1) : f.path;
                  const selected = selectedPath === f.path;
                  return (
                    <div
                      key={f.path}
                      role="treeitem"
                      aria-selected={selected}
                      ref={(el) => {
                        rowRefs.current[fileRowIdx] = el;
                      }}
                      tabIndex={activeIndex === fileRowIdx ? 0 : -1}
                      onKeyDown={(e) => onKeyDown(e, fileRowIdx)}
                      onClick={() => {
                        setActiveIndex(fileRowIdx);
                        onSelect(f.path);
                      }}
                      className={[
                        "flex h-7 cursor-pointer items-center gap-1.5 pl-9 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                        selected
                          ? "border-l-2 border-primary bg-primary-soft pl-[34px] text-primary"
                          : "text-text-muted hover:bg-surface hover:text-text",
                      ].join(" ")}
                    >
                      <FileCode2 size={14} aria-hidden="true" className="shrink-0 text-primary/80" />
                      <span className="truncate">{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
