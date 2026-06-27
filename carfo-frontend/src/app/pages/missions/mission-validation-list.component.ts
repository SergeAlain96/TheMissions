import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MissionService, Mission } from '../../core/services/mission.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { StatusBadgeComponent } from '../../core/components/status-badge.component';
import { EmptyStateComponent } from '../../core/components/empty-state.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';
import { IconComponent } from '../../core/components/icon.component';

type ValidationTabKey = 'PREVUE' | 'AVIS_SG_FAVORABLE' | 'AVIS_SG_DEFAVORABLE' | 'INITIEE' | 'ALL';

@Component({
  selector: 'app-mission-validation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AppShellComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    IconComponent,
  ],
  template: `
    <app-shell
      title="Validation des missions"
      description="Approuvez les missions soumises pour qu'elles deviennent officielles."
    >
      <!-- Tabs -->
      <div class="flex items-center gap-2 mb-6 flex-wrap">
        <button
          *ngFor="let tab of tabs"
          (click)="selectTab(tab.key)"
          class="px-3 py-1.5 rounded-full text-xs font-semibold transition border inline-flex items-center gap-2"
          [ngClass]="selectedTab === tab.key
            ? 'bg-carfo-primary text-white border-carfo-primary'
            : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300 hover:bg-ink-50'"
        >
          <app-icon [name]="tab.icon" [size]="14"></app-icon>
          <span>{{ tab.label }}</span>
          <span class="ml-1 text-[11px] opacity-75">{{ countFor(tab.key) }}</span>
        </button>
      </div>

      <!-- Loading -->
      <app-loading-skeleton *ngIf="isLoading" variant="list" [count]="3"></app-loading-skeleton>

      <!-- Missions list -->
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
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Soumise</p>
              <p class="font-semibold text-ink-800 mt-0.5">{{ mission.dateSoumission | date: 'dd/MM' }}</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3">
            <a
              *ngIf="mission.statut === 'PREVUE'"
              [routerLink]="['/missions/valider', mission.idMission]"
              class="btn btn-primary text-xs"
            >
              <app-icon name="check-circle" [size]="14"></app-icon>
              <span>Donner un avis (SG)</span>
            </a>
            <a
              *ngIf="mission.statut === 'AVIS_SG_FAVORABLE'"
              [routerLink]="['/missions/valider', mission.idMission]"
              class="btn btn-primary text-xs"
            >
              <app-icon name="check-circle" [size]="14"></app-icon>
              <span>Valider (DG)</span>
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
        *ngIf="!isLoading && filteredMissions.length === 0 && selectedTab === 'PREVUE'"
        icon="shield-check"
        title="Aucune mission en attente d'avis"
        description="Toutes les missions soumises ont reçu un avis du Secrétariat Général."
      ></app-empty-state>

      <app-empty-state
        *ngIf="!isLoading && filteredMissions.length === 0 && selectedTab === 'AVIS_SG_FAVORABLE'"
        icon="shield-check"
        title="Aucune mission en attente du DG"
        description="Toutes les missions avec avis favorable ont été validées par le Directeur Général."
      ></app-empty-state>

      <app-empty-state
        *ngIf="!isLoading && filteredMissions.length === 0 && selectedTab !== 'PREVUE' && selectedTab !== 'AVIS_SG_FAVORABLE'"
        icon="inbox"
        title="Aucun résultat"
        description="Aucune mission ne correspond à ce filtre pour le moment."
      ></app-empty-state>
    </app-shell>
  `,
})
export class MissionValidationListComponent implements OnInit, OnDestroy {
  missions: Mission[] = [];
  filteredMissions: Mission[] = [];
  selectedTab: ValidationTabKey = 'PREVUE';
  isLoading = false;

  tabs = [
    { key: 'PREVUE'              as const, label: 'Attente avis SG',  icon: 'clock' as const },
    { key: 'AVIS_SG_FAVORABLE'   as const, label: 'Attente DG',       icon: 'check-circle' as const },
    { key: 'AVIS_SG_DEFAVORABLE' as const, label: 'Avis défavorable', icon: 'x-circle' as const },
    { key: 'INITIEE'             as const, label: 'Validées',         icon: 'shield-check' as const },
    { key: 'ALL'                 as const, label: 'Toutes',           icon: 'list' as const },
  ];

  private routerSub?: Subscription;

  constructor(
    private readonly missionService: MissionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadMissions();
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((ev) => {
        if (ev.urlAfterRedirects?.includes('/missions/validation')) {
          this.loadMissions();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  countFor(key: ValidationTabKey): number {
    if (key === 'ALL') return this.missions.length;
    return this.missions.filter((m) => m.statut === key).length;
  }

  selectTab(key: ValidationTabKey): void {
    this.selectedTab = key;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.selectedTab === 'ALL') {
      this.filteredMissions = this.missions;
    } else {
      this.filteredMissions = this.missions.filter((m) => m.statut === this.selectedTab);
    }
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
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Validation list load:', err);
        this.isLoading = false;
      },
    });
  }
}
