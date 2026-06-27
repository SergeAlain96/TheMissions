import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MissionService } from '../../core/services/mission.service';
import { AgentService } from '../../core/services/agent.service';
import { VehiculeService } from '../../core/services/vehicule.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { KpiCardComponent } from '../../core/components/kpi-card.component';
import { IconComponent, IconName } from '../../core/components/icon.component';

interface FeatureCard {
  icon: IconName;
  title: string;
  description: string;
  route: string;
  cta: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, AppShellComponent, KpiCardComponent, IconComponent],
  template: `
    <app-shell>
      <!-- Hero section -->
      <section class="relative overflow-hidden rounded-2xl bg-carfo-primary text-white shadow-elevated mb-10">
        <!-- Decorative shapes -->
        <div class="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/5 blur-2xl"></div>
        <div class="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-2xl"></div>

        <div class="relative px-6 py-10 sm:px-10 sm:py-14 max-w-5xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold border border-white/20 mb-5">
            <app-icon name="sparkles" [size]="12"></app-icon>
            <span>Plateforme CARFO</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Gérez les missions de votre institution en toute sérénité
          </h1>
          <p class="text-base sm:text-lg text-white/85 max-w-2xl mb-8">
            Planifiez, validez, affectez et suivez chaque mission. Un workflow clair de la
            soumission jusqu'à la clôture, avec règles métier appliquées automatiquement.
          </p>

          <div class="flex flex-wrap gap-3">
            <a [routerLink]="['/missions/creer']" class="btn bg-gold-500 hover:bg-gold-600 text-carfo-800 font-bold">
              <app-icon name="plus" [size]="16"></app-icon>
              <span>Nouvelle mission</span>
            </a>
            <a [routerLink]="['/dashboard']" class="btn bg-white/10 hover:bg-white/15 text-white border border-white/20">
              <app-icon name="dashboard" [size]="16"></app-icon>
              <span>Tableau de bord</span>
            </a>
            <a [routerLink]="['/missions']" class="btn bg-transparent hover:bg-white/5 text-white">
              <span>Voir toutes les missions</span>
              <app-icon name="arrow-right" [size]="16"></app-icon>
            </a>
          </div>
        </div>
      </section>

      <!-- KPI grid -->
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-ink-900">Vue d'ensemble</h2>
          <a [routerLink]="['/dashboard']" class="text-sm font-semibold text-carfo-primary hover:text-carfo-primary-light inline-flex items-center gap-1">
            <span>Voir le tableau de bord</span>
            <app-icon name="arrow-right" [size]="14"></app-icon>
          </a>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <app-kpi-card
            icon="clipboard"
            label="Missions"
            [value]="missionsCount"
            hint="Total enregistrées"
            tone="green"
            route="/missions"
            [loading]="loading"
          ></app-kpi-card>

          <app-kpi-card
            icon="clock"
            label="À valider"
            [value]="toValidateCount"
            hint="En attente d'approbation"
            tone="gold"
            route="/missions/validation"
            [loading]="loading"
          ></app-kpi-card>

          <app-kpi-card
            icon="users"
            label="Agents"
            [value]="agentsCount"
            hint="Personnel enregistré"
            tone="blue"
            route="/agents"
            [loading]="loading"
          ></app-kpi-card>

          <app-kpi-card
            icon="car"
            label="Véhicules"
            [value]="vehiclesCount"
            hint="Parc total"
            tone="gray"
            [loading]="loading"
          ></app-kpi-card>
        </div>
      </section>

      <!-- Features grid -->
      <section class="mb-12">
        <div class="mb-4">
          <h2 class="text-lg font-bold text-ink-900">Workflow des missions</h2>
          <p class="text-sm text-ink-500">De la soumission à la clôture, suivez chaque étape.</p>
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
export class LandingComponent implements OnInit {
  missionsCount: number = 0;
  agentsCount: number = 0;
  vehiclesCount: number = 0;
  toValidateCount: number = 0;
  loading = true;

  features: FeatureCard[] = [
    {
      icon: 'pencil',
      title: 'Soumettre',
      description: 'Créez une mission avec ses participants, son objet, son lieu et ses dates. La règle des 10 jours est appliquée automatiquement.',
      route: '/missions/creer',
      cta: 'Créer une mission',
    },
    {
      icon: 'shield-check',
      title: 'Valider',
      description: 'La Secrétaire Générale approuve les missions en attente. La transition PREVUE → INITIEE déclenche la suite du workflow.',
      route: '/missions/validation',
      cta: 'Voir les validations',
    },
    {
      icon: 'route',
      title: 'Affecter',
      description: 'Pour chaque mission validée, assignez un chauffeur disponible et un véhicule. Les conflits sont détectés automatiquement.',
      route: '/missions/affecter',
      cta: 'Gérer les affectations',
    },
  ];

  constructor(
    private readonly missionService: MissionService,
    private readonly agentService: AgentService,
    private readonly vehiculeService: VehiculeService
  ) {}

  ngOnInit(): void {
    forkJoin({
      missions: this.missionService.getAllMissions(),
      agents: this.agentService.getAllAgents(),
      vehicles: this.vehiculeService.getAllVehicles(),
    }).subscribe({
      next: ({ missions, agents, vehicles }) => {
        this.missionsCount = missions.length;
        this.toValidateCount = missions.filter((m) => m.statut === 'PREVUE').length;
        this.agentsCount = agents.length;
        this.vehiclesCount = vehicles.length;
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Landing stats:', err);
        this.loading = false;
      },
    });
  }
}
