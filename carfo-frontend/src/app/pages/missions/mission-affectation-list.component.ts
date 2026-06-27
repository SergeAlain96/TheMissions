import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MissionService, Mission } from '../../core/services/mission.service';
import { AffectationService, AffectationView } from '../../core/services/affectation.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { StatusBadgeComponent } from '../../core/components/status-badge.component';
import { EmptyStateComponent } from '../../core/components/empty-state.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';
import { IconComponent } from '../../core/components/icon.component';

type TabKey = 'TO_AFFECT' | 'AFFECTED' | 'ALL';

@Component({
  selector: 'app-mission-affectation-list',
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
      [title]="canAffect ? 'Affectation des ressources' : 'Affectations en cours'"
      [description]="canAffect
        ? 'Assignez un chauffeur et un véhicule aux missions ayant reçu un avis favorable du SG.'
        : 'Consultez les affectations en cours. Seul le DMG peut affecter ou modifier les ressources.'"
    >
      <!-- Info bandeau workflow -->
      <div class="carfo-card p-3 mb-4 border-l-4 border-l-blue-400 bg-blue-50/40">
        <div class="flex items-start gap-3">
          <div class="text-blue-500 mt-0.5">
            <app-icon name="shield-check" [size]="16"></app-icon>
          </div>
          <p class="text-xs text-ink-700">
            <ng-container *ngIf="canAffect; else readOnlyInfo">
              Une mission devient affectable dès qu'elle reçoit un <strong>avis favorable du Secrétariat Général</strong>.
              Les missions au statut <em>Prévue</em> ou <em>Avis SG défavorable</em> n'apparaissent pas ici.
            </ng-container>
            <ng-template #readOnlyInfo>
              Vous consultez les affectations en <strong>lecture seule</strong>. Seul le Directeur des Moyens Généraux (DMG)
              peut créer ou modifier une affectation.
            </ng-template>
          </p>
        </div>
      </div>

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
            <div class="flex items-center gap-2">
              <app-status-badge [status]="mission.statut"></app-status-badge>
              <span
                *ngIf="isAffected(mission.idMission)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-carfo-50 text-carfo-primary"
              >
                <app-icon name="check" [size]="11"></app-icon>
                <span>Affectée</span>
              </span>
            </div>
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
              <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Affectation</p>
              <p *ngIf="getAffectationForMission(mission.idMission) as a" class="font-semibold text-ink-800 mt-0.5 truncate">
                {{ a.prenomChauffeur }} {{ a.nomChauffeur }}
              </p>
              <p *ngIf="!isAffected(mission.idMission)" class="font-semibold text-ink-400 mt-0.5">Aucune</p>
            </div>
          </div>

          <!-- Affectation details (if any) -->
          <div
            *ngIf="getAffectationForMission(mission.idMission) as a"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 px-3 bg-ink-50 rounded-md text-xs"
          >
            <div class="inline-flex items-center gap-2 text-ink-700">
              <app-icon name="user" [size]="14" class="text-carfo-primary"></app-icon>
              <span><strong>{{ a.prenomChauffeur }} {{ a.nomChauffeur }}</strong></span>
            </div>
            <div class="inline-flex items-center gap-2 text-ink-700">
              <app-icon name="car" [size]="14" class="text-carfo-primary"></app-icon>
              <span>
                <strong>{{ a.marqueVehicule }} {{ a.modeleVehicule }}</strong>
                <span class="text-ink-500 ml-1">({{ a.immatriculationVehicule }})</span>
              </span>
            </div>
          </div>

          <!-- Actions — boutons d'écriture réservés au DMG / Admin -->
          <div class="flex items-center justify-end gap-2 pt-3">
            <a
              *ngIf="canAffect && !isAffected(mission.idMission)"
              [routerLink]="['/missions/affecter', mission.idMission]"
              class="btn btn-primary text-xs"
            >
              <app-icon name="route" [size]="14"></app-icon>
              <span>Affecter</span>
            </a>
            <a
              *ngIf="canAffect && isAffected(mission.idMission)"
              [routerLink]="['/missions/affecter', mission.idMission]"
              class="btn btn-secondary text-xs"
            >
              <app-icon name="plus" [size]="14"></app-icon>
              <span>Ajouter une affectation</span>
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
        *ngIf="!isLoading && filteredMissions.length === 0 && selectedTab === 'TO_AFFECT'"
        icon="check-circle"
        title="Tout est affecté !"
        description="Aucune mission validée n'attend de chauffeur ou de véhicule."
      ></app-empty-state>

      <app-empty-state
        *ngIf="!isLoading && filteredMissions.length === 0 && selectedTab !== 'TO_AFFECT'"
        icon="inbox"
        title="Aucune mission à afficher"
        description="Aucune mission ne correspond à ce filtre pour le moment."
      ></app-empty-state>
    </app-shell>
  `,
})
export class MissionAffectationListComponent implements OnInit {
  missions: Mission[] = [];
  affectations: AffectationView[] = [];
  filteredMissions: Mission[] = [];
  selectedTab: TabKey = 'TO_AFFECT';
  isLoading = false;

  tabs = [
    { key: 'TO_AFFECT' as const, label: 'À affecter', icon: 'clock' as const },
    { key: 'AFFECTED'  as const, label: 'Affectées',  icon: 'check-circle' as const },
    { key: 'ALL'       as const, label: 'Toutes',     icon: 'list' as const },
  ];

  /**
   * Seul le DMG (DIRECTEUR_DIRECTION rattaché à la Direction des Moyens Généraux) ou un Administrateur
   * peut créer/modifier/supprimer des affectations. Les autres directions ne voient que la lecture.
   */
  get canAffect(): boolean {
    const user = this.authService.getUser();
    if (!user) return false;
    if (user.role === 'ADMINISTRATEUR') return true;
    if (user.role !== 'DIRECTEUR_DIRECTION') return false;
    const dir = (user.nomDirection || '').toLowerCase();
    return dir.includes('moyens') || dir.includes('général');
  }

  constructor(
    private readonly missionService: MissionService,
    private readonly affectationService: AffectationService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  countFor(key: TabKey): number {
    return this.filterMissions(key).length;
  }

  selectTab(key: TabKey): void {
    this.selectedTab = key;
    this.applyFilter();
  }

  isAffected(missionId: number | undefined): boolean {
    if (missionId === undefined) return false;
    return this.affectations.some((a) => a.idMission === missionId && (a.statut === 'ACTIVE' || !a.statut));
  }

  getAffectationForMission(missionId: number | undefined): AffectationView | undefined {
    if (missionId === undefined) return undefined;
    // Renvoie la première affectation ACTIVE pour cette mission (utilisée pour l'aperçu chauffeur/véhicule)
    return this.affectations.find((a) => a.idMission === missionId && (a.statut === 'ACTIVE' || !a.statut));
  }

  countActiveAffectations(missionId: number | undefined): number {
    if (missionId === undefined) return 0;
    return this.affectations.filter((a) => a.idMission === missionId && (a.statut === 'ACTIVE' || !a.statut)).length;
  }

  private filterMissions(key: TabKey): Mission[] {
    // Une mission est affectable dès qu'elle a reçu un avis favorable du SG, jusqu'à sa clôture.
    const eligible = this.missions.filter(
      (m) => m.statut === 'AVIS_SG_FAVORABLE'
          || m.statut === 'INITIEE'
          || m.statut === 'EN_COURS'
          || m.statut === 'CLOTUREE'
    );
    if (key === 'ALL') return eligible;
    if (key === 'TO_AFFECT') {
      return eligible.filter(
        (m) => (m.statut === 'AVIS_SG_FAVORABLE' || m.statut === 'INITIEE') && !this.isAffected(m.idMission)
      );
    }
    return eligible.filter((m) => this.isAffected(m.idMission));
  }

  private applyFilter(): void {
    this.filteredMissions = this.filterMissions(this.selectedTab);
  }

  private loadData(): void {
    this.isLoading = true;
    forkJoin({
      missions: this.missionService.getAllMissions(),
      affectations: this.affectationService.getAllAffectations(),
    }).subscribe({
      next: ({ missions, affectations }) => {
        this.missions = missions;
        this.affectations = affectations;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Affectation list load:', err);
        this.isLoading = false;
      },
    });
  }
}
