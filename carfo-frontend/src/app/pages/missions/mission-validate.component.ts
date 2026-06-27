import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { timeout, catchError, of } from 'rxjs';
import { MissionService, Mission } from '../../core/services/mission.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { StatusBadgeComponent } from '../../core/components/status-badge.component';
import { IconComponent } from '../../core/components/icon.component';

@Component({
  selector: 'app-mission-validate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppShellComponent,
    StatusBadgeComponent,
    IconComponent,
  ],
  template: `
    <app-shell>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <a [routerLink]="['/missions/validation']" class="inline-flex items-center gap-1 hover:text-carfo-primary">
          <app-icon name="arrow-left" [size]="14"></app-icon>
          <span>Retour aux validations</span>
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="carfo-card p-8 space-y-4">
        <div class="skeleton h-8 w-2/3"></div>
        <div class="skeleton h-4 w-1/3"></div>
        <div class="grid grid-cols-2 gap-4 mt-6">
          <div class="skeleton h-20"></div>
          <div class="skeleton h-20"></div>
          <div class="skeleton h-20"></div>
          <div class="skeleton h-20"></div>
        </div>
      </div>

      <!-- Not found -->
      <div *ngIf="!isLoading && !mission" class="carfo-card p-12 text-center">
        <div class="h-14 w-14 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <app-icon name="x-circle" [size]="28"></app-icon>
        </div>
        <h3 class="text-lg font-bold text-ink-900 mb-1">Mission introuvable</h3>
        <p class="text-sm text-ink-500 mb-6">La mission demandée n'existe pas ou a été supprimée.</p>
        <a [routerLink]="['/missions/validation']" class="btn btn-primary">
          Retour à la liste
        </a>
      </div>

      <!-- Mission detail -->
      <div *ngIf="!isLoading && mission" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Header card -->
          <div class="carfo-card p-6">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">Mission {{ mission.reference || '#' + mission.idMission }}</p>
                <h2 class="text-2xl font-bold text-ink-900 leading-tight">{{ mission.objetMission }}</h2>
              </div>
              <app-status-badge [status]="mission.statut"></app-status-badge>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-ink-100">
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="map-pin" [size]="11"></app-icon><span>Lieu</span>
                </p>
                <p class="text-sm font-semibold text-ink-800 mt-1">{{ mission.lieu }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="building" [size]="11"></app-icon><span>Direction</span>
                </p>
                <p class="text-sm font-semibold text-ink-800 mt-1 truncate">{{ mission.nomDirection || '—' }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="calendar" [size]="11"></app-icon><span>Période</span>
                </p>
                <p class="text-sm font-semibold text-ink-800 mt-1">{{ mission.dateDebut | date: 'dd MMM yy' }} → {{ mission.dateFin | date: 'dd MMM yy' }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="clock" [size]="11"></app-icon><span>Durée</span>
                </p>
                <p class="text-sm font-semibold text-ink-800 mt-1">{{ duration }} jours</p>
              </div>
            </div>

            <div *ngIf="mission.dateSoumission" class="mt-4 pt-4 border-t border-ink-100 text-xs text-ink-500">
              Soumise le {{ mission.dateSoumission | date: 'dd MMMM yyyy à HH:mm' }}
            </div>
          </div>

          <!-- Participants -->
          <div class="carfo-card p-6">
            <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
              <app-icon name="users" [size]="16" class="text-ink-400"></app-icon>
              <span>Participants ({{ mission.participants?.length || 0 }})</span>
            </h3>
            <ul *ngIf="mission.participants && mission.participants.length > 0" class="divide-y divide-ink-100">
              <li
                *ngFor="let p of mission.participants"
                class="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
              >
                <div class="h-9 w-9 rounded-full bg-carfo-50 text-carfo-primary flex items-center justify-center text-xs font-bold">
                  {{ initials(p.nom, p.prenom) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-ink-900 truncate">{{ p.nom }} {{ p.prenom }}</p>
                  <p class="text-xs text-ink-500">{{ p.matricule }} · {{ p.roleMission || 'MEMBRE' }}</p>
                </div>
              </li>
            </ul>
            <p *ngIf="!mission.participants || mission.participants.length === 0" class="text-sm text-ink-400 italic">
              Aucun participant déclaré pour cette mission.
            </p>
          </div>

          <!-- Affectations actives -->
          <div class="carfo-card p-6" *ngIf="activeAffectations.length > 0">
            <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
              <app-icon name="route" [size]="16" class="text-ink-400"></app-icon>
              <span>Affectations ({{ activeAffectations.length }})</span>
            </h3>
            <ul class="divide-y divide-ink-100">
              <li *ngFor="let a of activeAffectations" class="py-3 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex items-start gap-3">
                  <div class="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <app-icon name="user" [size]="18"></app-icon>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Chauffeur</p>
                    <p class="text-sm font-semibold text-ink-800">{{ a.nomChauffeur }} {{ a.prenomChauffeur }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="h-10 w-10 rounded-lg bg-carfo-50 text-carfo-primary flex items-center justify-center shrink-0">
                    <app-icon name="car" [size]="18"></app-icon>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Véhicule</p>
                    <p class="text-sm font-semibold text-ink-800 truncate">{{ a.marqueVehicule }} {{ a.modeleVehicule }}</p>
                    <p class="text-xs text-ink-500">{{ a.immatriculationVehicule }}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Chef de mission -->
          <div class="carfo-card p-4 border-l-4 border-l-carfo-primary" *ngIf="mission.chefMission">
            <div class="flex items-center gap-3">
              <div class="text-carfo-primary">
                <app-icon name="flag" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Chef de mission</p>
                <p class="text-sm font-bold text-ink-900">{{ mission.chefMission.prenom }} {{ mission.chefMission.nom }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Side panel : action selon statut + rôle -->
        <div class="space-y-4">
          <!-- Action card : SG donne un avis (statut PREVUE) -->
          <div *ngIf="canGiveOpinion" class="carfo-card p-6">
            <h3 class="text-sm font-bold text-ink-900 mb-2">Avis du Secrétariat Général</h3>
            <p class="text-xs text-ink-500 mb-4">
              Évaluez la pertinence de cette mission. Votre avis favorable permettra au DMG d'affecter
              les ressources et au Directeur Général de valider définitivement.
            </p>

            <label class="label">Avis</label>
            <div class="flex items-center gap-2 mb-3">
              <label class="flex items-center gap-2 flex-1 px-3 py-2 rounded-md border cursor-pointer transition"
                [ngClass]="opinionFavorable ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-ink-200 hover:border-ink-300'">
                <input type="radio" name="opinion" [value]="true" [(ngModel)]="opinionFavorable" class="text-emerald-500" />
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span class="text-xs font-semibold">Favorable</span>
              </label>
              <label class="flex items-center gap-2 flex-1 px-3 py-2 rounded-md border cursor-pointer transition"
                [ngClass]="opinionFavorable === false ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-ink-200 hover:border-ink-300'">
                <input type="radio" name="opinion" [value]="false" [(ngModel)]="opinionFavorable" class="text-rose-500" />
                <app-icon name="x-circle" [size]="14"></app-icon>
                <span class="text-xs font-semibold">Défavorable</span>
              </label>
            </div>

            <label class="label">Motif <span class="text-ink-400 font-normal">(optionnel)</span></label>
            <textarea
              [(ngModel)]="opinionMotif"
              rows="3"
              class="input"
              placeholder="Précisez votre motivation (recommandé en cas d'avis défavorable)…"
            ></textarea>

            <button
              (click)="onSubmitOpinion()"
              [disabled]="isSubmitting || opinionFavorable === null"
              class="btn btn-primary w-full mt-4"
            >
              <app-icon [name]="isSubmitting ? 'refresh' : 'check-circle'" [size]="16" [class.animate-spin]="isSubmitting"></app-icon>
              <span>{{ isSubmitting ? 'Envoi…' : 'Transmettre mon avis' }}</span>
            </button>

            <button (click)="goBack()" class="btn btn-secondary w-full mt-2">
              <app-icon name="arrow-left" [size]="16"></app-icon>
              <span>Retour</span>
            </button>
          </div>

          <!-- Action card : DG valide après avis favorable -->
          <div *ngIf="canValidateAsDg" class="carfo-card p-6">
            <h3 class="text-sm font-bold text-ink-900 mb-2">Validation finale (DG)</h3>
            <p class="text-xs text-ink-500 mb-4">
              Cette mission a reçu un avis favorable du SG. En la validant, vous l'élevez au statut
              <strong>INITIEE</strong> : elle deviendra officielle et restera affectable par le DMG.
            </p>

            <button
              (click)="onValidate()"
              [disabled]="isSubmitting"
              class="btn btn-primary w-full mb-2"
            >
              <app-icon [name]="isSubmitting ? 'refresh' : 'check-circle'" [size]="16" [class.animate-spin]="isSubmitting"></app-icon>
              <span>{{ isSubmitting ? 'Validation…' : 'Valider la mission' }}</span>
            </button>

            <button (click)="goBack()" class="btn btn-secondary w-full">
              <app-icon name="arrow-left" [size]="16"></app-icon>
              <span>Retour</span>
            </button>
          </div>

          <!-- Aucune action disponible -->
          <div *ngIf="!canGiveOpinion && !canValidateAsDg" class="carfo-card p-6">
            <h3 class="text-sm font-bold text-ink-900 mb-2">Aucune action disponible</h3>
            <p class="text-xs text-ink-500 mb-4">
              <ng-container *ngIf="mission.statut === 'PREVUE'">
                En attente de l'avis du Secrétariat Général.
              </ng-container>
              <ng-container *ngIf="mission.statut === 'AVIS_SG_FAVORABLE'">
                Avis SG favorable reçu. En attente de la validation du Directeur Général.
              </ng-container>
              <ng-container *ngIf="mission.statut === 'AVIS_SG_DEFAVORABLE'">
                Cette mission a reçu un avis défavorable. Workflow stoppé.
              </ng-container>
              <ng-container *ngIf="mission.statut === 'INITIEE'">
                Mission déjà validée.
              </ng-container>
              <ng-container *ngIf="mission.statut === 'CLOTUREE' || mission.statut === 'ANNULEE'">
                Mission terminée.
              </ng-container>
            </p>
            <button (click)="goBack()" class="btn btn-secondary w-full">
              <app-icon name="arrow-left" [size]="16"></app-icon>
              <span>Retour</span>
            </button>
          </div>

          <!-- Affichage motif avis défavorable (info) -->
          <div *ngIf="mission.statut === 'AVIS_SG_DEFAVORABLE' && mission.motifAvisSg"
               class="carfo-card p-4 border-l-4 border-l-rose-400">
            <div class="flex items-start gap-3">
              <div class="text-rose-500 mt-0.5">
                <app-icon name="alert" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Motif du SG</p>
                <p class="text-xs text-ink-600 mt-1">{{ mission.motifAvisSg }}</p>
              </div>
            </div>
          </div>

          <!-- Warning -->
          <div *ngIf="canGiveOpinion || canValidateAsDg" class="carfo-card p-4 border-l-4 border-l-amber-400">
            <div class="flex items-start gap-3">
              <div class="text-amber-500 mt-0.5">
                <app-icon name="alert" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Action irréversible</p>
                <p class="text-xs text-ink-600 mt-1">
                  Cette action est définitive et notifie les acteurs concernés.
                </p>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="errorMessage" class="carfo-card p-4 border-l-4 border-l-red-400">
            <div class="flex items-start gap-3">
              <div class="text-red-500 mt-0.5">
                <app-icon name="x-circle" [size]="18"></app-icon>
              </div>
              <p class="text-xs text-ink-700">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Success -->
          <div *ngIf="successMessage" class="carfo-card p-4 border-l-4 border-l-carfo-primary">
            <div class="flex items-start gap-3">
              <div class="text-carfo-primary mt-0.5">
                <app-icon name="check-circle" [size]="18"></app-icon>
              </div>
              <p class="text-xs text-ink-700">{{ successMessage }}</p>
            </div>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class MissionValidateComponent implements OnInit {
  mission: Mission | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // État du formulaire d'avis SG
  opinionFavorable: boolean | null = null;
  opinionMotif = '';

  get activeAffectations() {
    return (this.mission?.affectations ?? []).filter((a) => a.statut === 'ACTIVE' || !a.statut);
  }

  constructor(
    private readonly missionService: MissionService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  /** Le SG (ou un administrateur) peut donner un avis sur une mission PREVUE. */
  get canGiveOpinion(): boolean {
    return this.mission?.statut === 'PREVUE'
        && this.authService.hasAnyRole(['SECRETAIRE_GENERALE', 'ADMINISTRATEUR']);
  }

  /** Le DG (ou un administrateur) peut valider une mission AVIS_SG_FAVORABLE. */
  get canValidateAsDg(): boolean {
    return this.mission?.statut === 'AVIS_SG_FAVORABLE'
        && this.authService.hasAnyRole(['DIRECTEUR', 'ADMINISTRATEUR']);
  }

  ngOnInit(): void {
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

  initials(nom: string, prenom: string): string {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  }

  private loadMission(id: number): void {
    console.debug('[MissionValidate] Loading mission', id);
    this.isLoading = true;
    this.errorMessage = '';

    this.missionService
      .getMissionById(id)
      .pipe(
        timeout(8000),
        catchError((err: unknown) => {
          console.error('[MissionValidate] Load error or timeout:', err);
          this.errorMessage = "Le chargement de la mission a échoué (timeout ou erreur réseau).";
          return of(null);
        })
      )
      .subscribe((data) => {
        console.debug('[MissionValidate] Mission loaded:', data);
        this.mission = data;
        this.isLoading = false;
      });
  }

  onValidate(): void {
    if (!this.mission || !this.mission.idMission || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const id = this.mission.idMission;
    this.missionService.validateMission(id).subscribe({
      next: (updated) => {
        this.mission = updated;
        this.isSubmitting = false;
        this.successMessage = 'Mission validée avec succès. Redirection…';
        setTimeout(() => this.router.navigate(['/missions/validation']), 1200);
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Validate error:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la validation. Réessayez.';
        this.isSubmitting = false;
      },
    });
  }

  onSubmitOpinion(): void {
    if (!this.mission || !this.mission.idMission || this.isSubmitting) return;
    if (this.opinionFavorable === null) {
      this.errorMessage = 'Choisissez un avis (favorable ou défavorable).';
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const id = this.mission.idMission;
    const motif = this.opinionMotif?.trim() || undefined;

    this.missionService.donnerAvisSG(id, this.opinionFavorable, motif).subscribe({
      next: (updated) => {
        this.mission = updated;
        this.isSubmitting = false;
        this.successMessage = this.opinionFavorable
          ? 'Avis favorable transmis. Le DMG et le DG sont notifiés.'
          : 'Avis défavorable transmis. Mission bloquée.';
        setTimeout(() => this.router.navigate(['/missions/validation']), 1500);
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Opinion error:', err);
        this.errorMessage = err.error?.message || "Erreur lors de l'envoi de l'avis. Réessayez.";
        this.isSubmitting = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/missions/validation']);
  }
}
