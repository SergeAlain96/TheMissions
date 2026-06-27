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
  selector: 'app-mission-detail',
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
        <a [routerLink]="['/missions']" class="inline-flex items-center gap-1 hover:text-carfo-primary">
          <app-icon name="arrow-left" [size]="14"></app-icon>
          <span>Retour aux missions</span>
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
        <p class="text-sm text-ink-500 mb-6">{{ errorMessage || "Cette mission n'existe pas ou a été supprimée." }}</p>
        <a [routerLink]="['/missions']" class="btn btn-primary">Retour à la liste</a>
      </div>

      <!-- Mission detail -->
      <div *ngIf="!isLoading && mission" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Header card -->
          <div class="carfo-card overflow-hidden">
            <!-- Top banner CARFO style -->
            <div class="bg-carfo-primary px-6 py-5 text-white">
              <p class="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">FICHE DE DEMANDE DE MISSION · {{ mission.reference || ('MIS-' + (mission.idMission || '?')) }}</p>
              <h2 class="text-2xl font-bold leading-tight">{{ mission.objetMission }}</h2>
              <div class="mt-3 flex items-center gap-3 flex-wrap">
                <app-status-badge [status]="mission.statut"></app-status-badge>
                <span class="text-xs text-white/80 inline-flex items-center gap-1">
                  <app-icon name="building" [size]="12"></app-icon>
                  <span>{{ mission.nomDirection || '—' }}</span>
                </span>
              </div>
            </div>

            <!-- Quick info grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-ink-100">
              <div class="p-5">
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="map-pin" [size]="11"></app-icon><span>Lieu</span>
                </p>
                <p class="text-sm font-bold text-ink-900 mt-1">{{ mission.lieu }}</p>
              </div>
              <div class="p-5">
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="calendar" [size]="11"></app-icon><span>Début</span>
                </p>
                <p class="text-sm font-bold text-ink-900 mt-1">{{ mission.dateDebut | date: 'dd MMM yy' }}</p>
              </div>
              <div class="p-5">
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="calendar" [size]="11"></app-icon><span>Fin</span>
                </p>
                <p class="text-sm font-bold text-ink-900 mt-1">{{ mission.dateFin | date: 'dd MMM yy' }}</p>
              </div>
              <div class="p-5">
                <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold inline-flex items-center gap-1">
                  <app-icon name="clock" [size]="11"></app-icon><span>Durée</span>
                </p>
                <p class="text-sm font-bold text-ink-900 mt-1">{{ duration }} jours</p>
              </div>
            </div>

            <div *ngIf="mission.dateSoumission" class="px-6 py-3 bg-ink-50 border-t border-ink-100 text-xs text-ink-500">
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
                *ngFor="let p of mission.participants; let i = index"
                class="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
              >
                <div class="h-9 w-9 rounded-full bg-carfo-50 text-carfo-primary flex items-center justify-center text-xs font-bold">
                  {{ initials(p.nom, p.prenom) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-ink-900 truncate">{{ p.prenom }} {{ p.nom }}</p>
                  <p class="text-xs text-ink-500">{{ p.matricule }}</p>
                </div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-ink-700">
                  {{ p.roleMission || 'MEMBRE' }}
                </span>
              </li>
            </ul>
            <p *ngIf="!mission.participants || mission.participants.length === 0" class="text-sm text-ink-400 italic">
              Aucun participant déclaré pour cette mission.
            </p>
          </div>

          <!-- Chef de mission -->
          <div *ngIf="mission.chefMission" class="carfo-card p-6 border-l-4 border-l-carfo-primary">
            <h3 class="text-sm font-bold text-ink-900 mb-3 inline-flex items-center gap-2">
              <app-icon name="flag" [size]="16" class="text-ink-400"></app-icon>
              <span>Chef de mission</span>
            </h3>
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-carfo-50 text-carfo-primary flex items-center justify-center text-xs font-bold">
                {{ (mission.chefMission.prenom?.[0] || '') + (mission.chefMission.nom?.[0] || '') }}
              </div>
              <div>
                <p class="text-sm font-bold text-ink-900">{{ mission.chefMission.prenom }} {{ mission.chefMission.nom }}</p>
                <p class="text-xs text-ink-500 font-mono">{{ mission.chefMission.matricule }}</p>
              </div>
            </div>
          </div>

          <!-- Affectations actives -->
          <div *ngIf="activeAffectations.length > 0; else affectationEmpty" class="carfo-card p-6">
            <h3 class="text-sm font-bold text-ink-900 mb-4 inline-flex items-center gap-2">
              <app-icon name="route" [size]="16" class="text-ink-400"></app-icon>
              <span>Affectations actives ({{ activeAffectations.length }})</span>
            </h3>
            <ul class="divide-y divide-ink-100">
              <li *ngFor="let a of activeAffectations" class="py-3 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex items-start gap-3">
                  <div class="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <app-icon name="user" [size]="18"></app-icon>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Chauffeur</p>
                    <p class="text-sm font-semibold text-ink-800">{{ a.prenomChauffeur }} {{ a.nomChauffeur }}</p>
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

          <!-- Historique affectations annulées -->
          <div *ngIf="cancelledAffectations.length > 0" class="carfo-card p-6 border-l-4 border-l-ink-300">
            <h3 class="text-sm font-bold text-ink-900 mb-3 inline-flex items-center gap-2">
              <app-icon name="clock" [size]="16" class="text-ink-400"></app-icon>
              <span>Affectations annulées ({{ cancelledAffectations.length }})</span>
            </h3>
            <ul class="text-xs text-ink-500 space-y-1.5">
              <li *ngFor="let a of cancelledAffectations" class="flex items-center gap-2">
                <span class="line-through">{{ a.prenomChauffeur }} {{ a.nomChauffeur }} · {{ a.immatriculationVehicule }}</span>
                <span class="text-[11px] text-ink-400" *ngIf="a.dateAffectation">({{ a.dateAffectation | date: 'dd/MM' }})</span>
              </li>
            </ul>
          </div>

          <ng-template #affectationEmpty>
            <div *ngIf="mission.statut === 'INITIEE' || mission.statut === 'AVIS_SG_FAVORABLE'" class="carfo-card p-6 border-l-4 border-l-amber-400">
              <div class="flex items-start gap-3">
                <div class="text-amber-500 mt-0.5">
                  <app-icon name="alert" [size]="18"></app-icon>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-bold text-ink-900">Aucune affectation active</p>
                  <p class="text-xs text-ink-600 mt-1">
                    Cette mission n'a pas encore de chauffeur ni de véhicule assignés.
                  </p>
                </div>
                <a *ngIf="canAffect" [routerLink]="['/missions/affecter', mission.idMission]" class="btn btn-primary text-xs">
                  <app-icon name="route" [size]="14"></app-icon>
                  <span>Affecter</span>
                </a>
              </div>
            </div>
          </ng-template>

          <!-- Motif annulation -->
          <div *ngIf="mission.statut === 'ANNULEE'" class="carfo-card p-6 border-l-4 border-l-red-400">
            <div class="flex items-start gap-3">
              <div class="text-red-500 mt-0.5">
                <app-icon name="x-circle" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-sm font-bold text-ink-900">Mission annulée</p>
                <p class="text-xs text-ink-600 mt-1">
                  Cette mission a été annulée et ne sera pas exécutée.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Side panel : actions -->
        <div class="space-y-4">
          <div class="carfo-card p-6">
            <h3 class="text-sm font-bold text-ink-900 mb-4">Actions</h3>

            <!-- Téléchargement PDF -->
            <button
              (click)="downloadPdf()"
              [disabled]="isDownloading"
              class="btn btn-primary w-full mb-2"
            >
              <app-icon [name]="isDownloading ? 'refresh' : 'download'" [size]="16" [class.animate-spin]="isDownloading"></app-icon>
              <span>{{ isDownloading ? 'Génération…' : 'Télécharger la fiche PDF' }}</span>
            </button>

            <p class="text-[11px] text-ink-400 mb-4">
              Document officiel avec logo CARFO, prêt à imprimer ou archiver.
            </p>

            <div class="pt-4 border-t border-ink-100 space-y-2">
              <!-- Donner avis SG : sur PREVUE, visible SG/Admin. Valider DG : sur AVIS_SG_FAVORABLE, visible DG/Admin. -->
              <a
                *ngIf="canValidate && (mission.statut === 'PREVUE' || mission.statut === 'AVIS_SG_FAVORABLE')"
                [routerLink]="['/missions/valider', mission.idMission]"
                class="btn btn-secondary w-full"
              >
                <app-icon name="check-circle" [size]="16"></app-icon>
                <span>{{ mission.statut === 'PREVUE' ? 'Donner un avis (SG)' : 'Valider (DG)' }}</span>
              </a>

              <a
                *ngIf="canAffect && (mission.statut === 'INITIEE' || mission.statut === 'AVIS_SG_FAVORABLE') && activeAffectations.length === 0"
                [routerLink]="['/missions/affecter', mission.idMission]"
                class="btn btn-secondary w-full"
              >
                <app-icon name="route" [size]="16"></app-icon>
                <span>Affecter chauffeur + véhicule</span>
              </a>

              <a
                *ngIf="canAffect && (mission.statut === 'INITIEE' || mission.statut === 'AVIS_SG_FAVORABLE') && activeAffectations.length > 0"
                [routerLink]="['/missions/affecter', mission.idMission]"
                class="btn btn-secondary w-full"
              >
                <app-icon name="plus" [size]="16"></app-icon>
                <span>Ajouter une affectation</span>
              </a>

              <!-- Prolonger : CE / Admin, sur missions non clôturées / non annulées -->
              <button
                *ngIf="canExtend"
                type="button"
                (click)="openExtendModal()"
                class="btn btn-secondary w-full"
              >
                <app-icon name="calendar" [size]="16"></app-icon>
                <span>Prolonger la mission</span>
              </button>

              <!-- Annuler : SG / DG / Admin, sur missions non terminales -->
              <button
                *ngIf="canCancel"
                type="button"
                (click)="openCancelModal()"
                class="btn btn-danger w-full"
              >
                <app-icon name="x-circle" [size]="16"></app-icon>
                <span>Rejeter la mission</span>
              </button>

              <a
                [routerLink]="['/missions']"
                class="btn btn-ghost w-full"
              >
                <app-icon name="arrow-left" [size]="16"></app-icon>
                <span>Retour à la liste</span>
              </a>
            </div>
          </div>

          <!-- Metadata -->
          <div class="carfo-card p-4">
            <p class="text-[11px] uppercase tracking-wider text-ink-400 font-semibold mb-2">Référence</p>
            <p class="text-sm font-mono font-bold text-ink-900">{{ mission.reference || ('MIS-' + (mission.idMission || '?')) }}</p>
            <p class="text-xs text-ink-500 mt-3">
              Cette référence apparaîtra sur la fiche PDF officielle.
            </p>
          </div>

          <!-- Error message -->
          <div *ngIf="downloadError" class="carfo-card p-4 border-l-4 border-l-red-400">
            <div class="flex items-start gap-3">
              <div class="text-red-500 mt-0.5">
                <app-icon name="x-circle" [size]="18"></app-icon>
              </div>
              <p class="text-xs text-ink-700">{{ downloadError }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modale Annulation -->
      <div
        *ngIf="cancelModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        (click)="closeCancelModal()"
      >
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-4 mb-4">
            <div class="h-11 w-11 shrink-0 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <app-icon name="x-circle" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-bold text-ink-900">Rejeter cette mission ?</h3>
              <p class="text-xs text-ink-500 mt-1">
                Le statut passera à <strong>ANNULEE</strong>. Les chauffeurs et véhicules affectés seront libérés.
                Cette action est irréversible.
              </p>
            </div>
          </div>

          <label class="label">Motif <span class="text-ink-400 font-normal">(optionnel)</span></label>
          <textarea
            [(ngModel)]="cancelMotif"
            rows="3"
            class="input"
            placeholder="Raison de l'annulation (visible dans l'historique)…"
          ></textarea>

          <div *ngIf="actionError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
            <p class="text-xs text-ink-700">{{ actionError }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="closeCancelModal()" class="btn btn-secondary">Conserver</button>
            <button type="button" (click)="confirmCancel()" [disabled]="isActing" class="btn btn-danger">
              <app-icon [name]="isActing ? 'refresh' : 'x-circle'" [size]="14" [class.animate-spin]="isActing"></app-icon>
              <span>{{ isActing ? 'Rejet…' : 'Confirmer le rejet' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modale Prolongation -->
      <div
        *ngIf="extendModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        (click)="closeExtendModal()"
      >
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-4 mb-4">
            <div class="h-11 w-11 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <app-icon name="calendar" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-bold text-ink-900">Prolonger cette mission</h3>
              <p class="text-xs text-ink-500 mt-1">
                Date de fin actuelle : <strong>{{ mission?.dateFin | date: 'dd MMM yyyy' }}</strong>.
                La nouvelle date doit être strictement postérieure.
              </p>
            </div>
          </div>

          <label class="label">Nouvelle date de fin</label>
          <input
            type="date"
            [(ngModel)]="extendDate"
            [min]="minExtendDate"
            class="input"
          />

          <div *ngIf="actionError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
            <p class="text-xs text-ink-700">{{ actionError }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="closeExtendModal()" class="btn btn-secondary">Annuler</button>
            <button type="button" (click)="confirmExtend()" [disabled]="isActing || !extendDate" class="btn btn-primary">
              <app-icon [name]="isActing ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isActing"></app-icon>
              <span>{{ isActing ? 'Enregistrement…' : 'Confirmer' }}</span>
            </button>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class MissionDetailComponent implements OnInit {
  mission: Mission | null = null;
  isLoading = false;
  isDownloading = false;
  errorMessage = '';

  // Modales
  cancelModalOpen = false;
  cancelMotif = '';
  extendModalOpen = false;
  extendDate = '';
  isActing = false;
  actionError = '';

  get activeAffectations() {
    return (this.mission?.affectations ?? []).filter((a) => a.statut === 'ACTIVE' || !a.statut);
  }

  get cancelledAffectations() {
    return (this.mission?.affectations ?? []).filter((a) => a.statut === 'ANNULEE');
  }

  /** Rejet : DG ou Admin uniquement (PAS le SG) sur une mission non terminale. */
  get canCancel(): boolean {
    if (!this.mission) return false;
    const s = this.mission.statut;
    if (s === 'CLOTUREE' || s === 'ANNULEE') return false;
    return this.authService.hasAnyRole(['DIRECTEUR', 'ADMINISTRATEUR']);
  }

  /**
   * Affectation : seul le DMG (DIRECTEUR_DIRECTION rattaché à la Direction des Moyens Généraux)
   * ou un Administrateur peut affecter/modifier les ressources d'une mission.
   */
  get canAffect(): boolean {
    const user = this.authService.getUser();
    if (!user) return false;
    if (user.role === 'ADMINISTRATEUR') return true;
    if (user.role !== 'DIRECTEUR_DIRECTION') return false;
    const dir = (user.nomDirection || '').toLowerCase();
    return dir.includes('moyens') || dir.includes('général');
  }

  /** Validation : SG (pour donner avis sur PREVUE) ou DG (pour valider AVIS_SG_FAVORABLE) ou Admin. */
  get canValidate(): boolean {
    return this.authService.hasAnyRole(['SECRETAIRE_GENERALE', 'DIRECTEUR', 'ADMINISTRATEUR']);
  }

  /** Prolongation : CE ou Admin sur une mission non terminale. */
  get canExtend(): boolean {
    if (!this.mission) return false;
    const s = this.mission.statut;
    if (s === 'CLOTUREE' || s === 'ANNULEE' || s === 'AVIS_SG_DEFAVORABLE') return false;
    return this.authService.hasAnyRole(['CHARGE_ETUDE', 'ADMINISTRATEUR']);
  }

  /** Date minimale acceptable pour la prolongation : lendemain de la date de fin actuelle. */
  get minExtendDate(): string {
    if (!this.mission?.dateFin) return new Date().toISOString().slice(0, 10);
    const d = new Date(this.mission.dateFin);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  downloadError = '';

  constructor(
    private readonly missionService: MissionService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  openCancelModal(): void {
    this.cancelMotif = '';
    this.actionError = '';
    this.cancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.cancelModalOpen = false;
  }

  confirmCancel(): void {
    if (!this.mission?.idMission || this.isActing) return;
    this.isActing = true;
    this.actionError = '';
    this.missionService.cancelMission(this.mission.idMission, this.cancelMotif?.trim() ?? '').subscribe({
      next: () => {
        this.isActing = false;
        this.cancelModalOpen = false;
        // Recharger le détail pour voir le nouveau statut ANNULEE + motif
        if (this.mission?.idMission) this.loadMission(this.mission.idMission);
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Cancel error:', err);
        this.actionError = err.error?.message || "Erreur lors de l'annulation.";
        this.isActing = false;
      },
    });
  }

  openExtendModal(): void {
    this.extendDate = this.minExtendDate;
    this.actionError = '';
    this.extendModalOpen = true;
  }

  closeExtendModal(): void {
    this.extendModalOpen = false;
  }

  confirmExtend(): void {
    if (!this.mission?.idMission || !this.extendDate || this.isActing) return;
    this.isActing = true;
    this.actionError = '';
    this.missionService.extendMission(this.mission.idMission, this.extendDate).subscribe({
      next: () => {
        this.isActing = false;
        this.extendModalOpen = false;
        if (this.mission?.idMission) this.loadMission(this.mission.idMission);
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Extend error:', err);
        this.actionError = err.error?.message || "Erreur lors de la prolongation.";
        this.isActing = false;
      },
    });
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
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  }

  initials(nom: string, prenom: string): string {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  }

  downloadPdf(): void {
    if (!this.mission || !this.mission.idMission || this.isDownloading) return;
    this.isDownloading = true;
    this.downloadError = '';

    const id = this.mission.idMission;
    this.missionService
      .downloadFichePdf(id)
      .pipe(
        timeout(20000),
        catchError((err: unknown) => {
          console.error('[MissionDetail] PDF error:', err);
          this.downloadError = "Impossible de générer la fiche PDF. Réessayez.";
          return of(null);
        })
      )
      .subscribe((blob) => {
        this.isDownloading = false;
        if (!blob) return;
        const refLabel = this.mission?.reference || `MIS-${id}`;
        this.triggerBrowserDownload(blob, `fiche-${refLabel}.pdf`);
      });
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private loadMission(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.missionService
      .getMissionById(id)
      .pipe(
        timeout(8000),
        catchError((err: unknown) => {
          console.error('[MissionDetail] Load error:', err);
          this.errorMessage = "Le chargement de la mission a échoué.";
          return of(null);
        })
      )
      .subscribe((data) => {
        this.mission = data;
        this.isLoading = false;
      });
  }
}
