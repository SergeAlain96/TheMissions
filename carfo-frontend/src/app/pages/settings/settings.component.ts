import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { Direction, DirectionService } from '../../core/services/direction.service';
import { Vehicule, VehiculeService } from '../../core/services/vehicule.service';
import { AppConfig, AppConfigService } from '../../core/services/app-config.service';
import { Agent, AgentService, AgentAccountView, CreateAgentRequest, CreateAccountRequest } from '../../core/services/agent.service';
import {
  NotificationTemplate,
  NotificationTemplateService,
} from '../../core/services/notification-template.service';
import {
  AuditCategory,
  AuditFilters,
  AuditLog,
  AuditService,
} from '../../core/services/audit.service';
import { AuthService, UserRole } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/components/app-shell.component';
import { IconComponent } from '../../core/components/icon.component';
import { LoadingSkeletonComponent } from '../../core/components/loading-skeleton.component';

type TabKey = 'DIRECTIONS' | 'VEHICULES' | 'INSTITUTION' | 'REGLES' | 'SECURITE' | 'AGENTS' | 'NOTIFICATIONS' | 'AUDIT';

interface ConfirmModalConfig {
  title: string;
  message: string;
  detail?: string;
  level: 'danger' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, IconComponent, LoadingSkeletonComponent],
  template: `
    <app-shell
      title="Paramètres"
      description="Configuration globale de la plateforme — réservé à l'administrateur."
    >
      <!-- Layout 2 colonnes : sidebar verticale + contenu -->
      <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <!-- Sidebar -->
        <aside class="lg:sticky lg:top-20 self-start">
          <nav class="carfo-card p-2">
            <p class="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-ink-400 font-bold">
              Catégories
            </p>
            <button
              *ngFor="let t of tabs"
              (click)="selectTab(t.key)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition text-left mt-0.5"
              [ngClass]="selectedTab === t.key
                ? 'bg-carfo-50 text-carfo-primary border-l-[3px] border-carfo-primary pl-[9px]'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 border-l-[3px] border-transparent pl-[9px]'"
            >
              <app-icon [name]="t.icon" [size]="16"></app-icon>
              <span class="flex-1">{{ t.label }}</span>
              <span *ngIf="selectedTab === t.key" class="text-carfo-primary">
                <app-icon name="chevron-right" [size]="14"></app-icon>
              </span>
            </button>
          </nav>

          <!-- Aide / contexte -->
          <div class="carfo-card p-4 mt-3 border-l-4 border-l-blue-400 bg-blue-50/40">
            <div class="flex items-start gap-2">
              <div class="text-blue-500 mt-0.5">
                <app-icon name="shield-check" [size]="14"></app-icon>
              </div>
              <p class="text-[11px] text-ink-600 leading-relaxed">
                Tous les changements appliqués ici sont <strong>immédiats</strong> et visibles
                par l'ensemble des utilisateurs.
              </p>
            </div>
          </div>
        </aside>

        <!-- Contenu de l'onglet sélectionné -->
        <div class="min-w-0">

      <!-- ============================================================= -->
      <!-- Onglet : DIRECTIONS                                              -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'DIRECTIONS'">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs text-ink-500">{{ directions.length }} direction(s)</p>
          <button (click)="openDirectionForm()" class="btn btn-primary text-xs">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Nouvelle direction</span>
          </button>
        </div>

        <div class="grid gap-3">
          <div *ngFor="let d of directions" class="carfo-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-ink-900">{{ d.nomDirection }}</h3>
                <p *ngIf="d.sigleDirection" class="text-xs text-ink-500 font-mono mt-0.5">
                  Sigle : {{ d.sigleDirection }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button (click)="editDirection(d)" class="btn btn-ghost text-xs" title="Modifier">
                  <app-icon name="pencil" [size]="14"></app-icon>
                </button>
                <button (click)="confirmDeleteDirection(d)" class="btn btn-ghost text-xs text-red-600">
                  <app-icon name="trash" [size]="14"></app-icon>
                </button>
              </div>
            </div>
          </div>
          <div *ngIf="directions.length === 0" class="carfo-card p-8 text-center text-sm text-ink-400">
            Aucune direction enregistrée.
          </div>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : VEHICULES                                              -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'VEHICULES'">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs text-ink-500">{{ vehicules.length }} véhicule(s) au parc</p>
          <button (click)="openVehiculeForm()" class="btn btn-primary text-xs">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Nouveau véhicule</span>
          </button>
        </div>

        <div class="grid gap-3">
          <div *ngFor="let v of vehicules" class="carfo-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <app-icon name="car" [size]="18"></app-icon>
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-ink-900 truncate">
                    {{ v.marque }} {{ v.modele }}
                  </h3>
                  <p class="text-xs text-ink-500 mt-0.5">
                    <span class="font-mono">{{ v.immatriculation }}</span>
                    <span *ngIf="v.capacite" class="ml-2">· {{ v.capacite }} places</span>
                    <span *ngIf="v.typeVehicule" class="ml-2">· {{ v.typeVehicule }}</span>
                  </p>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="vehiculeBadge(v.statut)">
                {{ v.statut || '—' }}
              </span>
              <div class="flex items-center gap-1">
                <button (click)="editVehicule(v)" class="btn btn-ghost text-xs" title="Modifier">
                  <app-icon name="pencil" [size]="14"></app-icon>
                </button>
                <button (click)="confirmDeleteVehicule(v)" class="btn btn-ghost text-xs text-red-600">
                  <app-icon name="trash" [size]="14"></app-icon>
                </button>
              </div>
            </div>
          </div>
          <div *ngIf="vehicules.length === 0" class="carfo-card p-8 text-center text-sm text-ink-400">
            Aucun véhicule au parc.
          </div>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : INSTITUTION                                            -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'INSTITUTION'">
        <div class="carfo-card p-6 max-w-3xl">
          <h3 class="text-base font-bold text-ink-900 mb-1">Identité institutionnelle</h3>
          <p class="text-xs text-ink-500 mb-5">
            Ces informations apparaissent dans l'en-tête des PDF officiels et dans certains éléments de l'UI.
          </p>

          <form (ngSubmit)="saveConfig()" *ngIf="config">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Nom de l'institution *</label>
                <input type="text" [(ngModel)]="config.institutionNom" name="institutionNom" class="input" />
              </div>
              <div>
                <label class="label">Sigle *</label>
                <input type="text" [(ngModel)]="config.institutionSigle" name="institutionSigle" class="input" maxlength="20" />
              </div>
              <div>
                <label class="label">Pays *</label>
                <input type="text" [(ngModel)]="config.institutionPays" name="institutionPays" class="input" />
              </div>
              <div>
                <label class="label">Adresse *</label>
                <input type="text" [(ngModel)]="config.institutionAdresse" name="institutionAdresse" class="input" />
              </div>
              <div class="sm:col-span-2">
                <label class="label">Devise *</label>
                <input type="text" [(ngModel)]="config.institutionDevise" name="institutionDevise" class="input" />
              </div>
              <div>
                <label class="label">Email <span class="text-ink-400 font-normal">(optionnel)</span></label>
                <input type="email" [(ngModel)]="config.institutionEmail" name="institutionEmail" class="input" />
              </div>
              <div>
                <label class="label">Téléphone <span class="text-ink-400 font-normal">(optionnel)</span></label>
                <input type="text" [(ngModel)]="config.institutionTelephone" name="institutionTelephone" class="input" />
              </div>
            </div>

            <div *ngIf="configError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ configError }}</p>
            </div>
            <div *ngIf="configSuccess" class="carfo-card p-3 mt-4 border-l-4 border-l-carfo-primary">
              <p class="text-xs text-ink-700">{{ configSuccess }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
              <button type="submit" [disabled]="isSavingConfig" class="btn btn-primary">
                <app-icon [name]="isSavingConfig ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSavingConfig"></app-icon>
                <span>{{ isSavingConfig ? 'Enregistrement…' : 'Enregistrer' }}</span>
              </button>
            </div>
          </form>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : RÈGLES MÉTIER                                          -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'REGLES'">
        <div class="carfo-card p-6 max-w-3xl" *ngIf="config">
          <h3 class="text-base font-bold text-ink-900 mb-1">Règles métier</h3>
          <p class="text-xs text-ink-500 mb-5">
            Comportements globaux du workflow de mission. Modifications prises en compte immédiatement.
          </p>

          <form (ngSubmit)="saveConfig()">
            <!-- Délai minimum -->
            <div class="mb-5">
              <label class="label">Délai minimum entre soumission et date de début</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  [(ngModel)]="config.delaiMinJoursOuvrables"
                  name="delaiMinJoursOuvrables"
                  class="input max-w-[120px]"
                  min="0"
                  max="30"
                />
                <span class="text-xs text-ink-600">
                  {{ config.excludeWeekends ? 'jours ouvrables' : 'jours calendaires' }}
                </span>
              </div>
              <p class="text-[11px] text-ink-400 mt-1.5">
                Par défaut : 10. Une mission soumise en deçà de ce délai sera refusée.
              </p>
            </div>

            <!-- Exclure week-ends -->
            <div class="mb-5 p-3 rounded-md bg-ink-50 border border-ink-200">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="config.excludeWeekends"
                  name="excludeWeekends"
                  class="mt-0.5 h-4 w-4 rounded border-ink-300 text-carfo-primary"
                />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-ink-900">Exclure les week-ends du calcul du délai</p>
                  <p class="text-[11px] text-ink-500 mt-0.5">
                    Si activé, samedi et dimanche ne comptent pas dans le calcul des 10 jours.
                  </p>
                </div>
              </label>
            </div>

            <!-- Format référence -->
            <div class="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Préfixe de référence</label>
                <input
                  type="text"
                  [(ngModel)]="config.referencePrefix"
                  name="referencePrefix"
                  class="input"
                  maxlength="10"
                  placeholder="MIS"
                />
                <p class="text-[11px] text-ink-400 mt-1.5">Format final : <code class="font-mono">{{ config.referencePrefix || 'MIS' }}-{{ currentYear }}-001</code></p>
              </div>
              <div>
                <label class="label">Nombre de chiffres du compteur</label>
                <input
                  type="number"
                  [(ngModel)]="config.referenceNumberPadding"
                  name="referenceNumberPadding"
                  class="input max-w-[120px]"
                  min="2"
                  max="6"
                />
                <p class="text-[11px] text-ink-400 mt-1.5">3 → 001, 002, …</p>
              </div>
            </div>

            <!-- Auto-clôture -->
            <div class="mb-5 p-3 rounded-md bg-ink-50 border border-ink-200">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="config.autoClosureEnabled"
                  name="autoClosureEnabled"
                  class="mt-0.5 h-4 w-4 rounded border-ink-300 text-carfo-primary"
                />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-ink-900">Clôture automatique des missions échues</p>
                  <p class="text-[11px] text-ink-500 mt-0.5">
                    Un job tourne chaque nuit à 01h00 et clôture les missions <em>INITIEE</em> dont la date de fin est passée.
                    Désactiver = clôture manuelle uniquement.
                  </p>
                </div>
              </label>
            </div>

            <!-- Mode strict sessions -->
            <div class="mb-5 p-3 rounded-md bg-ink-50 border border-ink-200">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="config.sessionStrictMode"
                  name="sessionStrictMode"
                  class="mt-0.5 h-4 w-4 rounded border-ink-300 text-carfo-primary"
                />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-ink-900">Mode strict des sessions de soumission</p>
                  <p class="text-[11px] text-ink-500 mt-0.5">
                    Si activé, <strong>blocage</strong> de la création de mission tant qu'aucune session n'est ouverte.
                    Sinon (mode souple), la création reste possible mais un bandeau d'avertissement s'affiche.
                  </p>
                </div>
              </label>
            </div>

            <div *ngIf="configError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ configError }}</p>
            </div>
            <div *ngIf="configSuccess" class="carfo-card p-3 mt-4 border-l-4 border-l-carfo-primary">
              <p class="text-xs text-ink-700">{{ configSuccess }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
              <button type="submit" [disabled]="isSavingConfig" class="btn btn-primary">
                <app-icon [name]="isSavingConfig ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSavingConfig"></app-icon>
                <span>{{ isSavingConfig ? 'Enregistrement…' : 'Enregistrer les règles' }}</span>
              </button>
            </div>
          </form>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : COMPTES & SÉCURITÉ                                     -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'SECURITE'">
        <!-- Action : créer un compte d'accès pour un agent existant -->
        <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p class="text-sm text-ink-600">Attribuez un compte d'accès (email, rôle, mot de passe) à un agent enregistré.</p>
          <button (click)="openCreateAccount()" class="btn btn-primary text-xs">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Créer un compte</span>
          </button>
        </div>

        <div *ngIf="accountFormSuccess" class="carfo-card p-3 mb-4 border-l-4 border-l-carfo-primary">
          <p class="text-xs text-ink-700">{{ accountFormSuccess }}</p>
        </div>

        <!-- Modale création de compte -->
        <div *ngIf="accountForm"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
             (click)="closeAccountForm()">
          <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
            <h3 class="text-base font-bold text-ink-900 mb-4">Créer un compte d'accès</h3>

            <label class="label">Agent *</label>
            <select [(ngModel)]="accountForm.idAgent" class="input mb-3">
              <option [ngValue]="null">— Sélectionner un agent —</option>
              <option *ngFor="let a of agentsSansCompte" [ngValue]="a.idAgent">
                {{ a.prenom }} {{ a.nom }} ({{ a.matricule }})
              </option>
            </select>
            <p *ngIf="agentsSansCompte.length === 0" class="text-[11px] text-amber-600 mb-3 -mt-2">
              Tous les agents ont déjà un compte. Enregistrez d'abord un agent dans « Gestion des agents ».
            </p>

            <label class="label">Email *</label>
            <input type="email" [(ngModel)]="accountForm.email" class="input mb-3" placeholder="prenom.nom@carfo.bf" />

            <label class="label">Rôle *</label>
            <select [(ngModel)]="accountForm.role" class="input mb-3">
              <option *ngFor="let r of availableRoles" [ngValue]="r.value">{{ r.label }}</option>
            </select>

            <label class="label">Mot de passe *</label>
            <input type="text" [(ngModel)]="accountForm.motDePasse" class="input" placeholder="L'agent pourra le changer ensuite" />

            <div *ngIf="accountFormError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ accountFormError }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6">
              <button type="button" (click)="closeAccountForm()" class="btn btn-secondary">Annuler</button>
              <button type="button" (click)="saveAccount()" [disabled]="isSavingAccount" class="btn btn-primary">
                <app-icon [name]="isSavingAccount ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSavingAccount"></app-icon>
                <span>{{ isSavingAccount ? 'Création…' : 'Créer le compte' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Modale édition compte (rôle / email) -->
        <div *ngIf="editAccountForm"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
             (click)="closeEditAccount()">
          <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
            <h3 class="text-base font-bold text-ink-900 mb-1">Modifier le compte</h3>
            <p class="text-xs text-ink-500 mb-4">{{ editAccountForm.nom }}</p>

            <label class="label">Email *</label>
            <input type="email" [(ngModel)]="editAccountForm.email" class="input mb-3" />

            <label class="label">Rôle *</label>
            <select [(ngModel)]="editAccountForm.role" class="input">
              <option *ngFor="let r of availableRoles" [ngValue]="r.value">{{ r.label }}</option>
            </select>

            <div *ngIf="editAccountError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ editAccountError }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6">
              <button type="button" (click)="closeEditAccount()" class="btn btn-secondary">Annuler</button>
              <button type="button" (click)="saveEditAccount()" [disabled]="isSavingEditAccount" class="btn btn-primary">
                <app-icon [name]="isSavingEditAccount ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSavingEditAccount"></app-icon>
                <span>{{ isSavingEditAccount ? 'Enregistrement…' : 'Enregistrer' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section politique de mot de passe + JWT -->
        <div class="carfo-card p-6 max-w-3xl mb-6" *ngIf="config">
          <h3 class="text-base font-bold text-ink-900 mb-1">Politique de sécurité</h3>
          <p class="text-xs text-ink-500 mb-5">
            Règles appliquées lors de la création / modification d'un compte et à la durée de session.
          </p>

          <form (ngSubmit)="saveConfig()">
            <!-- Longueur min -->
            <div class="mb-5">
              <label class="label">Longueur minimale du mot de passe</label>
              <input
                type="number"
                [(ngModel)]="config.passwordMinLength"
                name="passwordMinLength"
                class="input max-w-[120px]"
                min="4"
                max="32"
              />
              <p class="text-[11px] text-ink-400 mt-1.5">
                Par défaut : 8. Bornes acceptées : 4-32.
              </p>
            </div>

            <!-- Complexité -->
            <div class="mb-5 space-y-2">
              <label class="flex items-start gap-3 cursor-pointer p-3 rounded-md bg-ink-50 border border-ink-200">
                <input
                  type="checkbox"
                  [(ngModel)]="config.passwordRequireUppercase"
                  name="passwordRequireUppercase"
                  class="mt-0.5 h-4 w-4 rounded border-ink-300 text-carfo-primary"
                />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-ink-900">Exiger au moins une majuscule</p>
                  <p class="text-[11px] text-ink-500 mt-0.5">A-Z. Recommandé pour la conformité.</p>
                </div>
              </label>
              <label class="flex items-start gap-3 cursor-pointer p-3 rounded-md bg-ink-50 border border-ink-200">
                <input
                  type="checkbox"
                  [(ngModel)]="config.passwordRequireDigit"
                  name="passwordRequireDigit"
                  class="mt-0.5 h-4 w-4 rounded border-ink-300 text-carfo-primary"
                />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-ink-900">Exiger au moins un chiffre</p>
                  <p class="text-[11px] text-ink-500 mt-0.5">0-9.</p>
                </div>
              </label>
              <label class="flex items-start gap-3 cursor-pointer p-3 rounded-md bg-ink-50 border border-ink-200">
                <input
                  type="checkbox"
                  [(ngModel)]="config.passwordRequireSpecial"
                  name="passwordRequireSpecial"
                  class="mt-0.5 h-4 w-4 rounded border-ink-300 text-carfo-primary"
                />
                <div class="flex-1">
                  <p class="text-sm font-semibold text-ink-900">Exiger au moins un caractère spécial</p>
                  <p class="text-[11px] text-ink-500 mt-0.5">!&#64;#$%^&amp;*()_+-...</p>
                </div>
              </label>
            </div>

            <!-- JWT TTL -->
            <div class="mb-5">
              <label class="label">Durée de vie d'une session (JWT)</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  [(ngModel)]="config.jwtExpirationHours"
                  name="jwtExpirationHours"
                  class="input max-w-[120px]"
                  min="1"
                  max="168"
                />
                <span class="text-xs text-ink-600">heures</span>
              </div>
              <p class="text-[11px] text-ink-400 mt-1.5">
                Par défaut : 24h. Maximum 168h (7 jours). Les tokens déjà émis conservent leur durée d'origine.
              </p>
            </div>

            <div *ngIf="configError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ configError }}</p>
            </div>
            <div *ngIf="configSuccess" class="carfo-card p-3 mt-4 border-l-4 border-l-carfo-primary">
              <p class="text-xs text-ink-700">{{ configSuccess }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-ink-100">
              <button type="submit" [disabled]="isSavingConfig" class="btn btn-primary">
                <app-icon [name]="isSavingConfig ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSavingConfig"></app-icon>
                <span>{{ isSavingConfig ? 'Enregistrement…' : 'Enregistrer la politique' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Section liste des comptes -->
        <div class="carfo-card p-6">
          <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h3 class="text-base font-bold text-ink-900 mb-0.5">Comptes utilisateurs</h3>
              <p class="text-xs text-ink-500">
                {{ filteredComptes.length }} / {{ comptes.length }} comptes
                · {{ comptes.length ? activeCount : 0 }} actif(s)
              </p>
            </div>
            <div class="relative max-w-xs flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                <app-icon name="search" [size]="14"></app-icon>
              </span>
              <input
                type="text"
                [(ngModel)]="comptesSearch"
                class="input pl-9"
                placeholder="Rechercher…"
              />
            </div>
          </div>

          <div *ngIf="filteredComptes.length === 0" class="text-center py-8 text-sm text-ink-400 italic">
            Aucun compte ne correspond à votre recherche.
          </div>

          <div *ngIf="filteredComptes.length > 0" class="overflow-x-auto -mx-2">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="text-[10px] uppercase tracking-wider text-ink-500 border-b border-ink-200">
                  <th class="px-2 py-2 text-left font-semibold">Identité</th>
                  <th class="px-2 py-2 text-left font-semibold">Rôle</th>
                  <th class="px-2 py-2 text-left font-semibold">Direction</th>
                  <th class="px-2 py-2 text-left font-semibold">Dernière connexion</th>
                  <th class="px-2 py-2 text-left font-semibold">Statut</th>
                  <th class="px-2 py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of filteredComptes" class="border-b border-ink-100 hover:bg-ink-50/60 transition"
                    [class.opacity-60]="!c.actif">
                  <td class="px-2 py-3">
                    <p class="font-bold text-ink-900">{{ c.prenom }} {{ c.nom }}</p>
                    <p class="text-[11px] text-ink-500">
                      <span class="font-mono">{{ c.matricule }}</span> · {{ c.email }}
                    </p>
                  </td>
                  <td class="px-2 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [ngClass]="roleBadge(c.role)">
                      {{ c.role }}
                    </span>
                  </td>
                  <td class="px-2 py-3 text-ink-700">{{ c.nomDirection || '—' }}</td>
                  <td class="px-2 py-3 text-ink-700">
                    <span *ngIf="c.lastLoginAt; else neverLogged">
                      {{ c.lastLoginAt | date: 'dd MMM yy HH:mm' }}
                    </span>
                    <ng-template #neverLogged>
                      <span class="text-ink-400 italic">Jamais</span>
                    </ng-template>
                  </td>
                  <td class="px-2 py-3">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [ngClass]="c.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="c.actif ? 'bg-emerald-500' : 'bg-red-500'"></span>
                      {{ c.actif ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td class="px-2 py-3 text-right whitespace-nowrap">
                    <button (click)="openEditAccount(c)" class="btn btn-ghost text-xs" title="Modifier rôle/email">
                      <app-icon name="pencil" [size]="13"></app-icon>
                    </button>
                    <button (click)="confirmToggleActif(c)" class="btn btn-ghost text-xs"
                            [ngClass]="c.actif ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'">
                      <app-icon [name]="c.actif ? 'trash' : 'check-circle'" [size]="13"></app-icon>
                      <span>{{ c.actif ? 'Désactiver' : 'Réactiver' }}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : AGENTS (gestion complète — création en BDD via UI)     -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'AGENTS'">
        <div class="carfo-card p-4 mb-4 border-l-4 border-l-blue-400 bg-blue-50/40">
          <div class="flex items-start gap-3">
            <div class="text-blue-500 mt-0.5">
              <app-icon name="users" [size]="16"></app-icon>
            </div>
            <p class="text-xs text-ink-700 leading-relaxed">
              Créez directement de nouveaux comptes agents en base. Le mot de passe choisi permettra
              à l'agent de se connecter immédiatement. Tous les agents existants sont listés ci-dessous.
            </p>
          </div>
        </div>

        <div *ngIf="agentFormSuccess" class="carfo-card p-3 mb-4 border-l-4 border-l-carfo-primary">
          <p class="text-xs text-ink-700">{{ agentFormSuccess }}</p>
        </div>

        <!-- Action + recherche -->
        <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
              <app-icon name="search" [size]="14"></app-icon>
            </span>
            <input
              type="text"
              [(ngModel)]="agentsSearch"
              class="input pl-9"
              placeholder="Rechercher par matricule, nom, email…"
            />
          </div>
          <button (click)="openCreateAgent()" class="btn btn-primary text-xs">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Nouvel agent</span>
          </button>
        </div>

        <!-- Liste agents -->
        <div *ngIf="filteredAgentsAll.length > 0" class="carfo-card overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-ink-50 text-left text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
                <th class="px-3 py-2">Identité</th>
                <th class="px-3 py-2">Matricule</th>
                <th class="px-3 py-2">Email</th>
                <th class="px-3 py-2">Rôle</th>
                <th class="px-3 py-2">Direction</th>
                <th class="px-3 py-2">Statut</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr *ngFor="let a of filteredAgentsAll" class="hover:bg-ink-50/50 transition">
                <td class="px-3 py-2">
                  <p class="font-bold text-ink-900">{{ a.prenom }} {{ a.nom }}</p>
                  <p *ngIf="a.estChauffeur" class="text-[10px] text-blue-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                    <app-icon name="car" [size]="10"></app-icon>
                    <span>Chauffeur</span>
                  </p>
                </td>
                <td class="px-3 py-2 font-mono text-ink-700">{{ a.matricule }}</td>
                <td class="px-3 py-2 text-ink-700">{{ a.email }}</td>
                <td class="px-3 py-2 text-ink-700">{{ a.role }}</td>
                <td class="px-3 py-2 text-ink-700 truncate max-w-xs">{{ a.nomDirection || '—' }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        [ngClass]="a.actif !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                    {{ a.actif !== false ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right">
                  <button *ngIf="a.actif !== false"
                          (click)="confirmDeactivateAgent(a)"
                          class="btn btn-ghost text-xs text-red-600 hover:bg-red-50">
                    <app-icon name="trash" [size]="12"></app-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="filteredAgentsAll.length === 0" class="carfo-card p-10 text-center">
          <p class="text-sm text-ink-500">Aucun agent ne correspond à votre recherche.</p>
        </div>

        <!-- Modale création -->
        <div *ngIf="agentForm"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
             (click)="closeAgentForm()">
          <div class="carfo-card max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               (click)="$event.stopPropagation()">
            <h3 class="text-base font-bold text-ink-900 mb-4">Nouvel agent</h3>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Nom *</label>
                <input type="text" [(ngModel)]="agentForm.nom" class="input" />
              </div>
              <div>
                <label class="label">Prénom *</label>
                <input type="text" [(ngModel)]="agentForm.prenom" class="input" />
              </div>
              <div>
                <label class="label">Matricule *</label>
                <input type="text" [(ngModel)]="agentForm.matricule" class="input" placeholder="Ex: ADM010" />
              </div>
              <div>
                <label class="label">Téléphone</label>
                <input type="text" [(ngModel)]="agentForm.telephone" class="input" placeholder="+22670000000" />
              </div>
              <div>
                <label class="label">Direction *</label>
                <select [(ngModel)]="agentForm.idDirection" class="input">
                  <option *ngFor="let d of directions" [ngValue]="d.idDirection">
                    {{ d.nomDirection }}{{ d.sigleDirection ? ' (' + d.sigleDirection + ')' : '' }}
                  </option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="label">Fonction</label>
                <input type="text" [(ngModel)]="agentForm.fonction" class="input" placeholder="Ex: Chargé de mission, Comptable…" />
              </div>
            </div>

            <!-- Cocher "Chauffeur" uniquement si l'admin/DMG -->
            <label *ngIf="currentUserIsDmg" class="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" [(ngModel)]="agentForm.estChauffeur"
                     class="h-4 w-4 rounded border-ink-300 text-carfo-primary" />
              <span class="text-sm text-ink-700">Cet agent peut conduire les véhicules de mission</span>
            </label>
            <p *ngIf="!currentUserIsDmg" class="text-[11px] text-ink-400 mt-3 italic">
              Seul le DMG peut marquer un agent comme chauffeur (à faire ultérieurement via /agents si nécessaire).
            </p>

            <div *ngIf="agentFormError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ agentFormError }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6">
              <button type="button" (click)="closeAgentForm()" class="btn btn-secondary">Annuler</button>
              <button type="button" (click)="saveAgent()" [disabled]="isSavingAgent" class="btn btn-primary">
                <app-icon [name]="isSavingAgent ? 'refresh' : 'plus'" [size]="14" [class.animate-spin]="isSavingAgent"></app-icon>
                <span>{{ isSavingAgent ? 'Enregistrement…' : 'Enregistrer' }}</span>
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : NOTIFICATIONS (templates configurables)                -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'NOTIFICATIONS'">
        <div class="carfo-card p-4 mb-4 border-l-4 border-l-blue-400 bg-blue-50/40">
          <div class="flex items-start gap-3">
            <div class="text-blue-500 mt-0.5">
              <app-icon name="bell" [size]="16"></app-icon>
            </div>
            <p class="text-xs text-ink-700 leading-relaxed">
              Personnalisez le titre et le corps des notifications envoyées aux utilisateurs.
              Utilisez <code class="font-mono bg-white px-1 rounded">{{ '{nom_variable}' }}</code> pour interpoler des valeurs
              (ex: <code class="font-mono bg-white px-1 rounded">{{ '{objet}' }}</code>,
              <code class="font-mono bg-white px-1 rounded">{{ '{dateDebut}' }}</code>).
              Les variables disponibles sont listées sous chaque template.
            </p>
          </div>
        </div>

        <div *ngIf="templateSuccess" class="carfo-card p-3 mb-4 border-l-4 border-l-carfo-primary">
          <p class="text-xs text-ink-700">{{ templateSuccess }}</p>
        </div>

        <div class="grid gap-3">
          <div *ngFor="let t of templates" class="carfo-card p-5"
               [class.opacity-60]="!t.actif">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase tracking-wider font-bold text-ink-400 mb-1">
                  {{ t.notificationType }}
                </p>
                <h3 class="text-sm font-bold text-ink-900">{{ labelFor(t.notificationType) }}</h3>
              </div>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="t.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'">
                <span class="h-1.5 w-1.5 rounded-full" [ngClass]="t.actif ? 'bg-emerald-500' : 'bg-ink-400'"></span>
                {{ t.actif ? 'Actif' : 'Inactif' }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 text-xs mb-3">
              <p class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold pt-1">Titre</p>
              <p class="font-semibold text-ink-800">{{ t.titre }}</p>
              <p class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold pt-1">Corps</p>
              <p class="text-ink-700 whitespace-pre-wrap">{{ t.corps }}</p>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-ink-100">
              <p class="text-[10px] text-ink-400">
                Variables :
                <code *ngFor="let v of variablesFor(t.notificationType)" class="font-mono mx-0.5">
                  {{ '{' + v + '}' }}
                </code>
              </p>
              <button (click)="openTemplateEditor(t)" class="btn btn-ghost text-xs">
                <app-icon name="pencil" [size]="13"></app-icon>
                <span>Modifier</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Modale d'édition d'un template -->
        <div *ngIf="templateEditing"
             class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
             (click)="closeTemplateEditor()">
          <div class="carfo-card max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
               (click)="$event.stopPropagation()">
            <h3 class="text-base font-bold text-ink-900 mb-1">
              {{ labelFor(templateEditing.notificationType) }}
            </h3>
            <p class="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-4">
              {{ templateEditing.notificationType }}
            </p>

            <label class="label">Titre *</label>
            <input
              type="text"
              [(ngModel)]="templateEditing.titre"
              class="input mb-3"
              maxlength="200"
            />

            <label class="label">Corps</label>
            <textarea
              [(ngModel)]="templateEditing.corps"
              rows="4"
              class="input"
              maxlength="1000"
              placeholder="Vous pouvez utiliser des variables : {objet}, {dateDebut}, …"
            ></textarea>

            <div class="mt-2 p-2 rounded-md bg-ink-50 border border-ink-200">
              <p class="text-[10px] uppercase tracking-wider text-ink-500 font-bold mb-1.5">
                Variables disponibles pour ce type
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  *ngFor="let v of variablesFor(templateEditing.notificationType)"
                  type="button"
                  (click)="templateEditing.corps = (templateEditing.corps || '') + '{' + v + '}'"
                  class="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-ink-300 hover:border-carfo-primary hover:text-carfo-primary transition"
                >
                  {{ '{' + v + '}' }}
                </button>
              </div>
            </div>

            <label class="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="templateEditing.actif"
                class="h-4 w-4 rounded border-ink-300 text-carfo-primary"
              />
              <span class="text-sm text-ink-700">Template actif</span>
            </label>
            <p class="text-[11px] text-ink-400 mt-1 ml-6">
              Si décoché, le template est ignoré et le système utilise le message hardcodé par défaut.
            </p>

            <div *ngIf="templateError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
              <p class="text-xs text-ink-700">{{ templateError }}</p>
            </div>

            <div class="flex items-center justify-end gap-2 mt-6">
              <button type="button" (click)="closeTemplateEditor()" class="btn btn-secondary">Annuler</button>
              <button type="button" (click)="saveTemplate()" [disabled]="isSavingTemplate" class="btn btn-primary">
                <app-icon [name]="isSavingTemplate ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSavingTemplate"></app-icon>
                <span>{{ isSavingTemplate ? 'Enregistrement…' : 'Enregistrer' }}</span>
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================= -->
      <!-- Onglet : AUDIT (journal des actions sensibles)                  -->
      <!-- ============================================================= -->
      <ng-container *ngIf="selectedTab === 'AUDIT'">
        <div class="carfo-card p-4 mb-4 border-l-4 border-l-blue-400 bg-blue-50/40">
          <div class="flex items-start gap-3">
            <div class="text-blue-500 mt-0.5">
              <app-icon name="list" [size]="16"></app-icon>
            </div>
            <p class="text-xs text-ink-700 leading-relaxed">
              Journal immuable des actions sensibles (connexions, validations, annulations, affectations).
              Les entrées sont conservées même si l'agent est désactivé. Filtrez par catégorie, agent ou période.
            </p>
          </div>
        </div>

        <!-- Filtres -->
        <div class="carfo-card p-4 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="label">Catégorie</label>
              <select [(ngModel)]="auditFilters.category" (change)="applyAuditFilters()" class="input text-xs">
                <option [ngValue]="undefined">Toutes</option>
                <option *ngFor="let c of auditCategories" [ngValue]="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="label">Email (contient)</label>
              <input type="text" [(ngModel)]="auditFilters.email" (keyup.enter)="applyAuditFilters()"
                     class="input text-xs" placeholder="ex: admin@" />
            </div>
            <div>
              <label class="label">Depuis</label>
              <input type="datetime-local" [(ngModel)]="auditFilters.fromDate" (change)="applyAuditFilters()"
                     class="input text-xs" />
            </div>
            <div>
              <label class="label">Jusqu'à</label>
              <input type="datetime-local" [(ngModel)]="auditFilters.toDate" (change)="applyAuditFilters()"
                     class="input text-xs" />
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 mt-3">
            <button (click)="resetAuditFilters()" class="btn btn-secondary text-xs">
              <app-icon name="refresh" [size]="13"></app-icon>
              <span>Réinitialiser</span>
            </button>
            <button (click)="applyAuditFilters()" class="btn btn-primary text-xs">
              <app-icon name="search" [size]="13"></app-icon>
              <span>Filtrer</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <app-loading-skeleton *ngIf="isLoadingAudit" variant="list" [count]="4"></app-loading-skeleton>

        <!-- Table -->
        <div *ngIf="!isLoadingAudit && auditLogs.length > 0" class="carfo-card overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-ink-50 text-left text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
                <th class="px-3 py-2">Horodatage</th>
                <th class="px-3 py-2">Catégorie</th>
                <th class="px-3 py-2">Action</th>
                <th class="px-3 py-2">Agent</th>
                <th class="px-3 py-2">Résumé</th>
                <th class="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr *ngFor="let log of auditLogs" class="hover:bg-ink-50/50 transition">
                <td class="px-3 py-2 text-ink-700 whitespace-nowrap font-mono">
                  {{ log.timestamp | date: 'dd/MM/yyyy HH:mm:ss' }}
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        [ngClass]="auditBadgeClass(log.category)">
                    {{ log.category }}
                  </span>
                </td>
                <td class="px-3 py-2 font-mono text-ink-900 font-semibold">{{ log.action }}</td>
                <td class="px-3 py-2 text-ink-700">
                  <p *ngIf="log.agentNom" class="font-semibold">{{ log.agentNom }}</p>
                  <p class="text-[11px] text-ink-500">{{ log.agentEmail || '—' }}</p>
                </td>
                <td class="px-3 py-2 text-ink-700 max-w-md">{{ log.summary }}</td>
                <td class="px-3 py-2 text-ink-500 font-mono text-[11px]">{{ log.ipAddress || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="!isLoadingAudit && auditLogs.length === 0" class="carfo-card p-10 text-center">
          <p class="text-sm text-ink-500">Aucune entrée d'audit ne correspond aux filtres.</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="!isLoadingAudit && auditTotalPages > 1" class="flex items-center justify-between mt-4">
          <p class="text-xs text-ink-500">
            {{ auditTotalElements }} entrée(s) — page {{ (auditFilters.page ?? 0) + 1 }} / {{ auditTotalPages }}
          </p>
          <div class="flex items-center gap-1">
            <button (click)="goToAuditPage((auditFilters.page ?? 0) - 1)"
                    [disabled]="(auditFilters.page ?? 0) === 0"
                    class="btn btn-ghost text-xs">
              <app-icon name="arrow-left" [size]="13"></app-icon>
              <span>Précédent</span>
            </button>
            <button (click)="goToAuditPage((auditFilters.page ?? 0) + 1)"
                    [disabled]="(auditFilters.page ?? 0) >= auditTotalPages - 1"
                    class="btn btn-ghost text-xs">
              <span>Suivant</span>
              <app-icon name="arrow-right" [size]="13"></app-icon>
            </button>
          </div>
        </div>
      </ng-container>

        </div>
      </div>
      <!-- /Layout 2 colonnes -->

      <!-- ============================================================= -->
      <!-- Modale Direction (création / édition)                          -->
      <!-- ============================================================= -->
      <div *ngIf="directionForm"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
           (click)="closeDirectionForm()">
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <h3 class="text-base font-bold text-ink-900 mb-4">
            {{ directionForm.idDirection ? 'Modifier la direction' : 'Nouvelle direction' }}
          </h3>
          <label class="label">Nom *</label>
          <input type="text" [(ngModel)]="directionForm.nomDirection" class="input mb-3" />

          <label class="label">Sigle</label>
          <input type="text" [(ngModel)]="directionForm.sigleDirection" class="input" maxlength="10" />

          <div *ngIf="formError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
            <p class="text-xs text-ink-700">{{ formError }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="closeDirectionForm()" class="btn btn-secondary">Annuler</button>
            <button type="button" (click)="saveDirection()" [disabled]="isSaving" class="btn btn-primary">
              <app-icon [name]="isSaving ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSaving"></app-icon>
              <span>{{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- Modale Véhicule (création / édition)                           -->
      <!-- ============================================================= -->
      <div *ngIf="vehiculeForm"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
           (click)="closeVehiculeForm()">
        <div class="carfo-card max-w-lg w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <h3 class="text-base font-bold text-ink-900 mb-4">
            {{ vehiculeForm.idVehicule ? 'Modifier le véhicule' : 'Nouveau véhicule' }}
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Immatriculation *</label>
              <input type="text" [(ngModel)]="vehiculeForm.immatriculation" class="input" />
            </div>
            <div>
              <label class="label">Type</label>
              <input type="text" [(ngModel)]="vehiculeForm.typeVehicule" class="input" placeholder="Ex: SUV 4x4" />
            </div>
            <div>
              <label class="label">Marque *</label>
              <input type="text" [(ngModel)]="vehiculeForm.marque" class="input" />
            </div>
            <div>
              <label class="label">Modèle *</label>
              <input type="text" [(ngModel)]="vehiculeForm.modele" class="input" />
            </div>
            <div>
              <label class="label">Capacité</label>
              <input type="number" [(ngModel)]="vehiculeForm.capacite" class="input" min="1" max="50" />
            </div>
            <div>
              <label class="label">Statut</label>
              <select [(ngModel)]="vehiculeForm.statut" class="input">
                <option value="DISPONIBLE">Disponible</option>
                <option value="EN_MISSION">En mission</option>
                <option value="EN_MAINTENANCE">En maintenance</option>
                <option value="HORS_SERVICE">Hors service</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="label">Date d'acquisition</label>
              <input type="date" [(ngModel)]="vehiculeForm.dateAcquisition" class="input" />
            </div>
          </div>

          <div *ngIf="formError" class="carfo-card p-3 mt-4 border-l-4 border-l-red-400">
            <p class="text-xs text-ink-700">{{ formError }}</p>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="closeVehiculeForm()" class="btn btn-secondary">Annuler</button>
            <button type="button" (click)="saveVehicule()" [disabled]="isSaving" class="btn btn-primary">
              <app-icon [name]="isSaving ? 'refresh' : 'check-circle'" [size]="14" [class.animate-spin]="isSaving"></app-icon>
              <span>{{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- Modale Confirmation (réutilisable pour suppression / modif)    -->
      <!-- ============================================================= -->
      <div *ngIf="confirmModal"
           class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
           (click)="cancelConfirm()">
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-4 mb-4">
            <div class="h-11 w-11 shrink-0 rounded-full flex items-center justify-center"
                 [ngClass]="confirmIconClass()">
              <app-icon [name]="confirmModal.level === 'danger' ? 'trash' : 'alert'" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="text-base font-bold text-ink-900">{{ confirmModal.title }}</h3>
              <p class="text-xs text-ink-500 mt-1">{{ confirmModal.message }}</p>
              <p *ngIf="confirmModal.detail" class="text-xs text-ink-700 mt-2 px-3 py-2 rounded-md bg-ink-50 border border-ink-200">
                {{ confirmModal.detail }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="cancelConfirm()" class="btn btn-secondary">
              {{ confirmModal.cancelLabel || 'Annuler' }}
            </button>
            <button type="button" (click)="acceptConfirm()" class="btn"
                    [ngClass]="confirmModal.level === 'danger' ? 'btn-danger' : 'btn-primary'">
              <app-icon [name]="confirmModal.level === 'danger' ? 'trash' : 'check-circle'" [size]="14"></app-icon>
              <span>{{ confirmModal.confirmLabel || 'Confirmer' }}</span>
            </button>
          </div>
        </div>
      </div>
    </app-shell>
  `,
})
export class SettingsComponent implements OnInit {
  selectedTab: TabKey = 'DIRECTIONS';

  tabs: { key: TabKey; label: string; icon: 'building' | 'car' | 'shield-check' | 'settings' | 'user' | 'users' | 'bell' | 'list' }[] = [
    { key: 'DIRECTIONS',    label: 'Directions',         icon: 'building' },
    { key: 'VEHICULES',     label: 'Véhicules',          icon: 'car' },
    { key: 'INSTITUTION',   label: 'Institution',        icon: 'shield-check' },
    { key: 'REGLES',        label: 'Règles métier',      icon: 'settings' },
    { key: 'AGENTS',        label: 'Gestion des agents', icon: 'users' },
    { key: 'SECURITE',      label: 'Comptes & sécurité', icon: 'user' },
    { key: 'NOTIFICATIONS', label: 'Notifications',      icon: 'bell' },
    { key: 'AUDIT',         label: 'Journal d\'audit',   icon: 'list' },
  ];

  directions: Direction[] = [];
  directionForm: Direction | null = null;

  vehicules: Vehicule[] = [];
  vehiculeForm: Vehicule | null = null;

  config: AppConfig | null = null;
  configError = '';
  configSuccess = '';
  isSavingConfig = false;

  formError = '';
  isSaving = false;

  /** Modale de confirmation réutilisable (suppression, modification critique). */
  confirmModal: ConfirmModalConfig | null = null;

  /** Pour l'aperçu du format de référence dans l'onglet Règles métier. */
  readonly currentYear = new Date().getFullYear();

  /** Liste des comptes pour l'onglet "Comptes & sécurité". */
  comptes: AgentAccountView[] = [];
  comptesSearch = '';

  /** Gestion des agents (onglet "AGENTS") — liste complète + CRUD. */
  agentsAll: Agent[] = [];
  agentsSearch = '';

  /** État du formulaire de création d'agent (identité seule). */
  agentForm: Partial<CreateAgentRequest & { idAgent?: number }> | null = null;
  isSavingAgent = false;
  agentFormError = '';
  agentFormSuccess = '';

  /** État de la modale de création de compte (onglet Comptes & sécurité). */
  accountForm: { idAgent: number | null; email: string; motDePasse: string; role: string } | null = null;
  agentsSansCompte: Agent[] = [];
  isSavingAccount = false;
  accountFormError = '';
  accountFormSuccess = '';

  /** Édition compte existant (rôle/email). */
  editAccountForm: { idAgent: number; nom: string; email: string; role: string } | null = null;
  isSavingEditAccount = false;
  editAccountError = '';

  /** Rôles disponibles pour la création d'agent. */
  readonly availableRoles: { value: UserRole; label: string }[] = [
    { value: 'AGENT',               label: 'Agent simple' },
    { value: 'CHARGE_ETUDE',        label: 'Chargé d\'étude' },
    { value: 'DIRECTEUR_DIRECTION', label: 'Directeur de direction' },
    { value: 'SECRETAIRE_GENERALE', label: 'Secrétaire générale' },
    { value: 'DIRECTEUR',           label: 'Directeur Général' },
    { value: 'ADMINISTRATEUR',      label: 'Administrateur' },
  ];

  /** Journal d'audit (onglet "Audit"). */
  auditLogs: AuditLog[] = [];
  auditFilters: AuditFilters = { page: 0, size: 30 };
  auditTotalPages = 0;
  auditTotalElements = 0;
  isLoadingAudit = false;

  readonly auditCategories: AuditCategory[] = ['AUTH', 'MISSION', 'AFFECTATION', 'AGENT', 'CONFIG', 'OTHER'];

  /** Couleur du badge par catégorie d'audit. */
  readonly auditCategoryColors: Record<AuditCategory, string> = {
    AUTH:        'bg-amber-50 text-amber-700',
    MISSION:     'bg-blue-50 text-blue-700',
    AFFECTATION: 'bg-carfo-50 text-carfo-primary',
    AGENT:       'bg-purple-50 text-purple-700',
    CONFIG:      'bg-rose-50 text-rose-700',
    OTHER:       'bg-ink-100 text-ink-700',
  };

  /** Templates de notifications (onglet "Notifications"). */
  templates: NotificationTemplate[] = [];
  templateEditing: NotificationTemplate | null = null;
  templateError = '';
  templateSuccess = '';
  isSavingTemplate = false;

  /**
   * Documentation des variables interpolables par type. Affichée sous le textarea
   * pour guider l'admin (l'interpolation est faite côté backend via {key}).
   */
  readonly templateVars: Record<string, string[]> = {
    MISSION_SOUMISE:        ['direction', 'objet', 'dateDebut', 'dateFin', 'reference'],
    AVIS_SG_FAVORABLE:      ['objet', 'reference', 'dateDebut', 'dateFin'],
    AVIS_SG_DEFAVORABLE:    ['objet', 'reference', 'motif', 'motifSuffix'],
    MISSION_VALIDEE:        ['objet', 'reference', 'dateDebut', 'dateFin'],
    MISSION_ANNULEE:        ['objet', 'reference', 'motif', 'motifSuffix'],
    MISSION_CLOTUREE:       ['objet', 'reference', 'dateDebut', 'dateFin'],
    AFFECTATION_CREEE:      ['objet', 'reference', 'chauffeur', 'vehicule'],
    AFFECTATION_SUPPRIMEE:  ['objet', 'reference', 'chauffeur'],
    ABSENCE_DECLAREE:       ['prenom', 'nom', 'dateDebut', 'dateFin', 'motif'],
  };

  /** Libellé lisible pour chaque NotificationType (en français). */
  readonly templateLabels: Record<string, string> = {
    MISSION_SOUMISE:        'Mission soumise (→ SG)',
    AVIS_SG_FAVORABLE:      'Avis SG favorable (→ DMG, DG, directeurs)',
    AVIS_SG_DEFAVORABLE:    'Avis SG défavorable (→ directeurs)',
    MISSION_VALIDEE:        'Mission validée (→ DMG, directeurs)',
    MISSION_ANNULEE:        'Mission annulée (→ directeurs)',
    MISSION_CLOTUREE:       'Mission clôturée (→ DRH)',
    AFFECTATION_CREEE:      'Affectation créée (→ chauffeur, directeurs)',
    AFFECTATION_SUPPRIMEE:  'Affectation supprimée (→ chauffeur)',
    ABSENCE_DECLAREE:       'Absence déclarée (→ Chargé d\'études)',
  };

  constructor(
    private readonly directionService: DirectionService,
    private readonly vehiculeService: VehiculeService,
    private readonly appConfigService: AppConfigService,
    private readonly agentService: AgentService,
    private readonly templateService: NotificationTemplateService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  // ─── Journal d'audit ────────────────────────────────────────────────

  /** Chargement initial dès qu'on sélectionne l'onglet (cf. selectTab). */
  reloadAudit(): void {
    this.isLoadingAudit = true;
    this.auditService.search(this.auditFilters).pipe(
      timeout(8000),
      catchError(() => of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: this.auditFilters.size ?? 30 }))
    ).subscribe((page) => {
      this.auditLogs = page.content;
      this.auditTotalPages = page.totalPages;
      this.auditTotalElements = page.totalElements;
      this.auditFilters.page = page.page;
      this.isLoadingAudit = false;
    });
  }

  applyAuditFilters(): void {
    this.auditFilters.page = 0;
    this.reloadAudit();
  }

  resetAuditFilters(): void {
    this.auditFilters = { page: 0, size: 30 };
    this.reloadAudit();
  }

  goToAuditPage(p: number): void {
    if (p < 0 || (this.auditTotalPages > 0 && p >= this.auditTotalPages)) return;
    this.auditFilters.page = p;
    this.reloadAudit();
  }

  auditBadgeClass(category: AuditCategory): string {
    return this.auditCategoryColors[category] || 'bg-ink-100 text-ink-700';
  }

  ngOnInit(): void {
    // Garde : seul l'admin peut voir cette page
    if (this.authService.getRole() !== 'ADMINISTRATEUR') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.reloadDirections();
    this.reloadVehicules();
    this.reloadConfig();
    this.reloadComptes();
    this.reloadTemplates();
  }

  // ─── Templates de notifications ─────────────────────────────────────

  reloadTemplates(): void {
    this.templateService.listAll().pipe(
      timeout(8000),
      catchError(() => of([] as NotificationTemplate[]))
    ).subscribe((list) => (this.templates = list));
  }

  openTemplateEditor(t: NotificationTemplate): void {
    this.templateEditing = { ...t };
    this.templateError = '';
    this.templateSuccess = '';
  }

  closeTemplateEditor(): void {
    this.templateEditing = null;
  }

  saveTemplate(): void {
    if (!this.templateEditing || this.isSavingTemplate) return;
    if (!this.templateEditing.titre?.trim()) {
      this.templateError = 'Le titre est obligatoire.';
      return;
    }
    const snapshot = { ...this.templateEditing };
    this.askConfirm({
      title: 'Mettre à jour ce template ?',
      message: 'Le titre et le corps interpolés seront utilisés pour toutes les nouvelles notifications de ce type.',
      detail: this.templateLabels[snapshot.notificationType] || snapshot.notificationType,
      level: 'warning',
      confirmLabel: 'Enregistrer',
      onConfirm: () => this.persistTemplate(snapshot),
    });
  }

  private persistTemplate(payload: NotificationTemplate): void {
    this.isSavingTemplate = true;
    this.templateError = '';
    this.templateSuccess = '';
    this.templateService.update(payload.notificationType, payload).subscribe({
      next: () => {
        this.isSavingTemplate = false;
        this.templateEditing = null;
        this.templateSuccess = 'Template mis à jour. Les prochaines notifications de ce type utiliseront ces nouvelles valeurs.';
        this.reloadTemplates();
      },
      error: (err: { error?: { message?: string } }) => {
        this.templateError = err.error?.message || 'Erreur lors de l\'enregistrement.';
        this.isSavingTemplate = false;
      },
    });
  }

  variablesFor(type: string): string[] {
    return this.templateVars[type] || [];
  }

  labelFor(type: string): string {
    return this.templateLabels[type] || type;
  }

  // ─── Comptes & sécurité ─────────────────────────────────────────────

  reloadComptes(): void {
    this.agentService.getComptes().pipe(
      timeout(8000),
      catchError(() => of([] as AgentAccountView[]))
    ).subscribe((list) => (this.comptes = list));
  }

  get filteredComptes(): AgentAccountView[] {
    const q = this.comptesSearch.trim().toLowerCase();
    if (!q) return this.comptes;
    return this.comptes.filter((c) =>
      [c.matricule, c.nom, c.prenom, c.email].some((v) => v?.toLowerCase().includes(q))
    );
  }

  get activeCount(): number {
    return this.comptes.filter((c) => c.actif).length;
  }

  roleBadge(role: string): string {
    switch (role) {
      case 'ADMINISTRATEUR':      return 'bg-red-50 text-red-700';
      case 'SECRETAIRE_GENERALE': return 'bg-purple-50 text-purple-700';
      case 'DIRECTEUR':           return 'bg-blue-50 text-blue-700';
      case 'DIRECTEUR_DIRECTION': return 'bg-amber-50 text-amber-700';
      case 'CHARGE_ETUDE':        return 'bg-emerald-50 text-emerald-700';
      default:                    return 'bg-ink-100 text-ink-700';
    }
  }

  confirmToggleActif(c: AgentAccountView): void {
    const action = c.actif ? 'désactiver' : 'réactiver';
    this.askConfirm({
      title: c.actif ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?',
      message: c.actif
        ? 'L\'utilisateur ne pourra plus se connecter. L\'historique (missions, absences) est conservé.'
        : 'Le compte sera de nouveau autorisé à se connecter.',
      detail: `${c.prenom} ${c.nom} · ${c.email}`,
      level: c.actif ? 'danger' : 'warning',
      confirmLabel: c.actif ? 'Désactiver' : 'Réactiver',
      onConfirm: () => {
        const obs = c.actif
          ? this.agentService.deactivateAgent(c.idAgent)
          : this.agentService.reactivateAgent(c.idAgent);
        obs.subscribe({
          next: () => this.reloadComptes(),
          error: (err: { error?: { message?: string } }) => {
            this.askConfirm({
              title: 'Action impossible',
              message: err.error?.message || `Impossible de ${action} ce compte.`,
              level: 'warning',
              confirmLabel: 'OK',
              cancelLabel: 'Fermer',
              onConfirm: () => {},
            });
          },
        });
      },
    });
  }

  selectTab(key: TabKey): void {
    this.selectedTab = key;
    this.formError = '';
    this.configError = '';
    this.configSuccess = '';
    this.agentFormError = '';
    this.agentFormSuccess = '';
    // Chargement à la demande
    if (key === 'AUDIT' && this.auditLogs.length === 0) {
      this.reloadAudit();
    }
    if (key === 'AGENTS' && this.agentsAll.length === 0) {
      this.reloadAgentsAll();
    }
  }

  // ─── Gestion des agents ─────────────────────────────────────────────

  reloadAgentsAll(): void {
    this.agentService.getAllAgents().pipe(
      timeout(8000),
      catchError(() => of([] as Agent[]))
    ).subscribe((list) => (this.agentsAll = list));
  }

  get filteredAgentsAll(): Agent[] {
    const q = this.agentsSearch.trim().toLowerCase();
    if (!q) return this.agentsAll;
    return this.agentsAll.filter((a) =>
      [a.matricule, a.nom, a.prenom, a.email].some((v) => (v || '').toLowerCase().includes(q))
    );
  }

  openCreateAgent(): void {
    this.agentForm = {
      nom: '',
      prenom: '',
      matricule: '',
      idDirection: this.directions[0]?.idDirection,
      fonction: '',
      telephone: '',
      estChauffeur: false,
    };
    this.agentFormError = '';
    this.agentFormSuccess = '';
  }

  closeAgentForm(): void {
    this.agentForm = null;
  }

  saveAgent(): void {
    if (!this.agentForm || this.isSavingAgent) return;
    // Validation : identité uniquement (le compte d'accès est créé séparément)
    if (!this.agentForm.nom?.trim() || !this.agentForm.prenom?.trim()
        || !this.agentForm.matricule?.trim() || !this.agentForm.idDirection) {
      this.agentFormError = 'Nom, prénom, matricule et direction sont obligatoires.';
      return;
    }
    const snapshot: CreateAgentRequest = {
      nom: this.agentForm.nom,
      prenom: this.agentForm.prenom,
      matricule: this.agentForm.matricule,
      fonction: this.agentForm.fonction,
      telephone: this.agentForm.telephone,
      estChauffeur: this.agentForm.estChauffeur ?? false,
      idDirection: this.agentForm.idDirection,
    };
    this.askConfirm({
      title: 'Enregistrer cet agent ?',
      message: 'L\'agent sera enregistré en base. Son compte d\'accès (email, rôle, mot de passe) se crée séparément dans l\'onglet « Comptes & sécurité ».',
      detail: `${snapshot.prenom} ${snapshot.nom} · ${snapshot.matricule}`,
      level: 'warning',
      confirmLabel: 'Enregistrer',
      onConfirm: () => this.persistAgent(snapshot),
    });
  }

  private persistAgent(payload: CreateAgentRequest): void {
    this.isSavingAgent = true;
    this.agentFormError = '';
    this.agentService.createAgentIdentity(payload).subscribe({
      next: (created) => {
        this.isSavingAgent = false;
        this.agentForm = null;
        this.agentFormSuccess = `Agent enregistré : ${created.prenom} ${created.nom} (${created.matricule}).`;
        this.reloadAgentsAll();
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Create agent error:', err);
        this.agentFormError = err.error?.message || 'Erreur lors de l\'enregistrement de l\'agent.';
        this.isSavingAgent = false;
      },
    });
  }

  // ─── Création de compte d'accès (onglet Comptes & sécurité) ─────────

  openCreateAccount(): void {
    this.accountForm = { idAgent: null, email: '', motDePasse: '', role: 'AGENT' };
    this.accountFormError = '';
    this.accountFormSuccess = '';
    // Charge les agents sans compte pour le sélecteur
    this.agentService.getAgentsSansCompte().pipe(
      timeout(8000),
      catchError(() => of([] as Agent[]))
    ).subscribe((list) => (this.agentsSansCompte = list));
  }

  closeAccountForm(): void {
    this.accountForm = null;
  }

  saveAccount(): void {
    if (!this.accountForm || this.isSavingAccount) return;
    if (!this.accountForm.idAgent || !this.accountForm.email?.trim()
        || !this.accountForm.motDePasse || !this.accountForm.role) {
      this.accountFormError = 'Agent, email, rôle et mot de passe sont obligatoires.';
      return;
    }
    const payload: CreateAccountRequest = {
      idAgent: this.accountForm.idAgent,
      email: this.accountForm.email,
      motDePasse: this.accountForm.motDePasse,
      role: this.accountForm.role,
    };
    const agent = this.agentsSansCompte.find((a) => a.idAgent === payload.idAgent);
    this.askConfirm({
      title: 'Créer ce compte d\'accès ?',
      message: 'L\'agent pourra se connecter immédiatement avec cet email et ce mot de passe.',
      detail: agent ? `${agent.prenom} ${agent.nom} · ${payload.email} · ${payload.role}` : payload.email,
      level: 'warning',
      confirmLabel: 'Créer le compte',
      onConfirm: () => this.persistAccount(payload),
    });
  }

  private persistAccount(payload: CreateAccountRequest): void {
    this.isSavingAccount = true;
    this.accountFormError = '';
    this.agentService.createAccount(payload).subscribe({
      next: (created) => {
        this.isSavingAccount = false;
        this.accountForm = null;
        this.accountFormSuccess = `Compte créé : ${created.prenom} ${created.nom} (${created.email}).`;
        this.reloadComptes();
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Create account error:', err);
        this.accountFormError = err.error?.message || 'Erreur lors de la création du compte.';
        this.isSavingAccount = false;
      },
    });
  }

  openEditAccount(c: AgentAccountView): void {
    this.editAccountForm = {
      idAgent: c.idAgent,
      nom: `${c.prenom} ${c.nom}`,
      email: c.email,
      role: c.role,
    };
    this.editAccountError = '';
  }

  closeEditAccount(): void {
    this.editAccountForm = null;
  }

  saveEditAccount(): void {
    if (!this.editAccountForm || this.isSavingEditAccount) return;
    if (!this.editAccountForm.email?.trim() || !this.editAccountForm.role) {
      this.editAccountError = 'Email et rôle obligatoires.';
      return;
    }
    const f = this.editAccountForm;
    this.isSavingEditAccount = true;
    this.editAccountError = '';
    this.agentService.updateAccount(f.idAgent, f.email, f.role).subscribe({
      next: () => {
        this.isSavingEditAccount = false;
        this.editAccountForm = null;
        this.reloadComptes();
      },
      error: (err: { error?: { message?: string } }) => {
        this.editAccountError = err.error?.message || 'Erreur lors de la modification.';
        this.isSavingEditAccount = false;
      },
    });
  }

  confirmDeactivateAgent(a: Agent): void {
    if (!a.idAgent) return;
    const id = a.idAgent;
    this.askConfirm({
      title: 'Désactiver ce compte ?',
      message: 'L\'agent ne pourra plus se connecter. L\'historique (missions, affectations, absences) est préservé.',
      detail: `${a.prenom} ${a.nom} · ${a.email}`,
      level: 'danger',
      confirmLabel: 'Désactiver',
      onConfirm: () => {
        this.agentService.deactivateAgent(id).subscribe({
          next: () => this.reloadAgentsAll(),
          error: (err: { error?: { message?: string } }) => {
            this.askConfirm({
              title: 'Désactivation impossible',
              message: err.error?.message || 'Impossible de désactiver ce compte.',
              level: 'warning',
              confirmLabel: 'OK',
              cancelLabel: 'Fermer',
              onConfirm: () => {},
            });
          },
        });
      },
    });
  }

  /** Le DMG est requis pour cocher "estChauffeur" lors de la création (cf. AuthService backend). */
  get currentUserIsDmg(): boolean {
    const user = this.authService.getUser();
    if (user?.role !== 'DIRECTEUR_DIRECTION') return false;
    return (user.nomDirection || '').toLowerCase().includes('moyens')
        || (user.nomDirection || '').toLowerCase().includes('général');
  }

  // ─── Modale de confirmation réutilisable ──────────────────────────

  /** Ouvre la modale. L'action n'est exécutée que si l'utilisateur clique sur "Confirmer". */
  private askConfirm(config: ConfirmModalConfig): void {
    this.confirmModal = config;
  }

  acceptConfirm(): void {
    const action = this.confirmModal?.onConfirm;
    this.confirmModal = null;
    if (action) action();
  }

  cancelConfirm(): void {
    this.confirmModal = null;
  }

  confirmIconClass(): string {
    return this.confirmModal?.level === 'danger'
      ? 'bg-red-50 text-red-600'
      : 'bg-amber-50 text-amber-600';
  }

  // ─── Directions ─────────────────────────────────────────────────────

  reloadDirections(): void {
    this.directionService.getAllDirections().pipe(
      timeout(8000),
      catchError(() => of([] as Direction[]))
    ).subscribe((list) => (this.directions = list));
  }

  openDirectionForm(): void {
    this.directionForm = { nomDirection: '', sigleDirection: '' };
    this.formError = '';
  }

  editDirection(d: Direction): void {
    this.directionForm = { ...d };
    this.formError = '';
  }

  closeDirectionForm(): void {
    this.directionForm = null;
  }

  saveDirection(): void {
    if (!this.directionForm || this.isSaving) return;
    if (!this.directionForm.nomDirection?.trim()) {
      this.formError = 'Le nom est obligatoire.';
      return;
    }
    // Modification (edit) : confirmation. Création (new) : pas de confirmation (clic déjà explicite).
    if (this.directionForm.idDirection) {
      const snapshot = { ...this.directionForm };
      this.askConfirm({
        title: 'Confirmer les modifications',
        message: 'Cette direction sera mise à jour. Les missions et agents rattachés conservent leur référence.',
        detail: `Direction : ${snapshot.nomDirection}${snapshot.sigleDirection ? ' (' + snapshot.sigleDirection + ')' : ''}`,
        level: 'warning',
        confirmLabel: 'Enregistrer',
        onConfirm: () => this.persistDirection(snapshot),
      });
    } else {
      this.persistDirection(this.directionForm);
    }
  }

  private persistDirection(payload: Direction): void {
    this.isSaving = true;
    this.formError = '';
    const obs = payload.idDirection
      ? this.directionService.updateDirection(payload.idDirection, payload)
      : this.directionService.createDirection(payload);
    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.directionForm = null;
        this.reloadDirections();
      },
      error: (err: { error?: { message?: string } }) => {
        this.formError = err.error?.message || 'Erreur lors de l\'enregistrement.';
        this.isSaving = false;
      },
    });
  }

  confirmDeleteDirection(d: Direction): void {
    if (!d.idDirection) return;
    const id = d.idDirection;
    this.askConfirm({
      title: 'Supprimer cette direction ?',
      message: 'Action définitive et irréversible. La suppression échouera si la direction est encore référencée par une mission, un agent ou un véhicule.',
      detail: `${d.nomDirection}${d.sigleDirection ? ' · ' + d.sigleDirection : ''}`,
      level: 'danger',
      confirmLabel: 'Supprimer définitivement',
      onConfirm: () => {
        this.directionService.deleteDirection(id).subscribe({
          next: () => this.reloadDirections(),
          error: (err: { error?: { message?: string } }) => {
            this.askConfirm({
              title: 'Suppression impossible',
              message: err.error?.message || 'Cette direction est référencée ailleurs et ne peut pas être supprimée.',
              level: 'warning',
              confirmLabel: 'OK',
              cancelLabel: 'Fermer',
              onConfirm: () => {},
            });
          },
        });
      },
    });
  }

  // ─── Véhicules ──────────────────────────────────────────────────────

  reloadVehicules(): void {
    this.vehiculeService.getAllVehicles().pipe(
      timeout(8000),
      catchError(() => of([] as Vehicule[]))
    ).subscribe((list) => (this.vehicules = list));
  }

  openVehiculeForm(): void {
    this.vehiculeForm = {
      immatriculation: '', marque: '', modele: '', typeVehicule: '',
      capacite: 5, statut: 'DISPONIBLE', actif: true,
    };
    this.formError = '';
  }

  editVehicule(v: Vehicule): void {
    this.vehiculeForm = { ...v };
    this.formError = '';
  }

  closeVehiculeForm(): void {
    this.vehiculeForm = null;
  }

  saveVehicule(): void {
    if (!this.vehiculeForm || this.isSaving) return;
    if (!this.vehiculeForm.immatriculation?.trim() || !this.vehiculeForm.marque?.trim() || !this.vehiculeForm.modele?.trim()) {
      this.formError = 'Immatriculation, marque et modèle sont obligatoires.';
      return;
    }
    if (this.vehiculeForm.idVehicule) {
      const snapshot = { ...this.vehiculeForm };
      this.askConfirm({
        title: 'Confirmer les modifications',
        message: 'Les caractéristiques du véhicule seront mises à jour. Les affectations en cours conservent leur référence.',
        detail: `${snapshot.marque} ${snapshot.modele} · ${snapshot.immatriculation}`,
        level: 'warning',
        confirmLabel: 'Enregistrer',
        onConfirm: () => this.persistVehicule(snapshot),
      });
    } else {
      this.persistVehicule(this.vehiculeForm);
    }
  }

  private persistVehicule(payload: Vehicule): void {
    this.isSaving = true;
    this.formError = '';
    const obs = payload.idVehicule
      ? this.vehiculeService.updateVehicle(payload.idVehicule, payload)
      : this.vehiculeService.createVehicle(payload);
    obs.subscribe({
      next: () => {
        this.isSaving = false;
        this.vehiculeForm = null;
        this.reloadVehicules();
      },
      error: (err: { error?: { message?: string } }) => {
        this.formError = err.error?.message || 'Erreur lors de l\'enregistrement.';
        this.isSaving = false;
      },
    });
  }

  confirmDeleteVehicule(v: Vehicule): void {
    if (!v.idVehicule) return;
    const id = v.idVehicule;
    this.askConfirm({
      title: 'Supprimer ce véhicule ?',
      message: 'Action définitive et irréversible. La suppression échouera si le véhicule est référencé par une affectation existante.',
      detail: `${v.marque} ${v.modele} · ${v.immatriculation}`,
      level: 'danger',
      confirmLabel: 'Supprimer définitivement',
      onConfirm: () => {
        this.vehiculeService.deleteVehicle(id).subscribe({
          next: () => this.reloadVehicules(),
          error: (err: { error?: { message?: string } }) => {
            this.askConfirm({
              title: 'Suppression impossible',
              message: err.error?.message || 'Ce véhicule est référencé par une affectation et ne peut pas être supprimé.',
              level: 'warning',
              confirmLabel: 'OK',
              cancelLabel: 'Fermer',
              onConfirm: () => {},
            });
          },
        });
      },
    });
  }

  vehiculeBadge(statut: string | undefined): string {
    switch (statut) {
      case 'DISPONIBLE':     return 'bg-emerald-50 text-emerald-700';
      case 'EN_MISSION':     return 'bg-blue-50 text-blue-700';
      case 'EN_MAINTENANCE': return 'bg-amber-50 text-amber-700';
      case 'HORS_SERVICE':   return 'bg-red-50 text-red-700';
      default:               return 'bg-ink-100 text-ink-700';
    }
  }

  // ─── Institution ────────────────────────────────────────────────────

  reloadConfig(): void {
    this.appConfigService.get().pipe(
      timeout(8000),
      catchError(() => of(null))
    ).subscribe((cfg) => (this.config = cfg));
  }

  saveConfig(): void {
    if (!this.config || this.isSavingConfig) return;
    const snapshot = { ...this.config };
    this.askConfirm({
      title: 'Mettre à jour l\'identité institutionnelle ?',
      message: 'Les nouvelles valeurs apparaîtront immédiatement dans l\'UI et dans les prochaines fiches PDF.',
      detail: `${snapshot.institutionNom} (${snapshot.institutionSigle}) · ${snapshot.institutionPays}`,
      level: 'warning',
      confirmLabel: 'Enregistrer',
      onConfirm: () => this.persistConfig(snapshot),
    });
  }

  private persistConfig(payload: AppConfig): void {
    this.isSavingConfig = true;
    this.configError = '';
    this.configSuccess = '';
    this.appConfigService.update(payload).subscribe({
      next: (updated) => {
        this.config = updated;
        this.isSavingConfig = false;
        this.configSuccess = 'Identité institutionnelle mise à jour. Les prochains PDF refléteront ces valeurs.';
      },
      error: (err: { error?: { message?: string } }) => {
        this.configError = err.error?.message || 'Erreur lors de l\'enregistrement.';
        this.isSavingConfig = false;
      },
    });
  }
}
