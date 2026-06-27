import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, timeout } from 'rxjs';
import {
  SessionSoumission,
  SessionSoumissionService,
} from '../../core/services/session-soumission.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { IconComponent } from '../../core/components/icon.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, IconComponent, LoadingSkeletonComponent],
  template: `
    <app-shell
      title="Sessions de soumission"
      description="Calendrier des fenêtres d'ouverture pour la soumission de missions."
    >
      <!-- Banner session active -->
      <div *ngIf="active" class="carfo-card p-4 mb-6 border-l-4 border-l-emerald-500 bg-emerald-50/40">
        <div class="flex items-start gap-3">
          <div class="text-emerald-600 mt-0.5">
            <app-icon name="check-circle" [size]="18"></app-icon>
          </div>
          <div class="flex-1">
            <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Session ouverte aujourd'hui</p>
            <p class="text-sm font-bold text-ink-900 mt-0.5">{{ active.titre }}</p>
            <p class="text-xs text-ink-600 mt-1">
              Du <strong>{{ active.dateOuverture | date: 'dd MMM yyyy' }}</strong> au
              <strong>{{ active.dateFermeture | date: 'dd MMM yyyy' }}</strong>.
            </p>
          </div>
        </div>
      </div>

      <div *ngIf="!active && !isLoading" class="carfo-card p-4 mb-6 border-l-4 border-l-amber-400 bg-amber-50/40">
        <div class="flex items-start gap-3">
          <div class="text-amber-600 mt-0.5">
            <app-icon name="alert" [size]="18"></app-icon>
          </div>
          <p class="text-xs text-ink-700">
            Aucune session n'est ouverte aujourd'hui. Les directions peuvent toujours soumettre des
            missions, mais elles ne seront pas rattachées à une session officielle.
          </p>
        </div>
      </div>

      <!-- Action : nouvelle session (CE/Admin) -->
      <div *ngIf="canManage" class="flex items-center justify-between mb-4">
        <p class="text-xs text-ink-500">{{ sessions.length }} session(s) au total</p>
        <button (click)="openCreate()" class="btn btn-primary text-xs">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Nouvelle session</span>
        </button>
      </div>

      <app-loading-skeleton *ngIf="isLoading" variant="list" [count]="3"></app-loading-skeleton>

      <!-- Liste des sessions -->
      <div *ngIf="!isLoading && sessions.length > 0" class="grid gap-3">
        <div *ngFor="let s of sessions" class="carfo-card p-5">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-bold text-ink-900">{{ s.titre }}</h3>
              <p *ngIf="s.description" class="text-xs text-ink-500 mt-1">{{ s.description }}</p>
            </div>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              [ngClass]="badgeClasses(s)"
            >
              <span class="h-1.5 w-1.5 rounded-full" [ngClass]="badgeDot(s)"></span>
              <span>{{ badgeLabel(s) }}</span>
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-ink-100">
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Ouverture</p>
              <p class="font-semibold text-ink-800 mt-0.5">{{ s.dateOuverture | date: 'dd MMM yyyy' }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Fermeture</p>
              <p class="font-semibold text-ink-800 mt-0.5">{{ s.dateFermeture | date: 'dd MMM yyyy' }}</p>
            </div>
          </div>

          <div *ngIf="canManage" class="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-ink-100">
            <button (click)="openEdit(s)" class="btn btn-ghost text-xs">
              <app-icon name="pencil" [size]="14"></app-icon>
              <span>Modifier</span>
            </button>
            <button (click)="confirmDelete(s)" class="btn btn-ghost text-xs text-red-600">
              <app-icon name="trash" [size]="14"></app-icon>
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && sessions.length === 0" class="carfo-card p-10 text-center">
        <p class="text-sm text-ink-500">Aucune session enregistrée pour l'instant.</p>
      </div>

      <!-- Modale création/édition -->
      <div *ngIf="formOpen"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
           (click)="closeForm()">
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <h3 class="text-base font-bold text-ink-900 mb-4">
            {{ form.idSession ? 'Modifier la session' : 'Nouvelle session' }}
          </h3>

          <label class="label">Titre *</label>
          <input type="text" [(ngModel)]="form.titre" class="input mb-3" placeholder="Ex: Session mars-avril 2026" />

          <label class="label">Description <span class="text-ink-400 font-normal">(optionnelle)</span></label>
          <textarea [(ngModel)]="form.description" rows="2" class="input mb-3"
                    placeholder="Contexte ou consignes pour les directions…"></textarea>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Ouverture *</label>
              <input type="date" [(ngModel)]="form.dateOuverture" class="input" />
            </div>
            <div>
              <label class="label">Fermeture *</label>
              <input type="date" [(ngModel)]="form.dateFermeture" class="input" />
            </div>
          </div>

          <div *ngIf="formError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
            <p class="text-xs text-ink-700">{{ formError }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="closeForm()" class="btn btn-secondary">Annuler</button>
            <button type="button" (click)="saveForm()" [disabled]="isSaving" class="btn btn-primary">
              <app-icon [name]="isSaving ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSaving"></app-icon>
              <span>{{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}</span>
            </button>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class SessionsComponent implements OnInit {
  sessions: SessionSoumission[] = [];
  active: SessionSoumission | null = null;
  isLoading = false;

  formOpen = false;
  form: SessionSoumission = this.emptyForm();
  isSaving = false;
  formError = '';

  constructor(
    private readonly service: SessionSoumissionService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  get canManage(): boolean {
    return this.authService.hasAnyRole(['CHARGE_ETUDE', 'ADMINISTRATEUR']);
  }

  badgeClasses(s: SessionSoumission): string {
    const status = this.getStatus(s);
    if (status === 'OUVERTE') return 'bg-emerald-50 text-emerald-700';
    if (status === 'FUTURE') return 'bg-blue-50 text-blue-700';
    return 'bg-ink-100 text-ink-700';
  }

  badgeDot(s: SessionSoumission): string {
    const status = this.getStatus(s);
    if (status === 'OUVERTE') return 'bg-emerald-500';
    if (status === 'FUTURE') return 'bg-blue-500';
    return 'bg-ink-500';
  }

  badgeLabel(s: SessionSoumission): string {
    const status = this.getStatus(s);
    if (status === 'OUVERTE') return 'Ouverte';
    if (status === 'FUTURE') return 'À venir';
    return 'Fermée';
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.formError = '';
    this.formOpen = true;
  }

  openEdit(s: SessionSoumission): void {
    this.form = { ...s };
    this.formError = '';
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  saveForm(): void {
    if (this.isSaving) return;
    if (!this.form.titre?.trim() || !this.form.dateOuverture || !this.form.dateFermeture) {
      this.formError = 'Titre et dates sont obligatoires.';
      return;
    }
    if (this.form.dateFermeture < this.form.dateOuverture) {
      this.formError = 'La fermeture doit être après l\'ouverture.';
      return;
    }
    this.isSaving = true;
    this.formError = '';
    const obs = this.form.idSession
      ? this.service.update(this.form.idSession, this.form)
      : this.service.create(this.form);
    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.formOpen = false;
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Save session error:', err);
        this.formError = err.error?.message || 'Erreur lors de l\'enregistrement.';
        this.isSaving = false;
      },
    });
  }

  confirmDelete(s: SessionSoumission): void {
    if (!s.idSession) return;
    const ok = window.confirm(`Supprimer la session « ${s.titre} » ? Cette action est définitive.`);
    if (!ok) return;
    this.service.delete(s.idSession).subscribe({
      next: () => this.reload(),
      error: (err: { error?: { message?: string } }) => {
        window.alert(err.error?.message || 'Erreur lors de la suppression.');
      },
    });
  }

  private getStatus(s: SessionSoumission): 'OUVERTE' | 'FUTURE' | 'FERMEE' {
    const today = new Date().toISOString().slice(0, 10);
    if (s.dateOuverture <= today && s.dateFermeture >= today) return 'OUVERTE';
    if (s.dateOuverture > today) return 'FUTURE';
    return 'FERMEE';
  }

  private emptyForm(): SessionSoumission {
    const today = new Date().toISOString().slice(0, 10);
    return { titre: '', description: '', dateOuverture: today, dateFermeture: today };
  }

  private reload(): void {
    this.isLoading = true;
    this.service
      .listAll()
      .pipe(
        timeout(8000),
        catchError(() => of([] as SessionSoumission[]))
      )
      .subscribe((list) => {
        this.sessions = list;
        this.isLoading = false;
      });

    this.service.getActive().subscribe((s) => (this.active = s));
  }
}
