/**
 * Motion presets and named primitives (DESIGN.md §2.10). All Framer Motion usage
 * in the app should import from here so timing stays consistent and the
 * reduced-motion contract is honored in one place.
 */
import { useReducedMotion, type Transition, type Variants } from "motion/react";

export const springSoft: Transition = { type: "spring", stiffness: 220, damping: 30, mass: 0.9 };
export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 34 };
export const easeOutExpo: Transition = { duration: 0.36, ease: [0.16, 1, 0.3, 1] };
export const easeOutQuad: Transition = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] };

/** Entrance default: rise + fade. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: easeOutExpo },
};

/** Quiet fade for text swaps where motion would distract. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
};

/** Badges, popovers, copied toast. */
export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
};

/** Parent for staggered lists / feature grids; children use `fadeUp`. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Standard once-only scroll-into-view viewport config. */
export const viewportOnce = { once: true, margin: "-12% 0px" } as const;

/**
 * Reduced-motion aware variants. When the user prefers reduced motion, transforms
 * collapse to identity and only a short opacity fade remains.
 */
export function useMotionConfig() {
  const reduced = useReducedMotion();

  const enter = (variants: Variants): Variants =>
    reduced
      ? {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.14 } },
        }
      : variants;

  return {
    reduced: !!reduced,
    fadeUp: enter(fadeUp),
    fadeIn,
    scalePop: enter(scalePop),
    staggerParent: reduced ? fadeIn : staggerParent,
    viewportOnce,
    springSoft: reduced ? { duration: 0 } : springSoft,
    springSnappy: reduced ? { duration: 0 } : springSnappy,
  };
}
