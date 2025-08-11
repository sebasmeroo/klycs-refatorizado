import { Card, ProfileDesign } from '@/types';
import { getDefaultProfileDesign } from '@/data/profileDesignPresets';

export interface ThemeTokens {
  primary: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
  };
  radius: number;
}

export interface ProfileThemeConfig {
  defaultVariant: 'default' | 'poster' | 'ticket';
  overrides?: Partial<ProfileDesign>;
}

export interface ThemePack {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tokens: ThemeTokens;
  sections: {
    profile?: ProfileThemeConfig;
  };
}

// Utilidad: merge profundo simple (solo objetos planos/arrays no anidados complejos)
function deepMerge<T extends Record<string, any>>(base: T | undefined, partial?: Partial<T>): T {
  const safeBase: any = base == null ? (Array.isArray(partial) ? [] : {}) : base;
  if (!partial) return safeBase as T;
  const result: any = Array.isArray(safeBase) ? [...(safeBase as any)] : { ...safeBase };
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      result[key] = value.slice();
    } else if (value && typeof value === 'object') {
      result[key] = deepMerge(result[key] ?? {}, value as any);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// Registro interno de temas (podemos cargar más desde backend en el futuro)
const themes: ThemePack[] = [
  {
    id: 'klycs-default',
    name: 'KLYCS Default',
    description: 'Tema por defecto con look iOS',
    tokens: {
      primary: '#0b0f12',
      surface: 'rgba(255,255,255,0.1)',
      text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.7)' },
      radius: 20,
    },
    sections: {
      profile: {
        defaultVariant: 'default',
        overrides: {
          container: {
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: 20,
            border: { width: 1, style: 'solid', color: 'rgba(255,255,255,0.15)' },
            variant: 'default',
          },
        },
      },
    },
  },
  {
    id: 'poster-classic',
    name: 'Poster Classic',
    description: 'Marco poster con CTA oscuro',
    tokens: {
      primary: '#0b0f12',
      surface: '#d6e3e2',
      text: { primary: '#0b0f12', secondary: '#0b0f12cc' },
      radius: 24,
    },
    sections: {
      profile: {
        defaultVariant: 'poster',
        overrides: {
          container: {
            backgroundColor: '#d6e3e2',
            borderRadius: 24,
            border: { width: 2, style: 'solid', color: '#0b0f12' },
            variant: 'poster',
          },
          content: {
            poster: {
              titleTop: 'STILL WASTING TIME',
              titleBottom: 'LOOKING FOR TICKETS?',
              subtitle: "Simply relax and download our app, we'll take care of the rest.",
              ctaText: 'GET THE APP FOR FREE',
              bgColor: '#d6e3e2',
              frameBorderColor: '#0b0f12',
              ctaBgColor: '#eef4ea',
              ctaTextColor: '#0b0f12',
            },
          },
        },
      },
    },
  },
  {
    id: 'ticket-orange',
    name: 'Ticket Orange',
    description: 'Boleto naranja con dock translúcido',
    tokens: {
      primary: '#ff3b00',
      surface: '#0a0a0a',
      text: { primary: '#0a0a0a', secondary: 'rgba(255,255,255,0.85)' },
      radius: 28,
    },
    sections: {
      profile: {
        defaultVariant: 'ticket',
        overrides: {
          container: {
            backgroundColor: '#0a0a0a',
            borderRadius: 28,
            border: { width: 1, style: 'solid', color: '#1a1a1a' },
            variant: 'ticket',
          },
          content: {
            ticket: {
              eventTitle: 'ART OF VICTORY',
              dateText: 'MONDAY, JULY 23',
              timeText: '9:00 - 10:00',
              attendeeName: 'Anna Jordan',
              attendeeEmail: 'anna.jordan@email.com',
              ctaPrimary: 'Your Tickets',
              ctaSecondary: 'Get Directions',
              primaryColor: '#ff3b00',
              frameBgColor: '#0a0a0a',
              textColor: '#0a0a0a',
              dockBgColor: 'rgba(255,255,255,0.08)',
            },
          },
        },
      },
    },
  },
];

export function getAvailableThemes(): ThemePack[] {
  return themes;
}

export function getThemeById(id?: string): ThemePack | undefined {
  if (!id) return undefined;
  return themes.find((t) => t.id === id);
}

export function applyProfileThemeToCard(card: Card, themeId: string): Card {
  const theme = getThemeById(themeId);
  if (!theme) return card;
  const current = card.profile.design ?? getDefaultProfileDesign();
  const profileCfg = theme.sections.profile;
  // Partimos del diseño por defecto, le aplicamos el diseño actual y luego el override del tema
  const base: ProfileDesign = deepMerge(getDefaultProfileDesign(), current as Partial<ProfileDesign>);
  const mergedDesign: ProfileDesign = deepMerge(base, {
    container: {
      variant: profileCfg?.defaultVariant ?? base.container.variant,
      borderRadius: theme.tokens.radius,
    },
    ...(profileCfg?.overrides ?? {}),
  } as Partial<ProfileDesign>);
  return {
    ...card,
    profile: {
      ...card.profile,
      design: mergedDesign,
      // Guardamos el tema aplicado para referencia futura
      // @ts-expect-error campo extendido solo a nivel de app
      themeId: themeId,
    },
  };
}


