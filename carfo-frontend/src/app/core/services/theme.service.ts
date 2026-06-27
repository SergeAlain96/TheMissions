import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'carfo_theme';

/**
 * Gère le thème clair/sombre de l'application.
 * - Persiste le choix utilisateur dans localStorage
 * - Au premier chargement : utilise la préférence stockée, sinon `prefers-color-scheme` du système
 * - Applique la classe `dark` sur <html> pour activer les variants Tailwind `dark:` et les
 *   variables CSS définies dans styles.css
 *
 * Signal `mode` réactif pour les composants qui veulent afficher l'état (ex: icône lune/soleil).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');

  constructor() {
    this.initFromStorage();
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore quotaExceeded / sandbox */
    }
  }

  private initFromStorage(): void {
    let initial: ThemeMode = 'light';
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') {
        initial = saved;
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        // Préférence du système si rien en storage
        initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {
      /* localStorage indisponible — on garde light */
    }
    this.mode.set(initial);
    this.apply(initial);
  }

  private apply(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
