import type { IconName } from '@/config/profile'

/** Icons a service can use (must match the `serviceIcons` map in components/site/services.tsx). */
export const ICON_NAMES = ['bar-chart', 'brain', 'trending-up', 'bot', 'workflow', 'scan', 'globe'] as const satisfies readonly IconName[]
