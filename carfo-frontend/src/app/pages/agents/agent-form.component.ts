import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgentService, Agent } from '../../core/services/agent.service';
import { DirectionService, Direction } from '../../core/services/direction.service';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { IconComponent } from '../../core/components/icon.component';

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AppShellComponent,
    IconComponent,
  ],
  template: `
    <app-shell>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <a [routerLink]="['/agents']" class="inline-flex items-center gap-1 hover:text-carfo-primary">
          <app-icon name="arrow-left" [size]="14"></app-icon>
          <span>Retour aux agents</span>
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="lg:col-span-2 carfo-card p-6 sm:p-8 space-y-5">
          <header class="pb-4 border-b border-ink-100">
            <h2 class="text-xl font-bold text-ink-900">
              {{ isEditMode ? 'Modifier un agent' : 'Nouvel agent' }}
            </h2>
            <p class="text-sm text-ink-500 mt-1">
              {{ isEditMode
                ? 'Mettez à jour les informations personnelles, le rôle et la direction.'
                : "La création passe par l'inscription standard." }}
            </p>
          </header>

          <!-- Identité -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Nom <span class="text-red-500">*</span></label>
              <input type="text" formControlName="nom" class="input" placeholder="DIALLO" />
              <p *ngIf="hasError('nom')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Nom obligatoire</span>
              </p>
            </div>
            <div>
              <label class="label">Prénom <span class="text-red-500">*</span></label>
              <input type="text" formControlName="prenom" class="input" placeholder="Aïssatou" />
              <p *ngIf="hasError('prenom')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Prénom obligatoire</span>
              </p>
            </div>
          </div>

          <!-- Matricule + Email -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="file" [size]="14" class="text-ink-400"></app-icon>
                <span>Matricule <span class="text-red-500">*</span></span>
              </label>
              <input type="text" formControlName="matricule" class="input" placeholder="A0123" />
              <p *ngIf="hasError('matricule')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Matricule obligatoire</span>
              </p>
            </div>
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="briefcase" [size]="14" class="text-ink-400"></app-icon>
                <span>Email <span class="text-red-500">*</span></span>
              </label>
              <input type="email" formControlName="email" class="input" placeholder="agent@carfo.bf" />
              <p *ngIf="hasError('email', 'required')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Email obligatoire</span>
              </p>
              <p *ngIf="hasError('email', 'email')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Format d'email invalide</span>
              </p>
            </div>
          </div>

          <!-- Téléphone + Fonction -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Téléphone <span class="text-red-500">*</span></label>
              <input type="tel" formControlName="telephone" class="input" placeholder="+226 70 12 34 56" />
              <p *ngIf="hasError('telephone')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Téléphone obligatoire</span>
              </p>
            </div>
            <div>
              <label class="label">Fonction</label>
              <input type="text" formControlName="fonction" class="input" placeholder="Chef de service" />
            </div>
          </div>

          <!-- Rôle + Direction -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="shield-check" [size]="14" class="text-ink-400"></app-icon>
                <span>Rôle <span class="text-red-500">*</span></span>
              </label>
              <select formControlName="role" class="input">
                <option value="">— Sélectionnez un rôle —</option>
                <option value="ADMINISTRATEUR">Administrateur</option>
                <option value="SECRETAIRE_GENERALE">Secrétaire Générale</option>
                <option value="DIRECTEUR">Directeur</option>
                <option value="DIRECTEUR_DIRECTION">Directeur de direction</option>
                <option value="CHARGE_ETUDE">Chargé d'étude</option>
                <option value="AGENT">Agent</option>
              </select>
              <p *ngIf="hasError('role')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Rôle obligatoire</span>
              </p>
            </div>
            <div>
              <label class="label inline-flex items-center gap-2">
                <app-icon name="building" [size]="14" class="text-ink-400"></app-icon>
                <span>Direction <span class="text-red-500">*</span></span>
              </label>
              <select formControlName="idDirection" class="input">
                <option value="">— Sélectionnez une direction —</option>
                <option *ngFor="let d of directions" [value]="d.idDirection">{{ d.nomDirection }}</option>
              </select>
              <p *ngIf="hasError('idDirection')" class="text-xs text-red-600 mt-1.5 inline-flex items-center gap-1">
                <app-icon name="alert" [size]="12"></app-icon>
                <span>Direction obligatoire</span>
              </p>
            </div>
          </div>

          <!-- Profil chauffeur -->
          <div>
            <label class="flex items-center gap-3 p-4 rounded-lg border border-ink-200 cursor-pointer hover:bg-ink-50 transition">
              <input
                type="checkbox"
                formControlName="estChauffeur"
                class="h-4 w-4 rounded border-ink-300 text-carfo-primary focus:ring-carfo-primary"
              />
              <div class="flex-1">
                <p class="text-sm font-semibold text-ink-900 inline-flex items-center gap-2">
                  <app-icon name="car" [size]="14" class="text-ink-400"></app-icon>
                  <span>Profil chauffeur</span>
                </p>
                <p class="text-xs text-ink-500 mt-0.5">
                  L'agent pourra être affecté à des missions comme chauffeur officiel.
                </p>
              </div>
            </label>
            <p *ngIf="!canCreateChauffeur" class="text-xs text-amber-600 mt-2 inline-flex items-center gap-1">
              <app-icon name="alert" [size]="12"></app-icon>
              <span>Seul le DMG peut activer le profil chauffeur.</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-4 border-t border-ink-100">
            <button
              type="submit"
              [disabled]="!form.valid || isSubmitting"
              class="btn btn-primary flex-1"
            >
              <app-icon [name]="isSubmitting ? 'refresh' : 'check'" [size]="16" [class.animate-spin]="isSubmitting"></app-icon>
              <span>{{ isSubmitting ? 'Enregistrement…' : (isEditMode ? "Mettre à jour l'agent" : "Créer l'agent") }}</span>
            </button>
            <button type="button" (click)="goBack()" class="btn btn-secondary">Annuler</button>
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
                <p class="text-xs font-bold text-ink-900">Bonnes pratiques</p>
                <p class="text-xs text-ink-600 mt-1">
                  Utilisez un matricule unique (ex : <strong>A0123</strong>) et un email valide. Le rôle conditionne les permissions dans l'application.
                </p>
              </div>
            </div>
          </div>

          <div *ngIf="!isEditMode" class="carfo-card p-4 border-l-4 border-l-amber-400">
            <div class="flex items-start gap-3">
              <div class="text-amber-500 mt-0.5">
                <app-icon name="alert" [size]="18"></app-icon>
              </div>
              <div>
                <p class="text-xs font-bold text-ink-900">Création d'agent</p>
                <p class="text-xs text-ink-600 mt-1">
                  La création complète d'un compte passe par <code class="px-1 py-0.5 bg-ink-100 rounded text-[10px]">/api/auth/register</code>. Ce formulaire est conçu pour la mise à jour.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class AgentFormComponent implements OnInit {
  form: FormGroup;
  directions: Direction[] = [];
  isEditMode = false;
  agentId: number | null = null;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  canCreateChauffeur = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly agentService: AgentService,
    private readonly directionService: DirectionService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      matricule: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      fonction: [''],
      role: ['', Validators.required],
      idDirection: ['', Validators.required],
      estChauffeur: [false],
    });
  }

  ngOnInit(): void {
    // Seuls le DMG (DIRECTEUR_DIRECTION rattaché à la Direction des Moyens Généraux) et
    // l'Administrateur peuvent créer/modifier un agent. Les autres profils sont redirigés.
    if (!this.isDmgOrAdmin()) {
      this.router.navigate(['/agents']);
      return;
    }
    // Seul le DMG peut cocher "Chauffeur" à la création (cohérent avec AuthService.register backend).
    this.canCreateChauffeur = this.isDmg();
    if (!this.canCreateChauffeur) {
      this.form.get('estChauffeur')?.setValue(false);
      this.form.get('estChauffeur')?.disable({ emitEvent: false });
    }

    this.loadDirections();
    this.route.params.subscribe((params: { [key: string]: string }) => {
      if (params['id']) {
        this.agentId = Number.parseInt(params['id'], 10);
        this.isEditMode = true;
        if (this.agentId) this.loadAgent(this.agentId);
      }
    });
  }

  private isDmg(): boolean {
    const user = this.authService.getUser();
    if (user?.role !== 'DIRECTEUR_DIRECTION') return false;
    const dir = (user.nomDirection || '').toLowerCase();
    return dir.includes('moyens') || dir.includes('général');
  }

  private isDmgOrAdmin(): boolean {
    const user = this.authService.getUser();
    if (!user) return false;
    if (user.role === 'ADMINISTRATEUR') return true;
    return this.isDmg();
  }

  hasError(fieldName: string, errorName?: string): boolean {
    const field = this.form.get(fieldName);
    if (!field) return false;
    if (!field.touched && !field.dirty) return false;
    return errorName ? !!field.getError(errorName) : field.invalid;
  }

  goBack(): void {
    this.router.navigate(['/agents']);
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const agent: Agent = {
      ...this.form.getRawValue(),
      estChauffeur: this.canCreateChauffeur ? !!this.form.get('estChauffeur')?.value : false,
      idDirection: Number.parseInt(this.form.get('idDirection')?.value, 10),
    };

    if (!this.isEditMode || !this.agentId) {
      this.errorMessage = "La création d'agent passe par l'inscription (/api/auth/register). Utilisez ce formulaire pour modifier un agent existant.";
      this.isSubmitting = false;
      return;
    }

    this.agentService.updateAgent(this.agentId, agent).subscribe({
      next: () => {
        this.successMessage = 'Agent mis à jour avec succès. Redirection…';
        setTimeout(() => this.router.navigate(['/agents']), 1200);
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Update error:', err);
        this.errorMessage = err.error?.message || "Erreur lors de l'opération.";
        this.isSubmitting = false;
      },
    });
  }

  private loadDirections(): void {
    this.directionService.getAllDirections().subscribe({
      next: (data) => {
        this.directions = data;
      },
      error: (err: unknown) => {
        console.error('Directions load:', err);
      },
    });
  }

  private loadAgent(id: number): void {
    this.agentService.getAgentById(id).subscribe({
      next: (agent) => {
        this.form.patchValue({
          nom: agent.nom,
          prenom: agent.prenom,
          matricule: agent.matricule,
          email: agent.email,
          telephone: agent.telephone,
          fonction: agent.fonction,
          role: agent.role,
          idDirection: agent.idDirection,
          estChauffeur: agent.estChauffeur ?? false,
        });
      },
      error: (err: unknown) => {
        console.error('Agent load:', err);
        this.errorMessage = "Impossible de charger l'agent";
      },
    });
  }
}
