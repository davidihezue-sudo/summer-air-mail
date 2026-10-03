import { useTheme } from './useTheme'

/** Motion facts for components. All decisions come from motion/motion.ts via the theme provider. */
export function useMotion() {
  const { plan, finePointer } = useTheme()
  return { reduced: plan.reduced, finePointer, plan, intensity: plan.level }
}
