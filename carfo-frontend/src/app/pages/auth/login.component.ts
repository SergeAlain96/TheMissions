import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../core/components/icon.component';
import { pageEnter } from '../../core/animations/animations';

interface Bubble {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  color: 'emerald' | 'gold' | 'mint' | 'white';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  animations: [pageEnter],
  template: `
    <div @pageEnter class="min-h-screen flex flex-col lg:flex-row bg-ink-50">
      <!-- Left : hero / branding -->
      <aside class="relative lg:w-1/2 bg-carfo-primary text-white overflow-hidden">
        <!-- Decorative blobs -->
        <div class="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/5 blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl"></div>

        <!-- Floating bubbles (palette harmonieuse CARFO) -->
        <div class="bubbles" aria-hidden="true">
          <span
            *ngFor="let b of bubbles"
            class="bubble"
            [class.bubble--emerald]="b.color === 'emerald'"
            [class.bubble--gold]="b.color === 'gold'"
            [class.bubble--mint]="b.color === 'mint'"
            [class.bubble--white]="b.color === 'white'"
            [style.left]="b.left + '%'"
            [style.top]="b.top + '%'"
            [style.width.px]="b.size"
            [style.height.px]="b.size"
            [style.--bubble-duration]="b.duration + 's'"
            [style.--bubble-delay]="b.delay + 's'"
          ></span>
        </div>

        <div class="relative h-full flex flex-col p-8 sm:p-12 lg:p-16">
          <!-- Lock icon top-right (zone authentifiée) -->
          <div class="absolute top-6 right-6 sm:top-8 sm:right-8 h-11 w-11 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white/90"
               aria-label="Espace sécurisé">
            <app-icon name="shield-check" [size]="20"></app-icon>
          </div>

          <!-- Bloc central : logo centré + nom du produit -->
          <div class="flex-1 flex flex-col items-center justify-center text-center">
            <a [routerLink]="['/']" class="inline-flex flex-col items-center gap-5 group">
              <img
                src="/images/carfo-logo.png"
                alt="CARFO"
                class="h-28 w-28 sm:h-32 sm:w-32 object-contain rounded-3xl bg-white/95 shadow-xl p-3"
              />
              <div>
                <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-gold-400 drop-shadow-sm">SYGEM</h1>
                <p class="text-sm sm:text-base text-white/80 mt-2 max-w-sm">
                  Système de gestion des missions administratives
                </p>
              </div>
            </a>

            <div class="mt-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold border border-white/20">
              <app-icon name="shield-check" [size]="12"></app-icon>
              <span>Espace authentifié</span>
            </div>
          </div>

          <div class="text-[11px] text-white/60 text-center">
            © {{ year }} CARFO — Caisse Autonome de Retraite des Fonctionnaires
          </div>
        </div>
      </aside>

      <!-- Right : login form -->
      <main class="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div class="w-full max-w-md">
          <header class="mb-8">
            <h2 class="text-2xl font-bold text-ink-900 tracking-tight">Connexion à votre espace</h2>
            <p class="text-sm text-ink-500 mt-1">
              Entrez vos identifiants institutionnels pour accéder à la plateforme.
            </p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="user" [size]="14" class="text-ink-400"></app-icon>
                <span>Email professionnel</span>
              </label>
              <input
                type="email"
                formControlName="email"
                class="input"
                placeholder="prenom.nom@carfo.bf"
                autocomplete="email"
                autofocus
              />
              <p
                *ngIf="form.get('email')?.touched && form.get('email')?.hasError('required')"
                class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1"
              >
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Email obligatoire</span>
              </p>
              <p
                *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')"
                class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1"
              >
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Format d'email invalide</span>
              </p>
            </div>

            <!-- Password -->
            <div>
              <label class="label inline-flex items-center justify-between">
                <span class="inline-flex items-center gap-2">
                  <app-icon name="shield-check" [size]="14" class="text-ink-400"></app-icon>
                  <span>Mot de passe</span>
                </span>
                <a class="text-xs font-semibold text-carfo-primary hover:text-carfo-primary-light cursor-not-allowed opacity-50" title="Contactez l'administrateur">
                  Oublié ?
                </a>
              </label>
              <div class="relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="motDePasse"
                  class="input pr-12"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition"
                  [attr.aria-label]="showPassword ? 'Masquer' : 'Afficher'"
                >
                  <app-icon [name]="showPassword ? 'x-circle' : 'eye'" [size]="16"></app-icon>
                </button>
              </div>
              <p
                *ngIf="form.get('motDePasse')?.touched && form.get('motDePasse')?.hasError('required')"
                class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1"
              >
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Mot de passe obligatoire</span>
              </p>
            </div>

            <!-- Remember me -->
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                formControlName="rememberMe"
                class="h-4 w-4 rounded border-ink-300 text-carfo-primary focus:ring-carfo-primary"
              />
              <span class="text-sm text-ink-700">Maintenir la session sur cet appareil</span>
            </label>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading"
              class="btn btn-primary w-full"
            >
              <app-icon [name]="loading ? 'refresh' : 'log-in'" [size]="16" [class.animate-spin]="loading"></app-icon>
              <span>{{ loading ? 'Connexion…' : 'Se connecter' }}</span>
            </button>

            <!-- Error message -->
            <div *ngIf="errorMessage" class="carfo-card p-3 border-l-4 border-l-red-400">
              <div class="flex items-start gap-3">
                <div class="text-red-500 mt-0.5">
                  <app-icon name="x-circle" [size]="16"></app-icon>
                </div>
                <p class="text-xs text-ink-700">{{ errorMessage }}</p>
              </div>
            </div>
          </form>

          <!-- Footer info -->
          <div class="mt-8 pt-6 border-t border-ink-100">
            <p class="text-xs text-ink-500 text-center">
              Problème de connexion ? Contactez votre administrateur DSI.
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
    rememberMe: [true],
  });

  loading = false;
  showPassword = false;
  errorMessage = '';
  readonly year = new Date().getFullYear();

  /**
   * Bulles flottantes du hero — positions/tailles aléatoires fixées au montage
   * pour un rendu naturel sans synchronicité visible.
   */
  readonly bubbles: Bubble[] = this.generateBubbles();

  private generateBubbles(): Bubble[] {
    const palette: Bubble['color'][] = ['emerald', 'gold', 'mint', 'white'];
    return Array.from({ length: 14 }).map((_, i) => ({
      left: Math.round(Math.random() * 100),
      top: Math.round(Math.random() * 100),
      size: 40 + Math.round(Math.random() * 120),    // 40-160 px
      duration: 14 + Math.round(Math.random() * 12), // 14-26 s
      delay: -Math.round(Math.random() * 10),        // décalage négatif pour démarrer in medias res
      color: palette[i % palette.length],
    }));
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      email: this.form.value.email ?? '',
      motDePasse: this.form.value.motDePasse ?? '',
    };

    this.authService.login(payload).subscribe({
      next: () => {
        const params = new URLSearchParams(globalThis.location.search);
        const returnUrl = params.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Identifiants incorrects. Vérifiez votre email et votre mot de passe.'
            : err.error?.message ||
              'Connexion impossible. Le serveur est peut-être en mode sans authentification (dev-noauth).';
        this.loading = false;
      },
    });
  }
}
