import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgentService, Agent } from '../../core/services/agent.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { EmptyStateComponent } from '../../core/components/empty-state.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';
import { IconComponent, IconName } from '../../core/components/icon.component';

interface RoleFilter {
  key: string;
  label: string;
  icon: IconName;
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATEUR:      'Administrateur',
  SECRETAIRE_GENERALE: 'Secrétaire Générale',
  DIRECTEUR:           'Directeur',
  DIRECTEUR_DIRECTION: 'Directeur direction',
  CHARGE_ETUDE:        "Chargé d'étude",
  AGENT:               'Agent',
};

const ROLE_BADGE: Record<string, string> = {
  ADMINISTRATEUR:      'bg-purple-50 text-purple-700',
  SECRETAIRE_GENERALE: 'bg-blue-50 text-blue-700',
  DIRECTEUR:           'bg-amber-50 text-amber-700',
  DIRECTEUR_DIRECTION: 'bg-amber-50 text-amber-700',
  CHARGE_ETUDE:        'bg-carfo-50 text-carfo-primary',
  AGENT:               'bg-ink-100 text-ink-700',
};

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppShellComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    IconComponent,
  ],
  template: `
    <app-shell
      title="Agents"
      description="Annuaire du personnel CARFO et de leurs rôles."
    >
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            *ngFor="let f of filters"
            (click)="filterByRole(f.key)"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition border inline-flex items-center gap-1.5"
            [ngClass]="selectedRole === f.key
              ? 'bg-carfo-primary text-white border-carfo-primary'
              : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300 hover:bg-ink-50'"
          >
            <app-icon [name]="f.icon" [size]="13"></app-icon>
            <span>{{ f.label }}</span>
            <span class="ml-1 text-[11px] opacity-75">{{ countFor(f.key) }}</span>
          </button>
        </div>

        <a *ngIf="canManage" [routerLink]="['/agents/creer']" class="btn btn-primary">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Nouvel agent</span>
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
          placeholder="Rechercher par nom, matricule, email..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="applyFilters()"
        />
      </div>

      <!-- Loading -->
      <app-loading-skeleton *ngIf="isLoading" variant="list" [count]="3"></app-loading-skeleton>

      <!-- Grid of agents -->
      <div *ngIf="!isLoading && filteredAgents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          *ngFor="let agent of filteredAgents"
          class="carfo-card p-5 hover:shadow-card-hover hover:border-ink-300 transition"
        >
          <div class="flex items-start gap-3 mb-4">
            <div class="h-11 w-11 rounded-full bg-carfo-50 text-carfo-primary flex items-center justify-center text-sm font-bold shrink-0">
              {{ initials(agent.nom, agent.prenom) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-ink-900 truncate">{{ agent.prenom }} {{ agent.nom }}</p>
              <p class="text-xs text-ink-500 truncate">{{ agent.email }}</p>
            </div>
            <span
              *ngIf="agent.actif === false"
              class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-700"
            >
              Inactif
            </span>
          </div>

          <div class="space-y-2 pb-3 mb-3 border-b border-ink-100 text-xs">
            <div class="flex items-center gap-2 text-ink-600">
              <app-icon name="briefcase" [size]="13" class="text-ink-400"></app-icon>
              <span class="truncate">{{ agent.fonction || 'Aucune fonction renseignée' }}</span>
            </div>
            <div class="flex items-center gap-2 text-ink-600" *ngIf="agent.matricule">
              <app-icon name="file" [size]="13" class="text-ink-400"></app-icon>
              <span>Matricule : <strong>{{ agent.matricule }}</strong></span>
            </div>
            <div class="flex items-center gap-2 text-ink-600">
              <app-icon name="building" [size]="13" class="text-ink-400"></app-icon>
              <span class="truncate">{{ agent.nomDirection || '—' }}</span>
            </div>
            <div class="flex items-center gap-2 text-ink-600" *ngIf="agent.telephone">
              <app-icon name="user" [size]="13" class="text-ink-400"></app-icon>
              <span>{{ agent.telephone }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="badgeClass(agent.role)"
              >
                {{ roleLabel(agent.role) }}
              </span>
              <span
                *ngIf="agent.estChauffeur"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700"
              >
                <app-icon name="car" [size]="10"></app-icon>
                <span>Chauffeur</span>
              </span>
            </div>

            <div *ngIf="canManage" class="flex items-center gap-1">
              <a
                [routerLink]="['/agents', agent.idAgent, 'edit']"
                class="btn btn-ghost text-xs"
                title="Modifier"
                aria-label="Modifier"
              >
                <app-icon name="pencil" [size]="14"></app-icon>
              </a>
              <button
                *ngIf="agent.actif !== false"
                (click)="deleteAgent(agent.idAgent!)"
                class="btn btn-ghost text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Désactiver"
                aria-label="Désactiver"
              >
                <app-icon name="trash" [size]="14"></app-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div *ngIf="errorMessage" class="mt-4 carfo-card p-4 border-l-4 border-l-red-400">
        <div class="flex items-start gap-3">
          <div class="text-red-500 mt-0.5">
            <app-icon name="x-circle" [size]="18"></app-icon>
          </div>
          <p class="text-xs text-ink-700">{{ errorMessage }}</p>
        </div>
      </div>

      <div *ngIf="successMessage" class="mt-4 carfo-card p-4 border-l-4 border-l-carfo-primary">
        <div class="flex items-start gap-3">
          <div class="text-carfo-primary mt-0.5">
            <app-icon name="check-circle" [size]="18"></app-icon>
          </div>
          <p class="text-xs text-ink-700">{{ successMessage }}</p>
        </div>
      </div>

      <!-- Empty states -->
      <app-empty-state
        *ngIf="!isLoading && agents.length === 0"
        icon="users"
        title="Aucun agent enregistré"
        description="L'annuaire est vide pour le moment."
        ctaLabel="Ajouter un agent"
        ctaRoute="/agents/creer"
      ></app-empty-state>

      <app-empty-state
        *ngIf="!isLoading && agents.length > 0 && filteredAgents.length === 0"
        icon="filter"
        title="Aucun résultat"
        description="Modifiez vos filtres ou votre recherche pour voir d'autres agents."
      ></app-empty-state>
    </app-shell>
  `,
})
export class AgentsComponent implements OnInit {
  agents: Agent[] = [];
  filteredAgents: Agent[] = [];
  selectedRole = 'ALL';
  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  filters: RoleFilter[] = [
    { key: 'ALL',                 label: 'Tous',                icon: 'list' },
    { key: 'ADMINISTRATEUR',      label: 'Administrateurs',     icon: 'shield-check' },
    { key: 'SECRETAIRE_GENERALE', label: 'Secrétariat général', icon: 'briefcase' },
    { key: 'DIRECTEUR_DIRECTION', label: 'Directeurs',          icon: 'building' },
    { key: 'CHARGE_ETUDE',        label: "Chargés d'étude",     icon: 'file' },
    { key: 'AGENT',               label: 'Agents',              icon: 'users' },
  ];

  constructor(
    private readonly agentService: AgentService,
    private readonly authService: AuthService
  ) {}

  /**
   * Seul le DMG (DIRECTEUR_DIRECTION rattaché à la Direction des Moyens Généraux) ou un Administrateur
   * peut créer / modifier / désactiver des agents. Les autres rôles consultent en lecture seule.
   */
  get canManage(): boolean {
    const user = this.authService.getUser();
    if (!user) return false;
    if (user.role === 'ADMINISTRATEUR') return true;
    if (user.role !== 'DIRECTEUR_DIRECTION') return false;
    const dir = (user.nomDirection || '').toLowerCase();
    return dir.includes('moyens') || dir.includes('général');
  }

  ngOnInit(): void {
    this.loadAgents();
  }

  countFor(key: string): number {
    if (key === 'ALL') return this.agents.length;
    return this.agents.filter((a) => a.role === key).length;
  }

  filterByRole(role: string): void {
    this.selectedRole = role;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredAgents = this.agents.filter((a) => {
      if (this.selectedRole !== 'ALL' && a.role !== this.selectedRole) return false;
      if (q) {
        const hay = `${a.nom ?? ''} ${a.prenom ?? ''} ${a.matricule ?? ''} ${a.email ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  roleLabel(role: string | null | undefined): string {
    if (!role) return 'Sans compte';
    return ROLE_LABELS[role] ?? role;
  }

  badgeClass(role: string | null | undefined): string {
    if (!role) return 'bg-ink-100 text-ink-500';
    return ROLE_BADGE[role] ?? 'bg-ink-100 text-ink-700';
  }

  initials(nom: string, prenom: string): string {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  }

  deleteAgent(agentId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet agent ?')) return;
    this.agentService.deactivateAgent(agentId).subscribe({
      next: () => {
        this.successMessage = 'Agent désactivé avec succès.';
        this.errorMessage = '';
        setTimeout(() => this.loadAgents(), 800);
      },
      error: (err: unknown) => {
        console.error('Deactivate error:', err);
        this.errorMessage = "Erreur lors de la désactivation de l'agent.";
        this.successMessage = '';
      },
    });
  }

  private loadAgents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.agentService.getAllAgents().subscribe({
      next: (data) => {
        this.agents = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Agents load:', err);
        this.errorMessage = 'Impossible de charger les agents.';
        this.isLoading = false;
      },
    });
  }
}
