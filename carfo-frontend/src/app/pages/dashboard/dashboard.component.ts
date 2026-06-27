import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MissionService, Mission } from '../../core/services/mission.service';
import { AgentService } from '../../core/services/agent.service';
import { VehiculeService } from '../../core/services/vehicule.service';
import { AffectationService } from '../../core/services/affectation.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { KpiCardComponent } from '../../core/components/kpi-card.component';
import { StatusBadgeComponent } from '../../core/components/status-badge.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';
import { IconComponent, IconName } from '../../core/components/icon.component';

interface StatusSegment {
  status: string;
  label: string;
  count: number;
  color: string;
  percent: number;
  dashArray: string;
  dashOffset: number;
}

interface DirectionStat {
  name: string;
  count: number;
  percent: number;
}

interface FeatureCard {
  icon: IconName;
  title: string;
  description: string;
  route: string;
  cta: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppShellComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    IconComponent,
  ],
  template: `
    <app-shell
      title="Tableau de bord"
      description="Indicateurs clés, répartition des missions et activité récente."
    >
      <!-- Hero accueil — dégradé vert pro (vert foncé → vert → vert clair) -->
      <section class="relative overflow-hidden rounded-2xl shadow-elevated mb-6
                      bg-gradient-to-br from-carfo-700 via-carfo-primary to-carfo-400 text-white">
        <!-- Halos décoratifs blanc / vert clair -->
        <div class="absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-carfo-200/20 blur-3xl"></div>
        <div class="absolute inset-0 opacity-[0.06]"
             style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 22px 22px;"></div>

        <div class="relative px-6 py-9 sm:px-10 sm:py-12 max-w-5xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold border border-white/25 mb-4">
            <app-icon name="sparkles" [size]="12"></app-icon>
            <span>Bienvenue, {{ userPrenom }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-3 drop-shadow-sm">
            Gérez les missions de votre institution en toute sérénité
          </h1>
          <p class="text-sm sm:text-base text-white/90 max-w-2xl mb-6">
            Planifiez, validez, affectez et suivez chaque mission. Un workflow clair de la
            soumission jusqu'à la clôture, avec règles métier appliquées automatiquement.
          </p>

          <div class="flex flex-wrap gap-2.5">
            <!-- CTA principal : blanc plein, texte vert -->
            <a *ngIf="canCreateMission" [routerLink]="['/missions/creer']"
               class="btn bg-white text-carfo-700 hover:bg-carfo-50 hover:text-carfo-800 font-bold text-sm shadow-md hover:shadow-lg transition">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>Nouvelle mission</span>
            </a>
            <!-- Secondaires : vert clair translucide, texte blanc -->
            <a [routerLink]="['/missions']"
               class="btn bg-white/15 hover:bg-white/25 text-white hover:text-white border border-white/30 font-semibold text-sm backdrop-blur transition">
              <app-icon name="clipboard" [size]="14"></app-icon>
              <span>Voir les missions</span>
            </a>
            <a [routerLink]="['/statistiques']"
               class="btn bg-white/15 hover:bg-white/25 text-white hover:text-white border border-white/30 font-semibold text-sm backdrop-blur transition">
              <app-icon name="bar" [size]="14"></app-icon>
              <span>Statistiques détaillées</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Period selector -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div class="text-sm text-ink-500 inline-flex items-center gap-2">
          <app-icon name="calendar" [size]="16"></app-icon>
          <span>Mise à jour : <span class="font-semibold text-ink-700">{{ today | date: 'EEEE d MMMM y' }}</span></span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <input type="date" [(ngModel)]="dashFrom" class="input max-w-[150px] text-xs" title="Date de début" />
          <span class="text-ink-400 text-xs">→</span>
          <input type="date" [(ngModel)]="dashTo" class="input max-w-[150px] text-xs" title="Date de fin" />
          <button (click)="applyDashRange()" class="btn btn-secondary text-xs">
            <app-icon name="filter" [size]="13"></app-icon>
            <span>Filtrer</span>
          </button>
          <button *ngIf="dashFrom || dashTo" (click)="clearDashRange()" class="btn btn-ghost text-xs">
            <app-icon name="x" [size]="13"></app-icon>
          </button>
        </div>
      </div>

      <!-- KPI grid -->
      <div *ngIf="loading" class="mb-8">
        <app-loading-skeleton variant="kpi"></app-loading-skeleton>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <app-kpi-card
          icon="clipboard"
          label="Missions totales"
          [value]="totalMissions"
          hint="Toutes périodes confondues"
          tone="green"
          route="/missions"
        ></app-kpi-card>

        <app-kpi-card
          icon="clock"
          label="En attente"
          [value]="statusCount('PREVUE')"
          hint="Missions à valider"
          tone="gold"
          route="/missions/validation"
        ></app-kpi-card>

        <app-kpi-card
          icon="route"
          label="Affectations"
          [value]="totalAffectations"
          hint="Chauffeur + véhicule assignés"
          tone="blue"
          route="/missions/affecter"
        ></app-kpi-card>

        <app-kpi-card
          icon="users"
          label="Effectif"
          [value]="totalAgents"
          [hint]="totalVehicles + ' véhicules au parc'"
          tone="gray"
        ></app-kpi-card>
      </div>

      <!-- Charts row -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <!-- Donut chart: status breakdown -->
        <div class="carfo-card p-6 lg:col-span-1">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-bold text-ink-900 inline-flex items-center gap-2">
              <app-icon name="pie" [size]="16" class="text-ink-400"></app-icon>
              <span>Répartition par statut</span>
            </h2>
            <span class="text-xs text-ink-400">{{ totalMissions }} total</span>
          </div>

          <div *ngIf="totalMissions === 0" class="text-center py-8 text-sm text-ink-400">
            Aucune mission à afficher
          </div>

          <div *ngIf="totalMissions > 0" class="flex items-center gap-6">
            <!-- Donut SVG -->
            <div class="relative shrink-0">
              <svg viewBox="0 0 120 120" class="w-32 h-32 -rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#F1F5F9" stroke-width="14"></circle>
                <circle
                  *ngFor="let seg of statusSegments"
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  [attr.stroke]="seg.color"
                  stroke-width="14"
                  [attr.stroke-dasharray]="seg.dashArray"
                  [attr.stroke-dashoffset]="seg.dashOffset"
                  stroke-linecap="butt"
                ></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-ink-900">{{ totalMissions }}</span>
                <span class="text-[10px] text-ink-400 uppercase tracking-wider">Missions</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex-1 space-y-2 min-w-0">
              <div
                *ngFor="let seg of statusSegments"
                class="flex items-center justify-between text-sm gap-3"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="h-2.5 w-2.5 rounded-sm shrink-0" [style.background-color]="seg.color"></span>
                  <span class="text-ink-700 truncate">{{ seg.label }}</span>
                </div>
                <span class="font-bold text-ink-900 shrink-0">{{ seg.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bar chart: missions by direction -->
        <div class="carfo-card p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-sm font-bold text-ink-900 inline-flex items-center gap-2">
              <app-icon name="bar" [size]="16" class="text-ink-400"></app-icon>
              <span>Missions par direction</span>
            </h2>
            <span class="text-xs text-ink-400">Top 5</span>
          </div>

          <div *ngIf="directionStats.length === 0" class="text-center py-8 text-sm text-ink-400">
            Aucune mission à afficher
          </div>

          <div *ngIf="directionStats.length > 0" class="space-y-4">
            <div *ngFor="let dir of directionStats">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-ink-700 font-medium truncate inline-flex items-center gap-2">
                  <app-icon name="building" [size]="14" class="text-ink-400"></app-icon>
                  <span>{{ dir.name }}</span>
                </span>
                <span class="text-ink-500 text-xs">{{ dir.count }} missions</span>
              </div>
              <div class="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-carfo-primary rounded-full transition-all"
                  [style.width.%]="dir.percent"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent activity -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Recent missions -->
        <div class="carfo-card p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-bold text-ink-900 inline-flex items-center gap-2">
              <app-icon name="list" [size]="16" class="text-ink-400"></app-icon>
              <span>Missions récentes</span>
            </h2>
            <a [routerLink]="['/missions']" class="text-xs font-semibold text-carfo-primary hover:text-carfo-primary-light inline-flex items-center gap-1">
              <span>Voir tout</span>
              <app-icon name="arrow-right" [size]="12"></app-icon>
            </a>
          </div>

          <div *ngIf="recentMissions.length === 0" class="text-center py-8 text-sm text-ink-400">
            Aucune mission récente
          </div>

          <ul *ngIf="recentMissions.length > 0" class="divide-y divide-ink-100">
            <li *ngFor="let m of recentMissions" class="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
              <div
                class="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                [ngClass]="statusIconBg(m.statut)"
              >
                <app-icon [name]="statusIcon(m.statut)" [size]="18"></app-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-ink-900 truncate">{{ m.objetMission }}</p>
                <p class="text-xs text-ink-500 truncate inline-flex items-center gap-1">
                  <app-icon name="map-pin" [size]="11"></app-icon>
                  <span>{{ m.lieu }} · {{ m.nomDirection || '—' }} · {{ m.dateDebut | date: 'dd/MM' }} → {{ m.dateFin | date: 'dd/MM' }}</span>
                </p>
              </div>
              <app-status-badge [status]="m.statut"></app-status-badge>
            </li>
          </ul>
        </div>

        <!-- Quick actions -->
        <div class="carfo-card p-6">
          <h2 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
            <app-icon name="sparkles" [size]="16" class="text-ink-400"></app-icon>
            <span>Actions rapides</span>
          </h2>
          <div class="flex flex-col gap-2">
            <a *ngIf="canCreateMission" [routerLink]="['/missions/creer']" class="btn btn-primary justify-start">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>Nouvelle mission</span>
            </a>
            <a *ngIf="canValidate" [routerLink]="['/missions/validation']" class="btn btn-secondary justify-start">
              <app-icon name="check-circle" [size]="16"></app-icon>
              <span>Valider les missions ({{ statusCount('PREVUE') }})</span>
            </a>
            <a *ngIf="canAffect" [routerLink]="['/missions/affecter']" class="btn btn-secondary justify-start">
              <app-icon name="car" [size]="16"></app-icon>
              <span>Affecter les ressources</span>
            </a>
            <a *ngIf="canManageAgents" [routerLink]="['/agents']" class="btn btn-secondary justify-start">
              <app-icon name="users" [size]="16"></app-icon>
              <span>Gérer les agents</span>
            </a>
            <a [routerLink]="['/missions']" class="btn btn-secondary justify-start">
              <app-icon name="clipboard" [size]="16"></app-icon>
              <span>Consulter les missions</span>
            </a>
          </div>

          <div class="mt-6 pt-6 border-t border-ink-100">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-semibold text-ink-500">Taux d'affectation</span>
              <span class="text-xs font-bold text-carfo-primary">{{ affectationRate }}%</span>
            </div>
            <div class="h-2 bg-ink-100 rounded-full overflow-hidden">
              <div class="h-full bg-carfo-primary rounded-full transition-all" [style.width.%]="affectationRate"></div>
            </div>
            <p class="text-[11px] text-ink-400 mt-2">
              Missions initiées avec chauffeur + véhicule assignés.
            </p>
          </div>
        </div>
      </div>

      <!-- Workflow des missions (fusionné depuis l'ancienne landing) -->
      <section class="mt-8 mb-4">
        <div class="mb-4">
          <h2 class="text-lg font-bold text-ink-900">Workflow des missions</h2>
          <p class="text-sm text-ink-500">De la soumission à la clôture, chaque étape est tracée.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            *ngFor="let feature of features; let i = index"
            [routerLink]="[feature.route]"
            class="carfo-card p-6 hover:shadow-card-hover hover:border-carfo-300 transition group relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 px-2 py-1 bg-ink-100 text-ink-500 text-[11px] font-bold rounded-bl-lg tracking-wider">
              ÉTAPE {{ i + 1 }}
            </div>
            <div class="h-12 w-12 rounded-xl bg-carfo-50 text-carfo-primary flex items-center justify-center mb-4">
              <app-icon [name]="feature.icon" [size]="24"></app-icon>
            </div>
            <h3 class="text-base font-bold text-ink-900 mb-1">{{ feature.title }}</h3>
            <p class="text-sm text-ink-500 mb-4">{{ feature.description }}</p>
            <span class="inline-flex items-center gap-1 text-sm font-semibold text-carfo-primary group-hover:gap-2 transition-all">
              <span>{{ feature.cta }}</span>
              <app-icon name="arrow-right" [size]="14"></app-icon>
            </span>
          </a>
        </div>
      </section>
    </app-shell>
  `,
})
export class DashboardComponent implements OnInit {
  today = new Date();
  loading = true;

  totalMissions = 0;
  totalAgents = 0;
  totalVehicles = 0;
  totalAffectations = 0;

  missions: Mission[] = [];
  recentMissions: Mission[] = [];

  /** Données après filtre direction (scope), avant filtre période. */
  scopeMissions: Mission[] = [];
  scopeAffectations: { idMission?: number }[] = [];

  /** Filtre période dashboard (ISO yyyy-MM-dd). */
  dashFrom = '';
  dashTo = '';
  statusSegments: StatusSegment[] = [];
  directionStats: DirectionStat[] = [];
  affectationRate = 0;

  /** Prénom affiché dans le hero d'accueil. */
  userPrenom = '';

  /** Création de mission réservée aux rôles autorisés à soumettre (DD, DG, CE, Admin). */
  canCreateMission = false;

  /** Validation (avis SG ou validation DG) : SG, DG, Admin. */
  canValidate = false;

  /** Affectation : DMG ou Admin uniquement. */
  canAffect = false;

  /** Gestion des agents : DMG ou Admin uniquement. */
  canManageAgents = false;

  /** Étapes du workflow (fusionnées depuis l'ancienne landing page). */
  features: FeatureCard[] = [
    {
      icon: 'pencil',
      title: 'Soumettre',
      description: 'Créez une mission avec ses participants, son objet, son lieu et ses dates. La règle des 10 jours ouvrables est appliquée automatiquement.',
      route: '/missions/creer',
      cta: 'Créer une mission',
    },
    {
      icon: 'shield-check',
      title: 'Valider',
      description: 'La Secrétaire Générale donne son avis, puis le Directeur Général valide la mission. La transition vers INITIEE déclenche la suite du workflow.',
      route: '/missions/validation',
      cta: 'Voir les validations',
    },
    {
      icon: 'route',
      title: 'Affecter',
      description: 'Pour chaque mission validée, le DMG assigne un chauffeur disponible et un véhicule. Les conflits de période sont détectés automatiquement.',
      route: '/missions/affecter',
      cta: 'Gérer les affectations',
    },
  ];

  private readonly statusOrder = ['PREVUE', 'INITIEE', 'EN_COURS', 'CLOTUREE', 'ANNULEE'];
  private readonly statusMeta: Record<string, { label: string; color: string; icon: IconName; bg: string }> = {
    PREVUE:   { label: 'Prévues',   color: '#F59E0B', icon: 'clock',        bg: 'bg-amber-50 text-amber-700' },
    INITIEE:  { label: 'Initiées',  color: '#3B82F6', icon: 'check-circle', bg: 'bg-blue-50 text-blue-700' },
    EN_COURS: { label: 'En cours',  color: '#0D5C3F', icon: 'rocket',       bg: 'bg-carfo-50 text-carfo-primary' },
    CLOTUREE: { label: 'Clôturées', color: '#64748B', icon: 'flag',         bg: 'bg-ink-100 text-ink-700' },
    ANNULEE:  { label: 'Annulées',  color: '#EF4444', icon: 'x-circle',     bg: 'bg-red-50 text-red-700' },
  };

  constructor(
    private readonly missionService: MissionService,
    private readonly agentService: AgentService,
    private readonly vehiculeService: VehiculeService,
    private readonly affectationService: AffectationService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userPrenom = user?.prenom || '';
    // Calcul des permissions affichées (les backends restent protégés par @PreAuthorize)
    this.canCreateMission = this.authService.hasAnyRole([
      'DIRECTEUR_DIRECTION', 'DIRECTEUR', 'CHARGE_ETUDE', 'ADMINISTRATEUR',
    ]);
    this.canValidate = this.authService.hasAnyRole([
      'SECRETAIRE_GENERALE', 'DIRECTEUR', 'ADMINISTRATEUR',
    ]);
    // DMG = DIRECTEUR_DIRECTION rattaché à la Direction des Moyens Généraux
    const isDmg = user?.role === 'DIRECTEUR_DIRECTION'
        && (user.nomDirection || '').toLowerCase().match(/moyens|général/) !== null;
    this.canAffect = user?.role === 'ADMINISTRATEUR' || isDmg;
    this.canManageAgents = user?.role === 'ADMINISTRATEUR' || isDmg;

    // Un Directeur de Direction ne voit que les données de SA direction au dashboard.
    // (DG, SG, CE, Admin gardent la vue globale.)
    const restrictToDirection = user?.role === 'DIRECTEUR_DIRECTION'
        ? (user.nomDirection || '')
        : null;

    forkJoin({
      missions: this.missionService.getAllMissions(),
      agents: this.agentService.getAllAgents(),
      vehicles: this.vehiculeService.getAllVehicles(),
      affectations: this.affectationService.getAllAffectations(),
    }).subscribe({
      next: ({ missions, agents, vehicles, affectations }) => {
        // Filtrage par direction pour les DD
        if (restrictToDirection) {
          missions = missions.filter((m) => m.nomDirection === restrictToDirection);
          const missionIds = new Set(missions.map((m) => m.idMission));
          affectations = affectations.filter((a) => missionIds.has(a.idMission));
          agents = agents.filter((ag) => ag.nomDirection === restrictToDirection);
        }
        // Scope = données après filtre direction (avant filtre date)
        this.scopeMissions = missions;
        this.scopeAffectations = affectations;
        this.totalAgents = agents.length;
        this.totalVehicles = vehicles.length;
        this.recompute();
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Dashboard load:', err);
        this.loading = false;
      },
    });
  }

  /** Applique le filtre période (dateDebut ∈ [from,to]) puis recalcule tous les indicateurs. */
  recompute(): void {
    let missions = this.scopeMissions;
    const from = this.dashFrom ? Date.parse(this.dashFrom) : null;
    const to = this.dashTo ? Date.parse(this.dashTo) : null;
    if (from || to) {
      missions = missions.filter((m) => {
        if (!m.dateDebut) return false;
        const d = Date.parse(m.dateDebut);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    this.missions = missions;
    this.totalMissions = missions.length;

    const ids = new Set(missions.map((m) => m.idMission));
    this.totalAffectations = this.scopeAffectations.filter((a) => ids.has(a.idMission)).length;

    this.recentMissions = [...missions]
      .sort((a, b) => {
        const da = a.dateSoumission ? Date.parse(a.dateSoumission) : 0;
        const db = b.dateSoumission ? Date.parse(b.dateSoumission) : 0;
        return db - da;
      })
      .slice(0, 5);

    this.computeStatusSegments();
    this.computeDirectionStats();
    this.computeAffectationRate();
  }

  applyDashRange(): void {
    this.recompute();
  }

  clearDashRange(): void {
    this.dashFrom = '';
    this.dashTo = '';
    this.recompute();
  }

  statusCount(status: string): number {
    return this.missions.filter((m) => m.statut === status).length;
  }

  statusIcon(status: string | undefined): IconName {
    if (!status) return 'clipboard';
    return this.statusMeta[status]?.icon ?? 'clipboard';
  }

  statusIconBg(status: string | undefined): string {
    if (!status) return 'bg-ink-100 text-ink-700';
    return this.statusMeta[status]?.bg ?? 'bg-ink-100 text-ink-700';
  }

  private computeStatusSegments(): void {
    if (this.totalMissions === 0) {
      this.statusSegments = [];
      return;
    }
    const circumference = 2 * Math.PI * 48;
    let cumulative = 0;
    this.statusSegments = this.statusOrder
      .map((status) => {
        const count = this.statusCount(status);
        if (count === 0) return null;
        const percent = (count / this.totalMissions) * 100;
        const meta = this.statusMeta[status];
        const segLength = (percent / 100) * circumference;
        const segment: StatusSegment = {
          status,
          label: meta.label,
          count,
          color: meta.color,
          percent,
          dashArray: `${segLength} ${circumference}`,
          dashOffset: -cumulative,
        };
        cumulative += segLength;
        return segment;
      })
      .filter((s): s is StatusSegment => s !== null);
  }

  private computeDirectionStats(): void {
    const counts = new Map<string, number>();
    this.missions.forEach((m) => {
      const name = m.nomDirection || '—';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    const max = Math.max(1, ...counts.values());
    this.directionStats = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, percent: (count / max) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private computeAffectationRate(): void {
    const initiees = this.statusCount('INITIEE') + this.statusCount('EN_COURS');
    if (initiees === 0) {
      this.affectationRate = 0;
      return;
    }
    this.affectationRate = Math.round((this.totalAffectations / initiees) * 100);
    if (this.affectationRate > 100) this.affectationRate = 100;
  }
}
