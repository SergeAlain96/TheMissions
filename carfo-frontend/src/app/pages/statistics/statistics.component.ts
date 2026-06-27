import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, timeout } from 'rxjs';
import { StatisticsService, StatisticsPayload } from '../../core/services/statistics.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { IconComponent } from '../../core/components/icon.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_LABEL: Record<string, { label: string; color: string; hex: string }> = {
  PREVUE:              { label: 'Prévues',              color: 'bg-amber-500',   hex: '#F59E0B' },
  AVIS_SG_FAVORABLE:   { label: 'Avis SG favorable',    color: 'bg-emerald-500', hex: '#10B981' },
  AVIS_SG_DEFAVORABLE: { label: 'Avis SG défavorable',  color: 'bg-rose-500',    hex: '#F43F5E' },
  INITIEE:             { label: 'Initiées (validées)',  color: 'bg-blue-500',    hex: '#3B82F6' },
  CLOTUREE:            { label: 'Clôturées',            color: 'bg-ink-500',     hex: '#64748B' },
  ANNULEE:             { label: 'Annulées',             color: 'bg-red-500',     hex: '#EF4444' },
};

/** Palette pour le camembert des directions (cycle si plus de couleurs que d'entrées). */
const PIE_PALETTE = ['#16A34A', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', '#64748B'];

interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, IconComponent, LoadingSkeletonComponent],
  template: `
    <app-shell
      title="Statistiques"
      description="Tableau de bord analytique des missions de l'année."
    >
      <!-- Filtre année -->
      <div class="carfo-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-lg bg-carfo-50 text-carfo-primary flex items-center justify-center shrink-0">
            <app-icon name="calendar" [size]="18"></app-icon>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-ink-400 font-semibold">Année analysée</p>
            <p class="text-sm font-bold text-ink-900">{{ selectedYear }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <select
            id="year-select"
            [(ngModel)]="selectedYear"
            (change)="onYearChange()"
            class="input max-w-[120px]"
            title="Filtre rapide par année"
          >
            <option *ngFor="let y of availableYears" [ngValue]="y">{{ y }}</option>
          </select>

          <!-- Filtre plage de dates -->
          <input type="date" [(ngModel)]="dateFrom" class="input max-w-[150px]" title="Date de début" />
          <span class="text-ink-400 text-xs">→</span>
          <input type="date" [(ngModel)]="dateTo" class="input max-w-[150px]" title="Date de fin" />
          <button (click)="applyDateRange()" class="btn btn-secondary text-xs">
            <app-icon name="filter" [size]="13"></app-icon>
            <span>Filtrer</span>
          </button>
          <button *ngIf="dateFrom || dateTo" (click)="clearDateRange()" class="btn btn-ghost text-xs">
            <app-icon name="x" [size]="13"></app-icon>
          </button>
        </div>

        <!-- Exports : empilés verticalement, collés à l'extrême droite -->
        <div class="flex flex-col gap-2 items-stretch sm:ml-auto">
          <button (click)="downloadPdf()" [disabled]="isExportingPdf"
                  class="btn btn-primary text-xs w-28 justify-start"
                  title="Télécharger le rapport PDF">
            <app-icon [name]="isExportingPdf ? 'refresh' : 'download'" [size]="14"
                      [class.animate-spin]="isExportingPdf"></app-icon>
            <span>{{ isExportingPdf ? 'Export…' : 'PDF' }}</span>
          </button>
          <button (click)="downloadCsv()" [disabled]="isExportingCsv"
                  class="btn btn-primary text-xs w-28 justify-start"
                  title="Télécharger les données CSV (Excel)">
            <app-icon [name]="isExportingCsv ? 'refresh' : 'download'" [size]="14"
                      [class.animate-spin]="isExportingCsv"></app-icon>
            <span>{{ isExportingCsv ? 'Export…' : 'CSV' }}</span>
          </button>
        </div>
      </div>

      <div *ngIf="exportError" class="carfo-card p-3 mb-4 border-l-4 border-l-red-400">
        <div class="flex items-start gap-2">
          <app-icon name="x-circle" [size]="14" class="text-red-500"></app-icon>
          <p class="text-xs text-ink-700">{{ exportError }}</p>
        </div>
      </div>

      <!-- Loading -->
      <app-loading-skeleton *ngIf="isLoading" variant="kpi" [count]="4"></app-loading-skeleton>

      <ng-container *ngIf="!isLoading && stats">
        <!-- Indicateurs ressources (état courant — non filtré par année) -->
        <div *ngIf="stats.ressources" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div class="carfo-card p-4 flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <app-icon name="users" [size]="18"></app-icon>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Agents actifs</p>
              <p class="text-xl font-bold text-ink-900">{{ stats.ressources.totalAgents }}</p>
            </div>
          </div>
          <div class="carfo-card p-4 flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <app-icon name="user" [size]="18"></app-icon>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Chauffeurs</p>
              <p class="text-xl font-bold text-ink-900">{{ stats.ressources.totalChauffeurs }}</p>
            </div>
          </div>
          <div class="carfo-card p-4 flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-carfo-50 text-carfo-primary flex items-center justify-center">
              <app-icon name="car" [size]="18"></app-icon>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Véhicules disponibles</p>
              <p class="text-xl font-bold text-ink-900">{{ stats.ressources.vehiculesDisponibles }}</p>
            </div>
          </div>
        </div>

        <!-- 4 KPI cards (avec delta année N-1) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="carfo-card p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 rounded-lg bg-carfo-50 text-carfo-primary flex items-center justify-center">
                <app-icon name="clipboard" [size]="18"></app-icon>
              </div>
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Total missions</p>
            </div>
            <p class="text-3xl font-bold text-ink-900">{{ stats.totalMissions }}</p>
            <p class="text-xs text-ink-500 mt-1">soumises en {{ stats.year }}</p>
            <p *ngIf="stats.previousYear" class="text-[11px] mt-2 inline-flex items-center gap-1"
               [ngClass]="deltaColor(stats.totalMissions, stats.previousYear.kpi.total)">
              <span>{{ deltaLabel(stats.totalMissions, stats.previousYear.kpi.total) }}</span>
              <span class="text-ink-400">vs {{ stats.previousYear.year }}</span>
            </p>
          </div>

          <div class="carfo-card p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <app-icon name="check-circle" [size]="18"></app-icon>
              </div>
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Validées</p>
            </div>
            <p class="text-3xl font-bold text-ink-900">{{ stats.missionsValidated }}</p>
            <p class="text-xs text-ink-500 mt-1">{{ pct(stats.missionsValidated) }}% du total</p>
            <p *ngIf="stats.previousYear" class="text-[11px] mt-2 inline-flex items-center gap-1"
               [ngClass]="deltaColor(stats.missionsValidated, stats.previousYear.kpi.validated)">
              <span>{{ deltaLabel(stats.missionsValidated, stats.previousYear.kpi.validated) }}</span>
              <span class="text-ink-400">vs {{ stats.previousYear.year }}</span>
            </p>
          </div>

          <div class="carfo-card p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <app-icon name="clock" [size]="18"></app-icon>
              </div>
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold">En attente</p>
            </div>
            <p class="text-3xl font-bold text-ink-900">{{ stats.missionsPending }}</p>
            <p class="text-xs text-ink-500 mt-1">Prévues + avis SG favorable</p>
            <p *ngIf="stats.previousYear" class="text-[11px] mt-2 inline-flex items-center gap-1"
               [ngClass]="deltaColor(stats.missionsPending, stats.previousYear.kpi.pending)">
              <span>{{ deltaLabel(stats.missionsPending, stats.previousYear.kpi.pending) }}</span>
              <span class="text-ink-400">vs {{ stats.previousYear.year }}</span>
            </p>
          </div>

          <div class="carfo-card p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                <app-icon name="x-circle" [size]="18"></app-icon>
              </div>
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Annulées</p>
            </div>
            <p class="text-3xl font-bold text-ink-900">{{ stats.missionsCancelled }}</p>
            <p class="text-xs text-ink-500 mt-1">{{ pct(stats.missionsCancelled) }}% du total</p>
            <p *ngIf="stats.previousYear" class="text-[11px] mt-2 inline-flex items-center gap-1"
               [ngClass]="deltaColor(stats.missionsCancelled, stats.previousYear.kpi.cancelled, true)">
              <span>{{ deltaLabel(stats.missionsCancelled, stats.previousYear.kpi.cancelled) }}</span>
              <span class="text-ink-400">vs {{ stats.previousYear.year }}</span>
            </p>
          </div>
        </div>

        <!-- Graphes -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <!-- Missions par mois (col-span-2) -->
          <div class="carfo-card p-5 lg:col-span-2">
            <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
              <app-icon name="calendar" [size]="16" class="text-ink-400"></app-icon>
              <span>Missions par mois</span>
            </h3>

            <div *ngIf="maxMonth > 0; else emptyMonth" class="flex items-end gap-2 h-48">
              <div *ngFor="let count of stats.missionsByMonth; let i = index" class="flex-1 flex flex-col items-center gap-2">
                <p class="text-xs font-bold text-ink-700">{{ count }}</p>
                <div
                  class="w-full bg-carfo-primary rounded-t-md transition-all"
                  [style.height.%]="(count / maxMonth) * 100"
                  [class.opacity-30]="count === 0"
                ></div>
                <p class="text-[11px] text-ink-500 font-semibold">{{ monthLabels[i] }}</p>
              </div>
            </div>
            <ng-template #emptyMonth>
              <p class="text-sm text-ink-400 italic">Aucune mission n'a été enregistrée sur {{ stats.year }}.</p>
            </ng-template>
          </div>

          <!-- Distribution par statut (camembert) -->
          <div class="carfo-card p-5">
            <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
              <app-icon name="pie" [size]="16" class="text-ink-400"></app-icon>
              <span>Par statut</span>
            </h3>
            <div *ngIf="statusSegments.length > 0; else emptyStatus" class="flex flex-col items-center gap-4">
              <div class="relative shrink-0">
                <svg viewBox="0 0 120 120" class="w-32 h-32 -rotate-90">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-100)" stroke-width="16"></circle>
                  <circle
                    *ngFor="let seg of statusSegments"
                    cx="60" cy="60" r="46" fill="none"
                    [attr.stroke]="seg.color"
                    stroke-width="16"
                    [attr.stroke-dasharray]="seg.dashArray"
                    [attr.stroke-dashoffset]="seg.dashOffset"
                  ></circle>
                </svg>
              </div>
              <ul class="space-y-2 w-full">
                <li *ngFor="let s of statusSegments" class="flex items-center gap-3">
                  <span class="h-2.5 w-2.5 rounded-sm shrink-0" [style.background-color]="s.color"></span>
                  <span class="text-xs text-ink-700 flex-1 truncate">{{ s.label }}</span>
                  <span class="text-sm font-bold text-ink-900">{{ s.value }}</span>
                </li>
              </ul>
            </div>
            <ng-template #emptyStatus>
              <p class="text-sm text-ink-400 italic">Aucune mission sur cette période.</p>
            </ng-template>
          </div>
        </div>

        <!-- Missions par direction (camembert) -->
        <div class="carfo-card p-5">
          <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
            <app-icon name="building" [size]="16" class="text-ink-400"></app-icon>
            <span>Missions par direction</span>
          </h3>

          <div *ngIf="directionSegments.length > 0; else emptyDirection" class="flex flex-col sm:flex-row items-center gap-6">
            <!-- Donut SVG -->
            <div class="relative shrink-0">
              <svg viewBox="0 0 120 120" class="w-40 h-40 -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-100)" stroke-width="16"></circle>
                <circle
                  *ngFor="let seg of directionSegments"
                  cx="60" cy="60" r="46" fill="none"
                  [attr.stroke]="seg.color"
                  stroke-width="16"
                  [attr.stroke-dasharray]="seg.dashArray"
                  [attr.stroke-dashoffset]="seg.dashOffset"
                ></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-ink-900">{{ stats.totalMissions }}</span>
                <span class="text-[10px] text-ink-400 uppercase tracking-wider">missions</span>
              </div>
            </div>
            <!-- Légende -->
            <div class="flex-1 space-y-2 min-w-0 w-full">
              <div *ngFor="let seg of directionSegments" class="flex items-center justify-between gap-3 text-sm">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="h-2.5 w-2.5 rounded-sm shrink-0" [style.background-color]="seg.color"></span>
                  <span class="text-ink-700 truncate">{{ seg.label }}</span>
                </div>
                <span class="font-bold text-ink-900 shrink-0">{{ seg.value }} ({{ seg.percent }}%)</span>
              </div>
            </div>
          </div>
          <ng-template #emptyDirection>
            <p class="text-sm text-ink-400 italic">Aucune direction n'a soumis de mission sur cette période.</p>
          </ng-template>
        </div>

        <!-- Activité des chauffeurs -->
        <div class="mt-6 mb-6">
          <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
            <app-icon name="user" [size]="16" class="text-ink-400"></app-icon>
            <span>Activité des chauffeurs</span>
          </h3>

          <!-- Top / Least cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="carfo-card p-5 border-l-4 border-l-emerald-500">
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Le plus actif</p>
              <ng-container *ngIf="stats.chauffeurStats?.topChauffeur as top; else noTop">
                <p class="text-lg font-bold text-ink-900">{{ top.prenom }} {{ top.nom }}</p>
                <p class="text-xs text-ink-500 mt-1">{{ top.matricule }}</p>
                <p class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <app-icon name="trending-up" [size]="12"></app-icon>
                  <span>{{ top.missions }} mission(s) en {{ stats.year }}</span>
                </p>
              </ng-container>
              <ng-template #noTop>
                <p class="text-sm text-ink-400 italic">Aucune affectation enregistrée.</p>
              </ng-template>
            </div>

            <div class="carfo-card p-5 border-l-4 border-l-amber-500">
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Le moins actif</p>
              <ng-container *ngIf="stats.chauffeurStats?.leastChauffeur as least; else noLeast">
                <p class="text-lg font-bold text-ink-900">{{ least.prenom }} {{ least.nom }}</p>
                <p class="text-xs text-ink-500 mt-1">{{ least.matricule }}</p>
                <p class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                  <app-icon name="clock" [size]="12"></app-icon>
                  <span>{{ least.missions }} mission(s) en {{ stats.year }}</span>
                </p>
              </ng-container>
              <ng-template #noLeast>
                <p class="text-sm text-ink-400 italic">Aucune affectation enregistrée.</p>
              </ng-template>
            </div>
          </div>

          <!-- Tableau / barres par chauffeur -->
          <div class="carfo-card p-5">
            <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-4">
              Missions par chauffeur ({{ stats.chauffeurStats?.missionsPerChauffeur?.length || 0 }} chauffeur(s) actif(s))
            </p>

            <div *ngIf="(stats.chauffeurStats?.missionsPerChauffeur?.length || 0) > 0; else emptyChauffeurs" class="space-y-3">
              <div *ngFor="let c of stats.chauffeurStats.missionsPerChauffeur">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-semibold text-ink-700 truncate">
                    {{ c.prenom }} {{ c.nom }}
                    <span class="text-ink-400 font-normal">· {{ c.matricule }}</span>
                  </span>
                  <span class="font-bold text-ink-900">{{ c.missions }}</span>
                </div>
                <div class="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                    [style.width.%]="maxChauffeur > 0 ? (c.missions / maxChauffeur) * 100 : 0"
                    [class.opacity-30]="c.missions === 0"
                  ></div>
                </div>
              </div>
            </div>
            <ng-template #emptyChauffeurs>
              <p class="text-sm text-ink-400 italic">Aucun chauffeur actif dans le système.</p>
            </ng-template>
          </div>
        </div>

        <!-- Top 5 lieux les plus visités -->
        <div *ngIf="stats.topLieux && stats.topLieux.length > 0" class="carfo-card p-5 mt-6">
          <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
            <app-icon name="map-pin" [size]="16" class="text-ink-400"></app-icon>
            <span>Top 5 destinations</span>
          </h3>
          <div class="space-y-3">
            <div *ngFor="let l of stats.topLieux">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-semibold text-ink-700 truncate">{{ l.lieu }}</span>
                <span class="font-bold text-ink-900">{{ l.count }} mission(s)</span>
              </div>
              <div class="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                  [style.width.%]="maxLieu > 0 ? (l.count / maxLieu) * 100 : 0"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activité des véhicules -->
        <div *ngIf="stats.vehiculeStats" class="mt-6 mb-6">
          <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
            <app-icon name="car" [size]="16" class="text-ink-400"></app-icon>
            <span>Activité des véhicules</span>
          </h3>

          <!-- Top / Least cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="carfo-card p-5 border-l-4 border-l-emerald-500">
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Le plus utilisé</p>
              <ng-container *ngIf="stats.vehiculeStats.topVehicule as top; else noTopV">
                <p class="text-lg font-bold text-ink-900">{{ top.marque }} {{ top.modele }}</p>
                <p class="text-xs text-ink-500 mt-1 font-mono">{{ top.immatriculation }}</p>
                <p class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <app-icon name="trending-up" [size]="12"></app-icon>
                  <span>{{ top.missions }} mission(s) en {{ stats.year }}</span>
                </p>
              </ng-container>
              <ng-template #noTopV>
                <p class="text-sm text-ink-400 italic">Aucune affectation véhicule enregistrée.</p>
              </ng-template>
            </div>

            <div class="carfo-card p-5 border-l-4 border-l-amber-500">
              <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Le moins utilisé</p>
              <ng-container *ngIf="stats.vehiculeStats.leastVehicule as least; else noLeastV">
                <p class="text-lg font-bold text-ink-900">{{ least.marque }} {{ least.modele }}</p>
                <p class="text-xs text-ink-500 mt-1 font-mono">{{ least.immatriculation }}</p>
                <p class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                  <app-icon name="clock" [size]="12"></app-icon>
                  <span>{{ least.missions }} mission(s) en {{ stats.year }}</span>
                </p>
              </ng-container>
              <ng-template #noLeastV>
                <p class="text-sm text-ink-400 italic">Aucune affectation véhicule enregistrée.</p>
              </ng-template>
            </div>
          </div>

          <!-- Barres par véhicule -->
          <div class="carfo-card p-5">
            <p class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-4">
              Missions par véhicule ({{ stats.vehiculeStats.missionsPerVehicule.length }} véhicule(s) actif(s))
            </p>
            <div *ngIf="stats.vehiculeStats.missionsPerVehicule.length > 0; else emptyVehicules" class="space-y-3">
              <div *ngFor="let v of stats.vehiculeStats.missionsPerVehicule">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-semibold text-ink-700 truncate">
                    {{ v.marque }} {{ v.modele }}
                    <span class="text-ink-400 font-normal font-mono">· {{ v.immatriculation }}</span>
                  </span>
                  <span class="font-bold text-ink-900">{{ v.missions }}</span>
                </div>
                <div class="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-carfo-primary to-carfo-500 transition-all"
                    [style.width.%]="maxVehicule > 0 ? (v.missions / maxVehicule) * 100 : 0"
                    [class.opacity-30]="v.missions === 0"
                  ></div>
                </div>
              </div>
            </div>
            <ng-template #emptyVehicules>
              <p class="text-sm text-ink-400 italic">Aucun véhicule actif dans le système.</p>
            </ng-template>
          </div>
        </div>

        <!-- Note clôturées -->
        <div class="carfo-card p-4 mt-6 border-l-4 border-l-ink-400">
          <div class="flex items-start gap-3">
            <div class="text-ink-500 mt-0.5">
              <app-icon name="clipboard" [size]="16"></app-icon>
            </div>
            <p class="text-xs text-ink-600">
              <strong>{{ stats.missionsClosed }}</strong> mission(s) clôturée(s) en {{ stats.year }}.
            </p>
          </div>
        </div>
      </ng-container>

      <!-- Erreur -->
      <div *ngIf="!isLoading && errorMessage" class="carfo-card p-4 border-l-4 border-l-red-400">
        <div class="flex items-start gap-3">
          <div class="text-red-500 mt-0.5">
            <app-icon name="x-circle" [size]="18"></app-icon>
          </div>
          <p class="text-xs text-ink-700">{{ errorMessage }}</p>
        </div>
      </div>
    </app-shell>
  `,
})
export class StatisticsComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  readonly monthLabels = MONTH_LABELS;

  selectedYear: number = this.currentYear;
  availableYears: number[] = [];

  /** Filtre plage de dates (ISO yyyy-MM-dd). Vide = filtre par année. */
  dateFrom = '';
  dateTo = '';

  stats: StatisticsPayload | null = null;
  isLoading = false;
  errorMessage = '';

  /** État des téléchargements (PDF / CSV). */
  isExportingPdf = false;
  isExportingCsv = false;
  exportError = '';

  constructor(private readonly statisticsService: StatisticsService) {
    this.availableYears = [0, 1, 2, 3, 4].map((offset) => this.currentYear - offset);
  }

  ngOnInit(): void {
    this.load();
  }

  onYearChange(): void {
    // Sélection d'une année → on vide la plage de dates et on filtre par année
    this.dateFrom = '';
    this.dateTo = '';
    this.load();
  }

  applyDateRange(): void {
    if (!this.dateFrom && !this.dateTo) return;
    this.load();
  }

  clearDateRange(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.load();
  }

  /** Segments du camembert des directions (calculés depuis missionsByDirection). */
  get directionSegments(): DonutSegment[] {
    const rows = this.stats?.missionsByDirection ?? [];
    const total = rows.reduce((s, d) => s + d.count, 0);
    return this.buildDonut(
      rows.map((d, i) => ({ label: d.direction, value: d.count, color: PIE_PALETTE[i % PIE_PALETTE.length] })),
      total
    );
  }

  /** Segments du camembert des statuts. */
  get statusSegments(): DonutSegment[] {
    const byStatus = this.stats?.missionsByStatus;
    if (!byStatus) return [];
    const order = ['PREVUE', 'AVIS_SG_FAVORABLE', 'AVIS_SG_DEFAVORABLE', 'INITIEE', 'CLOTUREE', 'ANNULEE'];
    const entries = order
      .filter((k) => (byStatus[k] ?? 0) > 0)
      .map((k) => ({ label: STATUS_LABEL[k]?.label ?? k, value: byStatus[k], color: STATUS_LABEL[k]?.hex ?? '#64748B' }));
    const total = entries.reduce((s, e) => s + e.value, 0);
    return this.buildDonut(entries, total);
  }

  /**
   * Calcule les segments d'un donut SVG (r=46 → circonférence ≈ 289).
   * Chaque segment : dashArray = "longueur reste", dashOffset positionne le départ.
   */
  private buildDonut(items: { label: string; value: number; color: string }[], total: number): DonutSegment[] {
    const C = 2 * Math.PI * 46; // circonférence
    let cumul = 0;
    if (total <= 0) return [];
    return items.filter((i) => i.value > 0).map((i) => {
      const frac = i.value / total;
      const len = frac * C;
      const seg: DonutSegment = {
        label: i.label,
        value: i.value,
        percent: Math.round(frac * 100),
        color: i.color,
        dashArray: `${len} ${C - len}`,
        dashOffset: -cumul,
      };
      cumul += len;
      return seg;
    });
  }

  get maxMonth(): number {
    if (!this.stats?.missionsByMonth?.length) return 0;
    return Math.max(...this.stats.missionsByMonth, 0);
  }

  get maxDirection(): number {
    if (!this.stats?.missionsByDirection?.length) return 1;
    return Math.max(...this.stats.missionsByDirection.map((d) => d.count), 1);
  }

  get maxChauffeur(): number {
    const list = this.stats?.chauffeurStats?.missionsPerChauffeur;
    if (!list?.length) return 1;
    return Math.max(...list.map((c) => c.missions), 1);
  }

  get maxVehicule(): number {
    const list = this.stats?.vehiculeStats?.missionsPerVehicule;
    if (!list?.length) return 1;
    return Math.max(...list.map((v) => v.missions), 1);
  }

  get maxLieu(): number {
    const list = this.stats?.topLieux;
    if (!list?.length) return 1;
    return Math.max(...list.map((l) => l.count), 1);
  }

  /**
   * Calcule le delta en % entre l'année courante et l'année N-1.
   * Retourne le libellé formaté (ex: "+12 %", "−5 %", "= 0 %").
   */
  deltaLabel(current: number, previous: number): string {
    if (previous === 0 && current === 0) return '= 0 %';
    if (previous === 0) return `+${current}`;
    const delta = ((current - previous) / previous) * 100;
    let sign = '=';
    if (delta > 0) sign = '+';
    else if (delta < 0) sign = '−';
    return `${sign} ${Math.abs(delta).toFixed(0)} %`;
  }

  /**
   * Couleur du delta : vert si en hausse (bon), rouge si en baisse (mauvais).
   * `inverse=true` pour les métriques où la baisse est positive (ex: annulations).
   */
  deltaColor(current: number, previous: number, inverse = false): string {
    if (current === previous) return 'text-ink-500';
    const isUp = current > previous;
    const isGood = inverse ? !isUp : isUp;
    return isGood ? 'text-emerald-600' : 'text-red-600';
  }

  get statusEntries(): { key: string; label: string; color: string; value: number }[] {
    const byStatus = this.stats?.missionsByStatus;
    if (!byStatus) return [];
    const order = ['PREVUE', 'AVIS_SG_FAVORABLE', 'AVIS_SG_DEFAVORABLE', 'INITIEE', 'CLOTUREE', 'ANNULEE'];
    return order
      .filter((k) => k in byStatus)
      .map((k) => ({
        key: k,
        label: STATUS_LABEL[k]?.label ?? k,
        color: STATUS_LABEL[k]?.color ?? 'bg-ink-400',
        value: byStatus[k] ?? 0,
      }));
  }

  downloadPdf(): void {
    if (this.isExportingPdf) return;
    this.isExportingPdf = true;
    this.exportError = '';
    this.statisticsService.downloadPdf(this.selectedYear).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `rapport-statistiques-${this.selectedYear}.pdf`);
        this.isExportingPdf = false;
      },
      error: (err: unknown) => {
        console.error('PDF export error:', err);
        this.exportError = 'Échec du téléchargement PDF. Réessayez.';
        this.isExportingPdf = false;
      },
    });
  }

  downloadCsv(): void {
    if (this.isExportingCsv) return;
    this.isExportingCsv = true;
    this.exportError = '';
    this.statisticsService.downloadCsv(this.selectedYear).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `statistiques-${this.selectedYear}.csv`);
        this.isExportingCsv = false;
      },
      error: (err: unknown) => {
        console.error('CSV export error:', err);
        this.exportError = 'Échec du téléchargement CSV. Réessayez.';
        this.isExportingCsv = false;
      },
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  pct(value: number): string {
    const total = this.stats?.totalMissions ?? 0;
    if (!total) return '0';
    return ((value / total) * 100).toFixed(0);
  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.statisticsService
      .getStatistics(this.selectedYear, this.dateFrom || undefined, this.dateTo || undefined)
      .pipe(
        timeout(8000),
        catchError((err: unknown) => {
          console.error('[Statistics] load error:', err);
          this.errorMessage = 'Le chargement des statistiques a échoué. Vérifiez votre connexion.';
          return of(null);
        })
      )
      .subscribe((data) => {
        this.stats = data;
        this.isLoading = false;
      });
  }
}
