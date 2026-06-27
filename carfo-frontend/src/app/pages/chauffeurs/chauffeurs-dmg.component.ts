import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, timeout } from 'rxjs';
import {
  ChauffeurStatus,
  ChauffeurStatusService,
  StatutChauffeur,
} from '../../core/services/chauffeur-status.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { IconComponent } from '../../core/components/icon.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';

const STATUS_META: Record<StatutChauffeur, { label: string; bg: string; text: string; dot: string; icon: string }> = {
  DISPONIBLE:   { label: 'Disponible',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: 'check-circle' },
  INDISPONIBLE: { label: 'Indisponible', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   icon: 'x-circle' },
  EN_MISSION:   { label: 'En mission',   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    icon: 'route' },
  ABSENT:       { label: 'Absent',       bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    icon: 'clock' },
};

@Component({
  selector: 'app-chauffeurs-dmg',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, IconComponent, LoadingSkeletonComponent],
  template: `
    <app-shell
      title="Gestion des chauffeurs"
      description="Vue d'ensemble des statuts en temps réel. Seul le DMG peut modifier les statuts manuels."
    >
      <!-- Synthèse -->
      <div *ngIf="!isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div *ngFor="let s of statusList" class="carfo-card p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="h-2.5 w-2.5 rounded-full" [ngClass]="META[s.key].dot"></span>
            <p class="text-xs uppercase tracking-wider font-semibold text-ink-500">{{ META[s.key].label }}</p>
          </div>
          <p class="text-2xl font-bold text-ink-900">{{ countByEffectif(s.key) }}</p>
        </div>
      </div>

      <!-- Recherche -->
      <div class="relative mb-4">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <app-icon name="search" [size]="14"></app-icon>
        </span>
        <input
          type="text"
          [(ngModel)]="search"
          class="input pl-9 max-w-md"
          placeholder="Rechercher par matricule, nom ou prénom…"
          autocomplete="off"
        />
      </div>

      <!-- Loading -->
      <app-loading-skeleton *ngIf="isLoading" variant="list" [count]="4"></app-loading-skeleton>

      <!-- Liste chauffeurs -->
      <div *ngIf="!isLoading && filtered.length > 0" class="grid gap-3">
        <div *ngFor="let c of filtered" class="carfo-card p-5 hover:border-ink-300 transition">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <!-- Identité -->
            <div class="flex items-start gap-3 min-w-0 flex-1">
              <div class="h-11 w-11 shrink-0 rounded-full bg-carfo-50 text-carfo-primary flex items-center justify-center text-sm font-bold">
                {{ initials(c.nom, c.prenom) }}
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-bold text-ink-900 truncate">{{ c.prenom }} {{ c.nom }}</h3>
                <p class="text-xs text-ink-500 mt-0.5">
                  <span class="font-mono">{{ c.matricule }}</span>
                  <span *ngIf="c.telephone" class="ml-2">· {{ c.telephone }}</span>
                </p>
              </div>
            </div>

            <!-- Badge statut effectif -->
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              [ngClass]="[META[c.statutEffectif].bg, META[c.statutEffectif].text]"
            >
              <app-icon [name]="$any(META[c.statutEffectif].icon)" [size]="12"></app-icon>
              <span>{{ META[c.statutEffectif].label }}</span>
            </span>
          </div>

          <!-- Contexte selon statut effectif -->
          <div class="mt-3 pt-3 border-t border-ink-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Statut manuel</p>
              <p class="font-semibold text-ink-700 mt-0.5">{{ META[c.statutManuel].label }}</p>
            </div>
            <div *ngIf="c.statutManuel === 'INDISPONIBLE'">
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Disponible à partir du</p>
              <p class="font-semibold text-ink-700 mt-0.5">{{ c.dateDisponibilite ? (c.dateDisponibilite | date: 'dd MMM yy') : '—' }}</p>
            </div>
            <div *ngIf="c.statutEffectif === 'EN_MISSION' && c.missionEnCoursRef">
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Mission en cours</p>
              <p class="font-semibold text-ink-700 mt-0.5 font-mono">{{ c.missionEnCoursRef }}</p>
            </div>
            <div *ngIf="c.statutEffectif === 'ABSENT' && c.absenceFin">
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Absence jusqu'au</p>
              <p class="font-semibold text-ink-700 mt-0.5">{{ c.absenceFin | date: 'dd MMM yy' }}</p>
            </div>
          </div>

          <!-- Action DMG -->
          <div *ngIf="canEdit" class="flex items-center justify-end pt-3">
            <button (click)="openEditor(c)" class="btn btn-secondary text-xs">
              <app-icon name="pencil" [size]="14"></app-icon>
              <span>Modifier statut manuel</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && filtered.length === 0" class="carfo-card p-10 text-center">
        <p class="text-sm text-ink-500">Aucun chauffeur ne correspond à votre recherche.</p>
      </div>

      <!-- Modale édition -->
      <div *ngIf="editing"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
           (click)="closeEditor()">
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <h3 class="text-base font-bold text-ink-900 mb-1">
            Statut de {{ editing.prenom }} {{ editing.nom }}
          </h3>
          <p class="text-xs text-ink-500 mb-5">
            Les statuts <em>En mission</em> et <em>Absent</em> sont calculés automatiquement.
            Vous pouvez uniquement basculer entre Disponible et Indisponible.
          </p>

          <label class="label">Statut</label>
          <div class="grid grid-cols-2 gap-2 mb-4">
            <label class="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition"
              [ngClass]="form.statut === 'DISPONIBLE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-ink-200 hover:border-ink-300'">
              <input type="radio" name="statut" value="DISPONIBLE" [(ngModel)]="form.statut" />
              <app-icon name="check-circle" [size]="14"></app-icon>
              <span class="text-xs font-semibold">Disponible</span>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition"
              [ngClass]="form.statut === 'INDISPONIBLE' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-ink-200 hover:border-ink-300'">
              <input type="radio" name="statut" value="INDISPONIBLE" [(ngModel)]="form.statut" />
              <app-icon name="x-circle" [size]="14"></app-icon>
              <span class="text-xs font-semibold">Indisponible</span>
            </label>
          </div>

          <div *ngIf="form.statut === 'INDISPONIBLE'">
            <label class="label">Disponible à partir du <span class="text-ink-400 font-normal">(optionnel)</span></label>
            <input
              type="date"
              [(ngModel)]="form.dateDisponibilite"
              [min]="todayIso"
              class="input"
            />
            <p class="text-[11px] text-ink-500 mt-1.5">
              Une fois la date dépassée, le chauffeur réapparaîtra automatiquement comme Disponible.
            </p>
          </div>

          <div *ngIf="editError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
            <p class="text-xs text-ink-700">{{ editError }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="closeEditor()" class="btn btn-secondary">Annuler</button>
            <button type="button" (click)="saveEditor()" [disabled]="isSaving" class="btn btn-primary">
              <app-icon [name]="isSaving ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSaving"></app-icon>
              <span>{{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}</span>
            </button>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class ChauffeursDmgComponent implements OnInit {
  readonly META = STATUS_META;
  readonly statusList: { key: StatutChauffeur }[] = [
    { key: 'DISPONIBLE' }, { key: 'INDISPONIBLE' }, { key: 'EN_MISSION' }, { key: 'ABSENT' },
  ];
  readonly todayIso = new Date().toISOString().slice(0, 10);

  chauffeurs: ChauffeurStatus[] = [];
  isLoading = false;
  search = '';

  editing: ChauffeurStatus | null = null;
  form: { statut: 'DISPONIBLE' | 'INDISPONIBLE'; dateDisponibilite: string | null } = {
    statut: 'DISPONIBLE',
    dateDisponibilite: null,
  };
  isSaving = false;
  editError = '';

  constructor(
    private readonly statusService: ChauffeurStatusService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get canEdit(): boolean {
    return this.authService.hasAnyRole(['DIRECTEUR_DIRECTION', 'ADMINISTRATEUR']);
  }

  get filtered(): ChauffeurStatus[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.chauffeurs;
    return this.chauffeurs.filter((c) =>
      [c.matricule, c.nom, c.prenom].some((v) => v?.toLowerCase().includes(q))
    );
  }

  countByEffectif(statut: StatutChauffeur): number {
    return this.chauffeurs.filter((c) => c.statutEffectif === statut).length;
  }

  initials(nom: string, prenom: string): string {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  }

  openEditor(c: ChauffeurStatus): void {
    if (!this.canEdit) return;
    this.editing = c;
    this.form = {
      statut: c.statutManuel === 'INDISPONIBLE' ? 'INDISPONIBLE' : 'DISPONIBLE',
      dateDisponibilite: c.dateDisponibilite ?? null,
    };
    this.editError = '';
  }

  closeEditor(): void {
    this.editing = null;
  }

  saveEditor(): void {
    if (!this.editing) return;
    this.isSaving = true;
    this.editError = '';

    const dateDispo = this.form.statut === 'INDISPONIBLE' ? (this.form.dateDisponibilite || null) : null;

    this.statusService.updateStatut(this.editing.idAgent, this.form.statut, dateDispo).subscribe({
      next: (updated) => {
        this.chauffeurs = this.chauffeurs.map((c) => (c.idAgent === updated.idAgent ? updated : c));
        this.isSaving = false;
        this.editing = null;
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('[Chauffeurs] update statut error:', err);
        this.editError = err.error?.message || "Erreur lors de l'enregistrement.";
        this.isSaving = false;
      },
    });
  }

  private load(): void {
    this.isLoading = true;
    this.statusService
      .listStatuses()
      .pipe(
        timeout(8000),
        catchError((err: unknown) => {
          console.error('[Chauffeurs] load error:', err);
          return of([] as ChauffeurStatus[]);
        })
      )
      .subscribe((data) => {
        this.chauffeurs = data;
        this.isLoading = false;
      });
  }
}
