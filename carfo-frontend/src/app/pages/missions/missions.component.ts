import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MissionService, Mission } from '../../core/services/mission.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { StatusBadgeComponent } from '../../core/components/status-badge.component';
import { EmptyStateComponent } from '../../core/components/empty-state.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';
import { IconComponent } from '../../core/components/icon.component';

interface StatusFilter {
  key: string;
  label: string;
}

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppShellComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    IconComponent,
  ],
  template: `
    <app-shell
      title="Missions"
      description="Liste complète des missions enregistrées."
    >
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <!-- Filter chips -->
        <div class="flex items-center gap-2 flex-wrap">
          <button
            *ngFor="let f of filters"
            (click)="filterByStatus(f.key)"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition border"
            [ngClass]="selectedStatus === f.key
              ? 'bg-carfo-primary text-white border-carfo-primary'
              : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300 hover:bg-ink-50'"
          >
            {{ f.label }}
            <span class="ml-1 text-[11px] opacity-75">{{ countFor(f.key) }}</span>
          </button>
        </div>

        <a [routerLink]="['/missions/creer']" class="btn btn-primary">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Nouvelle mission</span>
        </a>
      </div>

      <!-- Search -->
      <div class="mb-6 relative max-w-md">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <app-icon name="search" [size]="16"></app-icon>
        </span>
        <input
          type="text"
          class="input pl-10"
          placeholder="Rechercher par objet, lieu ou direction..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="applyFilters()"
          [attr.aria-label]="'Rechercher dans les missions'"
        />
      </div>

      <!-- Loading -->
      <app-loading-skeleton *ngIf="isLoading" variant="list" [count]="3"></app-loading-skeleton>

      <!-- List -->
      <div *ngIf="!isLoading && filteredMissions.length > 0" class="grid gap-3">
        <div
          *ngFor="let mission of filteredMissions"
          class="carfo-card p-5 hover:shadow-card-hover hover:border-ink-300 transition"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-bold text-ink-900 truncate">{{ mission.objetMission }}</h3>
              <p class="text-xs text-ink-500 mt-1 inline-flex items-center gap-1">
                <app-icon name="map-pin" [size]="12"></app-icon>
                <span>{{ mission.lieu }}</span>
                <span class="mx-1">·</span>
                <span>{{ mission.reference || '#' + mission.idMission }}</span>
              </p>
            </div>
            <app-status-badge [status]="mission.statut"></app-status-badge>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pb-4 border-b border-ink-100">
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Début</p>
              <p class="font-semibold text-ink-800 mt-0.5">{{ mission.dateDebut | date: 'dd MMM yy' }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Fin</p>
              <p class="font-semibold text-ink-800 mt-0.5">{{ mission.dateFin | date: 'dd MMM yy' }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Direction</p>
              <p class="font-semibold text-ink-800 mt-0.5 truncate">{{ mission.nomDirection || '—' }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Durée</p>
              <p class="font-semibold text-ink-800 mt-0.5">{{ duration(mission) }} j</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3">
            <a
              *ngIf="canValidate && (mission.statut === 'PREVUE' || mission.statut === 'AVIS_SG_FAVORABLE')"
              [routerLink]="['/missions/valider', mission.idMission]"
              class="btn btn-secondary text-xs"
            >
              <app-icon name="check-circle" [size]="14"></app-icon>
              <span>{{ mission.statut === 'PREVUE' ? 'Donner avis' : 'Valider' }}</span>
            </a>
            <a
              *ngIf="canAffect && (mission.statut === 'INITIEE' || mission.statut === 'AVIS_SG_FAVORABLE')"
              [routerLink]="['/missions/affecter', mission.idMission]"
              class="btn btn-secondary text-xs"
            >
              <app-icon name="car" [size]="14"></app-icon>
              <span>Affecter</span>
            </a>
            <a [routerLink]="['/missions', mission.idMission]" class="btn btn-ghost text-xs">
              <app-icon name="eye" [size]="14"></app-icon>
              <span>Détails</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Empty states -->
      <app-empty-state
        *ngIf="!isLoading && missions.length === 0"
        icon="inbox"
        title="Aucune mission enregistrée"
        description="Commencez par créer une nouvelle mission depuis le bouton ci-dessous."
        ctaLabel="Créer une mission"
        ctaRoute="/missions/creer"
      ></app-empty-state>

      <app-empty-state
        *ngIf="!isLoading && missions.length > 0 && filteredMissions.length === 0"
        icon="filter"
        title="Aucune mission ne correspond"
        description="Modifiez vos filtres ou votre recherche pour voir d'autres résultats."
      ></app-empty-state>
    </app-shell>
  `,
})
export class MissionsComponent implements OnInit {
  missions: Mission[] = [];
  filteredMissions: Mission[] = [];
  selectedStatus = 'ALL';
  searchQuery = '';
  isLoading = false;

  filters: StatusFilter[] = [
    { key: 'ALL',      label: 'Toutes' },
    { key: 'PREVUE',   label: 'Prévues' },
    { key: 'INITIEE',  label: 'Initiées' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'CLOTUREE', label: 'Clôturées' },
    { key: 'ANNULEE',  label: 'Annulées' },
  ];

  constructor(
    private readonly missionService: MissionService,
    private readonly authService: AuthService
  ) {}

  /** Validation/avis : SG, DG ou Admin. */
  get canValidate(): boolean {
    return this.authService.hasAnyRole(['SECRETAIRE_GENERALE', 'DIRECTEUR', 'ADMINISTRATEUR']);
  }

  /** Affectation : DMG (DD Moyens Généraux) ou Admin. */
  get canAffect(): boolean {
    const u = this.authService.getUser();
    if (!u) return false;
    if (u.role === 'ADMINISTRATEUR') return true;
    if (u.role !== 'DIRECTEUR_DIRECTION') return false;
    const d = (u.nomDirection || '').toLowerCase();
    return d.includes('moyens') || d.includes('général');
  }

  ngOnInit(): void {
    this.loadMissions();
  }

  countFor(key: string): number {
    if (key === 'ALL') return this.missions.length;
    return this.missions.filter((m) => m.statut === key).length;
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredMissions = this.missions.filter((m) => {
      if (this.selectedStatus !== 'ALL' && m.statut !== this.selectedStatus) return false;
      if (q) {
        const hay = `${m.objetMission ?? ''} ${m.lieu ?? ''} ${m.nomDirection ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  duration(mission: Mission): number {
    if (!mission.dateDebut || !mission.dateFin) return 0;
    const start = new Date(mission.dateDebut).getTime();
    const end = new Date(mission.dateFin).getTime();
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }

  private loadMissions(): void {
    this.isLoading = true;
    this.missionService.getAllMissions().subscribe({
      next: (data) => {
        this.missions = [...data].sort((a, b) => {
          const da = a.dateSoumission ? Date.parse(a.dateSoumission) : 0;
          const db = b.dateSoumission ? Date.parse(b.dateSoumission) : 0;
          return db - da;
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Missions load:', err);
        this.isLoading = false;
      },
    });
  }
}
