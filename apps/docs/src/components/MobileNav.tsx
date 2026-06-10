import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useMotionConfig } from "../lib/motion";

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}
interface LangLink {
  code: string;
  href: string;
  active: boolean;
}
interface Props {
  links: NavLink[];
  cta: { label: string; href: string };
  langLinks: LangLink[];
}

export default function MobileNav({ links, cta, langLinks }: Props) {
  const [open, setOpen] = useState(false);
  const { reduced } = useMotionConfig();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 top-[var(--header-h)] z-[var(--z-drawer)] bg-bg/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            <motion.nav
              aria-label="Mobile"
              className="flex flex-col gap-1 px-6 py-6"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-4 py-3 text-lg text-text-muted transition-colors hover:bg-surface hover:text-text"
                >
                  {link.label}
                </a>
              ))}

              <a
                href={cta.href}
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-semibold text-text-on-primary"
              >
                {cta.label}
              </a>

              <div className="mt-4 flex items-center gap-1 self-start rounded-full border border-border-strong p-0.5">
                {langLinks.map((lang) => (
                  <a
                    key={lang.code}
                    href={lang.href}
                    aria-current={lang.active ? "true" : undefined}
                    className={`rounded-full px-3 py-1 text-sm font-semibold uppercase transition-colors ${
                      lang.active ? "bg-primary-soft text-primary" : "text-text-muted hover:text-text"
                    }`}
                  >
                    {lang.code}
                  </a>
                ))}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
