import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MissionService } from '../../core/services/mission.service';
import { AuthService } from '../../core/services/auth.service';
import { ProvinceService, Province } from '../../core/services/province.service';
import { AgentService, Agent } from '../../core/services/agent.service';
import {
  SessionSoumission,
  SessionSoumissionService,
} from '../../core/services/session-soumission.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { IconComponent } from '../../core/components/icon.component';

@Component({
  selector: 'app-mission-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    AppShellComponent,
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

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Form column -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="lg:col-span-2 carfo-card p-6 sm:p-8 space-y-5">
          <header class="pb-4 border-b border-ink-100">
            <h2 class="text-xl font-bold text-ink-900">Nouvelle mission</h2>
            <p class="text-sm text-ink-500 mt-1">Complétez le formulaire pour soumettre une nouvelle mission.</p>
          </header>

          <!-- Bandeau session de soumission -->
          <div *ngIf="activeSession" class="rounded-md p-3 border-l-4 border-l-emerald-500 bg-emerald-50/50">
            <p class="text-xs text-ink-700 inline-flex items-center gap-2">
              <app-icon name="check-circle" [size]="12" class="text-emerald-600"></app-icon>
              <span>
                Session ouverte : <strong>{{ activeSession.titre }}</strong>
                (jusqu'au {{ activeSession.dateFermeture | date: 'dd MMM yyyy' }}).
                Votre mission y sera rattachée.
              </span>
            </p>
          </div>
          <div *ngIf="!activeSession && sessionChecked" class="rounded-md p-3 border-l-4 border-l-amber-400 bg-amber-50/50">
            <p class="text-xs text-ink-700 inline-flex items-center gap-2">
              <app-icon name="alert" [size]="12" class="text-amber-600"></app-icon>
              <span>
                Aucune session de soumission ouverte aujourd'hui. La mission sera soumise hors session.
              </span>
            </p>
          </div>

          <!-- Objet -->
          <div>
            <label class="label inline-flex items-center gap-2">
              <app-icon name="target" [size]="14" class="text-ink-400"></app-icon>
              <span>Objet de la mission <span class="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              formControlName="objetMission"
              class="input"
              placeholder="Ex: Inspection des installations à Dakar"
            />
            <p *ngIf="hasError('objetMission')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
              <app-icon name="alert" [size]="12"></app-icon>
              <span>L'objet est obligatoire</span>
            </p>
          </div>

          <!-- Lieu : province + chef-lieu -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="map-pin" [size]="14" class="text-ink-400"></app-icon>
                <span>Province <span class="text-red-500">*</span></span>
              </label>
              <select [(ngModel)]="selectedProvinceId" [ngModelOptions]="{ standalone: true }"
                      (change)="onProvinceChange()" class="input">
                <option [ngValue]="null">— Sélectionnez une province —</option>
                <option *ngFor="let p of provinces" [ngValue]="p.idProvince">{{ p.nom }}</option>
              </select>
            </div>
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="building" [size]="14" class="text-ink-400"></app-icon>
                <span>Chef-lieu <span class="text-red-500">*</span></span>
              </label>
              <select formControlName="lieu" class="input">
                <option value="">— Chef-lieu —</option>
                <option *ngFor="let c of chefLieuOptions" [value]="c">{{ c }}</option>
              </select>
              <p *ngIf="hasError('lieu')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Le chef-lieu est obligatoire</span>
              </p>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="calendar" [size]="14" class="text-ink-400"></app-icon>
                <span>Date de début <span class="text-red-500">*</span></span>
              </label>
              <input
                type="date"
                formControlName="dateDebut"
                [min]="minStartDate"
                class="input"
              />
              <p *ngIf="hasError('dateDebut', 'required')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Date de début obligatoire</span>
              </p>
              <p *ngIf="hasError('dateDebut', 'tooSoon')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Doit être à 10 jours ou plus</span>
              </p>
            </div>

            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="calendar" [size]="14" class="text-ink-400"></app-icon>
                <span>Date de fin <span class="text-red-500">*</span></span>
              </label>
              <input
                type="date"
                formControlName="dateFin"
                [min]="form.value.dateDebut || minStartDate"
                class="input"
              />
              <p *ngIf="hasError('dateFin', 'required')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Date de fin obligatoire</span>
              </p>
              <p *ngIf="form.hasError('dateRange') && (submitted || form.touched)" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>La fin doit être ≥ au début</span>
              </p>
            </div>
          </div>

          <!-- Direction (auto : celle du créateur) -->
          <div>
            <label class="label inline-flex items-center gap-2">
              <app-icon name="building" [size]="14" class="text-ink-400"></app-icon>
              <span>Direction</span>
            </label>
            <div class="input bg-ink-50 flex items-center gap-2 text-ink-700">
              <app-icon name="shield-check" [size]="14" class="text-carfo-primary"></app-icon>
              <span>{{ userDirection || 'Votre direction' }}</span>
            </div>
            <p class="text-[11px] text-ink-400 mt-1.5">
              La mission est automatiquement rattachée à votre direction.
            </p>
          </div>

          <!-- Participants -->
          <div>
            <label class="label inline-flex items-center gap-2">
              <app-icon name="users" [size]="14" class="text-ink-400"></app-icon>
              <span>Participants ({{ selectedAgentsCount }} sélectionné(s))</span>
            </label>

            <!-- Champ de recherche : matricule, nom, prénom -->
            <div class="relative mb-2">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                <app-icon name="search" [size]="14"></app-icon>
              </span>
              <input
                type="text"
                [value]="agentSearch"
                (input)="onAgentSearch($any($event).target.value)"
                class="input pl-9 pr-9"
                placeholder="Rechercher par matricule, nom ou prénom…"
                autocomplete="off"
              />
              <button
                *ngIf="agentSearch"
                type="button"
                (click)="onAgentSearch('')"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition"
                aria-label="Effacer la recherche"
              >
                <app-icon name="x" [size]="14"></app-icon>
              </button>
            </div>

            <div class="border border-ink-200 rounded-lg max-h-64 overflow-y-auto bg-white divide-y divide-ink-100">
              <p *ngIf="agents.length === 0" class="text-sm text-ink-400 text-center py-6">
                Chargement des agents…
              </p>
              <p
                *ngIf="agents.length > 0 && filteredAgents.length === 0"
                class="text-sm text-ink-400 text-center py-6"
              >
                Aucun agent ne correspond à « {{ agentSearch }} ».
              </p>
              <label
                *ngFor="let agent of filteredAgents"
                class="flex items-center gap-3 px-3 py-2 hover:bg-ink-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  [value]="agent.idAgent"
                  [checked]="selectedAgentIds.has(agent.idAgent || 0)"
                  (change)="onAgentToggle(agent.idAgent || 0, $any($event).target.checked)"
                  class="h-4 w-4 rounded border-ink-300 text-carfo-primary focus:ring-carfo-primary"
                />
                <span class="text-sm text-ink-800 flex-1">
                  <strong>{{ agent.prenom }} {{ agent.nom }}</strong>
                  <span *ngIf="agent.matricule" class="text-ink-500 ml-1">· {{ agent.matricule }}</span>
                </span>
                <span
                  *ngIf="agent.estChauffeur"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700"
                >
                  <app-icon name="car" [size]="10"></app-icon>
                  <span>Chauffeur</span>
                </span>
              </label>
            </div>
            <p *ngIf="agents.length > 0" class="text-[11px] text-ink-400 mt-1.5">
              {{ filteredAgents.length }} / {{ agents.length }} agents affichés.
            </p>
          </div>

          <!-- Chef de mission (parmi les participants cochés) -->
          <div *ngIf="selectedAgentsCount > 0">
            <label class="label inline-flex items-center gap-2">
              <app-icon name="flag" [size]="14" class="text-ink-400"></app-icon>
              <span>Chef de mission</span>
            </label>
            <p class="text-xs text-ink-500 mb-2">
              Sélectionnez le chef parmi les participants. Il dirigera la mission sur le terrain.
            </p>
            <div class="border border-ink-200 rounded-lg max-h-40 overflow-y-auto bg-white divide-y divide-ink-100">
              <label
                *ngFor="let agent of selectedAgents"
                class="flex items-center gap-3 px-3 py-2 hover:bg-ink-50 cursor-pointer transition"
              >
                <input
                  type="radio"
                  name="chefMission"
                  [value]="agent.idAgent"
                  [checked]="idChefMission === agent.idAgent"
                  (change)="idChefMission = agent.idAgent || null"
                  class="h-4 w-4 border-ink-300 text-carfo-primary focus:ring-carfo-primary"
                />
                <span class="text-sm text-ink-800 flex-1">
                  <strong>{{ agent.prenom }} {{ agent.nom }}</strong>
                  <span *ngIf="agent.matricule" class="text-ink-500 ml-1">· {{ agent.matricule }}</span>
                </span>
              </label>
            </div>
            <button
              *ngIf="idChefMission"
              type="button"
              (click)="idChefMission = null"
              class="text-[11px] text-ink-500 hover:text-ink-700 mt-1.5"
            >
              Aucun chef pour cette mission
            </button>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 pt-4 border-t border-ink-100">
            <button
              type="submit"
              [disabled]="!form.valid || isLoading"
              class="btn btn-primary flex-1"
            >
              <app-icon [name]="isLoading ? 'refresh' : 'plus'" [size]="16" [class.animate-spin]="isLoading"></app-icon>
              <span>{{ isLoading ? 'Soumission…' : 'Soumettre la mission' }}</span>
            </button>
            <button
              type="button"
              (click)="onCancel()"
              class="btn btn-secondary"
            >
              Annuler
            </button>
          </div>

          <!-- Form-level errors -->
          <div *ngIf="submitted && form.invalid" class="carfo-card p-3 border-l-4 border-l-amber-400">
            <div class="flex items-start gap-3">
              <div class="text-amber-500 mt-0.5">
                <app-icon name="alert" [size]="16"></app-icon>
              </div>
              <p class="text-xs text-ink-700">Veuillez corriger les champs invalides avant de soumettre.</p>
            </div>
          </div>

          <!-- Messages -->
          <div *ngIf="errorMessage" class="carfo-card p-3 border-l-4 border-l-red-400">
            <div class="flex items-start gap-3">
              <div class="text-red-500 mt-0.5">
                <app-icon name="x-circle" [size]="16"></app-icon>
              </div>
              <p class="text-xs text-ink-700">{{ errorMessage }}</p>
            </div>
          </div>

          <div *ngIf="successMessage" class="carfo-card p-3 border-l-4 border-l-carfo-primary">
            <div class="flex items-start gap-3">
              <div class="text-carfo-primary mt-0.5">
                <app-icon name="check-circle" [size]="16"></app-icon>
              </div>
              <p class="text-xs text-ink-700">{{ successMessage }}</p>
            </div>
          </div>
        </form>

        <!-- Side info -->
        <div class="space-y-4">
          <div class="carfo-card p-4 border-l-4 border-l-blue-400">
            <div class="flex items-start gap-3">
              <div class="text-blue-500 mt-0.5">
                <app-icon name="shield-check" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Règle des 10 jours</p>
                <p class="text-xs text-ink-600 mt-1">
                  La date de début doit être au minimum 10 jours après aujourd'hui.
                </p>
              </div>
            </div>
          </div>

          <div class="carfo-card p-4 border-l-4 border-l-carfo-primary">
            <div class="flex items-start gap-3">
              <div class="text-carfo-primary mt-0.5">
                <app-icon name="sparkles" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Workflow</p>
                <p class="text-xs text-ink-600 mt-1">
                  Après soumission, la mission passe au statut <strong>PREVUE</strong> et attend l'approbation de la Secrétaire Générale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class MissionCreateComponent implements OnInit {
  form!: FormGroup;
  agents: Agent[] = [];
  selectedAgentIds: Set<number> = new Set();
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  minStartDate = this.getDateOffsetFromToday(10);

  agentSearch = '';

  /** ID du chef de mission, choisi parmi les participants cochés. */
  idChefMission: number | null = null;

  /** Session de soumission en cours (null si aucune session ouverte). */
  activeSession: SessionSoumission | null = null;
  sessionChecked = false;

  /** Direction du créateur connecté (affichée en lecture seule, envoyée par le backend). */
  userDirection = '';

  get selectedAgentsCount(): number {
    return this.selectedAgentIds.size;
  }

  /** Liste d'objets Agent des participants cochés — utilisée par le sélecteur de chef. */
  get selectedAgents(): Agent[] {
    return this.agents.filter((a) => a.idAgent != null && this.selectedAgentIds.has(a.idAgent));
  }

  /** Filtrage client-side par matricule, nom et prénom (insensible à la casse / aux accents). */
  get filteredAgents(): Agent[] {
    const q = this.normalize(this.agentSearch);
    if (!q) return this.agents;
    return this.agents.filter((a) => {
      return this.normalize(a.matricule).includes(q)
          || this.normalize(a.nom).includes(q)
          || this.normalize(a.prenom).includes(q);
    });
  }

  onAgentSearch(value: string): void {
    this.agentSearch = value ?? '';
  }

  private normalize(value: string | undefined | null): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, ''); // retire les diacritiques pour matcher é/è/à
  }

  /** Référentiel provinces + sélection courante (alimente le chef-lieu). */
  provinces: Province[] = [];
  selectedProvinceId: number | null = null;
  chefLieuOptions: string[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly missionService: MissionService,
    private readonly provinceService: ProvinceService,
    private readonly agentService: AgentService,
    private readonly sessionService: SessionSoumissionService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.initForm();
    this.userDirection = this.authService.getUser()?.nomDirection || '';
  }

  onProvinceChange(): void {
    const p = this.provinces.find((x) => x.idProvince === this.selectedProvinceId);
    this.chefLieuOptions = p ? [p.chefLieu] : [];
    // Auto-sélection du chef-lieu (1 par province)
    this.form.get('lieu')?.setValue(p ? p.chefLieu : '');
  }

  ngOnInit(): void {
    this.provinceService.list().subscribe({
      next: (list) => (this.provinces = list),
      error: (err: unknown) => console.error('Provinces load:', err),
    });
    this.loadAgents();
    this.sessionService.getActive().subscribe((s) => {
      this.activeSession = s;
      this.sessionChecked = true;
    });
  }

  onAgentToggle(idAgent: number, checked: boolean): void {
    if (checked) {
      this.selectedAgentIds.add(idAgent);
    } else {
      this.selectedAgentIds.delete(idAgent);
      // Si on dé-coche le chef de mission, on le déselectionne aussi
      if (this.idChefMission === idAgent) {
        this.idChefMission = null;
      }
    }
  }

  hasError(fieldName: string, errorName?: string): boolean {
    const field = this.form.get(fieldName);
    if (!field) return false;
    const show = this.submitted || field.dirty || field.touched;
    if (!show) return false;
    return errorName ? !!field.getError(errorName) : field.invalid;
  }

  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      this.errorMessage = 'Le formulaire contient des erreurs.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      objetMission: this.form.value.objetMission,
      lieu: this.form.value.lieu,
      dateDebut: this.form.value.dateDebut,
      dateFin: this.form.value.dateFin,
      // idDirection déduit du créateur côté serveur (plus de sélection)
      idAgents: Array.from(this.selectedAgentIds),
      rolesMission: Array(this.selectedAgentIds.size).fill('MEMBRE'),
      idChefMission: this.idChefMission,
    };

    this.missionService.createMission(payload as never).subscribe({
      next: (result) => {
        this.successMessage = `Mission créée (#${result.idMission}). Redirection…`;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/missions']), 1200);
      },
      error: (err: { error?: { message?: string; error?: string } }) => {
        console.error('Mission create error:', err);
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          'Erreur lors de la création de la mission. Vérifiez la règle des 10 jours.';
        this.isLoading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/missions']);
  }

  private initForm(): void {
    this.form = this.fb.group(
      {
        objetMission: ['', [Validators.required]],
        lieu: ['', [Validators.required]],
        dateDebut: ['', [Validators.required]],
        dateFin: ['', [Validators.required]],
      },
      {
        validators: [this.dateRangeValidator(), this.minimumLeadTimeValidator()],
      }
    );
  }

  private getDateOffsetFromToday(offsetDays: number): string {
    const now = new Date();
    now.setDate(now.getDate() + offsetDays);
    return now.toISOString().split('T')[0];
  }

  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const dateDebut = group.get('dateDebut')?.value;
      const dateFin = group.get('dateFin')?.value;
      if (!dateDebut || !dateFin) return null;
      return dateFin >= dateDebut ? null : { dateRange: true };
    };
  }

  private minimumLeadTimeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const dateDebut = group.get('dateDebut')?.value;
      if (!dateDebut) return null;

      const minDate = this.getDateOffsetFromToday(10);
      if (dateDebut < minDate) {
        const ctrl = group.get('dateDebut');
        ctrl?.setErrors({ ...(ctrl.errors ?? {}), tooSoon: true });
        return { tooSoon: true };
      }

      const ctrl = group.get('dateDebut');
      const currentErrors = ctrl?.errors;
      if (currentErrors?.['tooSoon']) {
        const { tooSoon: _ignored, ...rest } = currentErrors;
        ctrl?.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    };
  }


  private loadAgents(): void {
    this.agentService.getAllAgents().subscribe({
      next: (data) => {
        this.agents = data;
      },
      error: (err: unknown) => {
        console.error('Agents load:', err);
      },
    });
  }
}
