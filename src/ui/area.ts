import type { Area } from '../content/types'

/** Static class names per area so Tailwind can see them. Text always uses -ink on -tint. */
export const areaClass: Record<Area, { tint: string; ink: string; solid: string; ring: string }> = {
  motor: { tint: 'bg-motor-tint', ink: 'text-motor-ink', solid: 'bg-motor', ring: 'ring-motor' },
  cognitive: { tint: 'bg-cognitive-tint', ink: 'text-cognitive-ink', solid: 'bg-cognitive', ring: 'ring-cognitive' },
  language: { tint: 'bg-language-tint', ink: 'text-language-ink', solid: 'bg-language', ring: 'ring-language' },
  social: { tint: 'bg-social-tint', ink: 'text-social-ink', solid: 'bg-social', ring: 'ring-social' },
}
