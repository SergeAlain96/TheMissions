import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { MissionService, Mission } from '../../core/services/mission.service';
import { AgentService, Agent } from '../../core/services/agent.service';
import { VehiculeService, Vehicule } from '../../core/services/vehicule.service';
import { AffectationService } from '../../core/services/affectation.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { StatusBadgeComponent } from '../../core/components/status-badge.component';
import { IconComponent } from '../../core/components/icon.component';

@Component({
  selector: 'app-mission-affectation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AppShellComponent,
    StatusBadgeComponent,
    IconComponent,
  ],
  template: `
    <app-shell>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <a [routerLink]="['/missions/affecter']" class="inline-flex items-center gap-1 hover:text-carfo-primary">
          <app-icon name="arrow-left" [size]="14"></app-icon>
          <span>Retour aux affectations</span>
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="carfo-card p-8 space-y-4">
        <div class="skeleton h-8 w-2/3"></div>
        <div class="skeleton h-4 w-1/3"></div>
        <div class="skeleton h-10 w-full mt-6"></div>
        <div class="skeleton h-10 w-full"></div>
      </div>

      <!-- Mission not found -->
      <div *ngIf="!isLoading && !mission" class="carfo-card p-12 text-center">
        <div class="h-14 w-14 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <app-icon name="x-circle" [size]="28"></app-icon>
        </div>
        <h3 class="text-lg font-bold text-ink-900 mb-1">Mission introuvable</h3>
        <p class="text-sm text-ink-500 mb-6">Impossible de charger la mission demandée.</p>
        <a [routerLink]="['/missions/affecter']" class="btn btn-primary">Retour</a>
      </div>

      <!-- Form -->
      <div *ngIf="!isLoading && mission" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Form column -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Mission header -->
          <div class="carfo-card p-6">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">Mission {{ mission.reference || '#' + mission.idMission }}</p>
                <h2 class="text-xl font-bold text-ink-900 leading-tight">{{ mission.objetMission }}</h2>
              </div>
              <app-status-badge [status]="mission.statut"></app-status-badge>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-ink-100 text-sm">
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Lieu</p>
                <p class="font-semibold text-ink-800 mt-1">{{ mission.lieu }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Direction</p>
                <p class="font-semibold text-ink-800 mt-1 truncate">{{ mission.nomDirection || '—' }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Période</p>
                <p class="font-semibold text-ink-800 mt-1">{{ mission.dateDebut | date: 'dd MMM' }} → {{ mission.dateFin | date: 'dd MMM' }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Durée</p>
                <p class="font-semibold text-ink-800 mt-1">{{ duration }} jours</p>
              </div>
            </div>
          </div>

          <!-- Form card -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="carfo-card p-6 space-y-5">
            <h3 class="text-sm font-bold text-ink-900 inline-flex items-center gap-2">
              <app-icon name="route" [size]="16" class="text-ink-400"></app-icon>
              <span>Sélection des ressources</span>
            </h3>

            <!-- Loading resources state -->
            <div *ngIf="resourcesLoading" class="space-y-3">
              <div class="skeleton h-10 w-full"></div>
              <div class="skeleton h-10 w-full"></div>
            </div>

            <ng-container *ngIf="!resourcesLoading">
              <!-- Chauffeur -->
              <div>
                <label class="label inline-flex items-center gap-2">
                  <app-icon name="user" [size]="14" class="text-ink-400"></app-icon>
                  <span>Chauffeur disponible</span>
                </label>
                <select
                  formControlName="idChauffeur"
                  class="input"
                >
                  <option value="">— Choisir un chauffeur —</option>
                  <option *ngFor="let agent of availableAgents" [value]="agent.idAgent">
                    {{ agent.prenom }} {{ agent.nom }} <span *ngIf="agent.matricule">({{ agent.matricule }})</span>
                  </option>
                </select>
                <p
                  *ngIf="form.get('idChauffeur')?.hasError('required') && form.get('idChauffeur')?.touched"
                  class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1"
                >
                  <app-icon name="alert" [size]="12"></app-icon>
                  <span>Chauffeur requis</span>
                </p>
                <p *ngIf="availableAgents.length === 0" class="text-xs text-amber-600 mt-1.5 inline-flex items-center gap-1">
                  <app-icon name="alert" [size]="12"></app-icon>
                  <span>Aucun chauffeur disponible sur cette période.</span>
                </p>
              </div>

              <!-- Véhicule -->
              <div>
                <label class="label inline-flex items-center gap-2">
                  <app-icon name="car" [size]="14" class="text-ink-400"></app-icon>
                  <span>Véhicule disponible</span>
                </label>
                <select
                  formControlName="idVehicule"
                  class="input"
                >
                  <option value="">— Choisir un véhicule —</option>
                  <option *ngFor="let vehicle of availableVehicles" [value]="vehicle.idVehicule">
                    {{ vehicle.marque }} {{ vehicle.modele }} <span *ngIf="vehicle.immatriculation">({{ vehicle.immatriculation }})</span>
                  </option>
                </select>
                <p
                  *ngIf="form.get('idVehicule')?.hasError('required') && form.get('idVehicule')?.touched"
                  class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1"
                >
                  <app-icon name="alert" [size]="12"></app-icon>
                  <span>Véhicule requis</span>
                </p>
                <p *ngIf="availableVehicles.length === 0" class="text-xs text-amber-600 mt-1.5 inline-flex items-center gap-1">
                  <app-icon name="alert" [size]="12"></app-icon>
                  <span>Aucun véhicule disponible sur cette période.</span>
                </p>
              </div>
            </ng-container>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 pt-4 border-t border-ink-100">
              <button
                type="submit"
                [disabled]="isSubmitting || form.invalid || resourcesLoading"
                class="btn btn-primary flex-1"
              >
                <app-icon [name]="isSubmitting ? 'refresh' : 'check-circle'" [size]="16" [class.animate-spin]="isSubmitting"></app-icon>
                <span>{{ isSubmitting ? 'Affectation…' : "Confirmer l'affectation" }}</span>
              </button>
              <button
                type="button"
                (click)="goBack()"
                class="btn btn-secondary"
              >
                <span>Annuler</span>
              </button>
            </div>

            <!-- Messages -->
            <div *ngIf="errorMessage" class="carfo-card p-4 border-l-4 border-l-red-400">
              <div class="flex items-start gap-3">
                <div class="text-red-500 mt-0.5">
                  <app-icon name="x-circle" [size]="18"></app-icon>
                </div>
                <p class="text-xs text-ink-700">{{ errorMessage }}</p>
              </div>
            </div>

            <div *ngIf="successMessage" class="carfo-card p-4 border-l-4 border-l-carfo-primary">
              <div class="flex items-start gap-3">
                <div class="text-carfo-primary mt-0.5">
                  <app-icon name="check-circle" [size]="18"></app-icon>
                </div>
                <p class="text-xs text-ink-700">{{ successMessage }}</p>
              </div>
            </div>
          </form>
        </div>

        <!-- Side info -->
        <div class="space-y-4">
          <div class="carfo-card p-4 border-l-4 border-l-blue-400">
            <div class="flex items-start gap-3">
              <div class="text-blue-500 mt-0.5">
                <app-icon name="shield-check" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Disponibilité vérifiée</p>
                <p class="text-xs text-ink-600 mt-1">
                  Seuls les chauffeurs sans absence approuvée et les véhicules non engagés sur la période sont proposés.
                </p>
              </div>
            </div>
          </div>

          <div class="carfo-card p-4 border-l-4 border-l-amber-400">
            <div class="flex items-start gap-3">
              <div class="text-amber-500 mt-0.5">
                <app-icon name="alert" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Affectations multiples possibles</p>
                <p class="text-xs text-ink-600 mt-1">
                  Une mission peut recevoir plusieurs chauffeurs + véhicules (convoi). Chaque affectation
                  ajoutée s'ajoute aux précédentes ; annulez-en une depuis le détail de la mission pour libérer la ressource.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class MissionAffectationFormComponent implements OnInit {
  mission: Mission | null = null;
  form: FormGroup;
  availableAgents: Agent[] = [];
  availableVehicles: Vehicule[] = [];

  isLoading = false;
  resourcesLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly missionService: MissionService,
    private readonly agentService: AgentService,
    private readonly vehiculeService: VehiculeService,
    private readonly affectationService: AffectationService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.group({
      idChauffeur: ['', Validators.required],
      idVehicule:  ['', Validators.required],
    });
  }

  /** Seuls le DMG et l'admin peuvent affecter des ressources. Les autres rôles sont redirigés. */
  private get canAffect(): boolean {
    const user = this.authService.getUser();
    if (!user) return false;
    if (user.role === 'ADMINISTRATEUR') return true;
    if (user.role !== 'DIRECTEUR_DIRECTION') return false;
    const dir = (user.nomDirection || '').toLowerCase();
    return dir.includes('moyens') || dir.includes('général');
  }

  ngOnInit(): void {
    // Garde côté UI : redirige vers la liste si l'utilisateur n'est pas autorisé
    // (le backend rejette aussi via @PreAuthorize, c'est une double protection).
    if (!this.canAffect) {
      this.router.navigate(['/missions/affecter']);
      return;
    }
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (Number.isFinite(id) && id > 0) {
        this.loadMission(id);
      }
    });
  }

  get duration(): number {
    if (!this.mission?.dateDebut || !this.mission?.dateFin) return 0;
    const start = new Date(this.mission.dateDebut).getTime();
    const end = new Date(this.mission.dateFin).getTime();
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }

  goBack(): void {
    this.router.navigate(['/missions/affecter']);
  }

  onSubmit(): void {
    if (!this.form.valid || !this.mission || !this.mission.idMission) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      idMission: this.mission.idMission,
      idChauffeur: Number.parseInt(this.form.get('idChauffeur')?.value, 10),
      idVehicule:  Number.parseInt(this.form.get('idVehicule')?.value, 10),
    };

    this.affectationService.createAffectation(request).subscribe({
      next: () => {
        this.successMessage = 'Affectation créée. Redirection…';
        setTimeout(() => this.router.navigate(['/missions/affecter']), 1200);
      },
      error: (err: { error?: { message?: string }; status?: number }) => {
        console.error('Affectation error:', err);
        this.errorMessage = err.error?.message
          || (err.status === 409
            ? 'Cette ressource est déjà affectée sur cette période.'
            : 'Erreur lors de la création de l\'affectation.');
        this.isSubmitting = false;
      },
    });
  }

  private loadMission(id: number): void {
    console.debug('[Affectation] Loading mission', id);
    this.isLoading = true;
    this.errorMessage = '';

    this.missionService
      .getMissionById(id)
      .pipe(
        timeout(8000),
        catchError((err: unknown) => {
          console.error('[Affectation] Mission load error/timeout:', err);
          this.errorMessage = "Le chargement de la mission a échoué (timeout ou erreur réseau).";
          return of(null);
        })
      )
      .subscribe((data) => {
        console.debug('[Affectation] Mission loaded:', data);
        this.mission = data;
        this.isLoading = false;
        if (data) this.loadResources();
      });
  }

  private loadResources(): void {
    if (!this.mission) return;
    console.debug('[Affectation] Loading resources for period', this.mission.dateDebut, '->', this.mission.dateFin);
    this.resourcesLoading = true;

    forkJoin({
      agents: this.agentService.getAvailableAgents(this.mission.dateDebut, this.mission.dateFin),
      vehicles: this.vehiculeService.getAvailableVehicles(this.mission.dateDebut, this.mission.dateFin),
    })
      .pipe(
        timeout(8000),
        catchError((err: unknown) => {
          console.error('[Affectation] Resources load error/timeout:', err);
          return of({ agents: [], vehicles: [] });
        })
      )
      .subscribe(({ agents, vehicles }) => {
        console.debug('[Affectation] Resources loaded:', { agents: agents?.length, vehicles: vehicles?.length });
        this.availableAgents = agents || [];
        this.availableVehicles = vehicles || [];
        this.resourcesLoading = false;
      });
  }
}
