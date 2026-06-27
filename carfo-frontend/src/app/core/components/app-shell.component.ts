import { Component, Input, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from './icon.component';
import { AuthService, LoginResponse, UserRole } from '../services/auth.service';
import { NotificationService, NotificationView } from '../services/notification.service';
import { ThemeService } from '../services/theme.service';
import { dropdownEnter, pageEnter } from '../animations/animations';

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
  exact?: boolean;
  /** Rôles autorisés à voir cet item. Si omis ou vide → visible par tous. */
  roles?: UserRole[];
  /** Si true, item visible uniquement pour le DMG (DIRECTEUR_DIRECTION de la Direction des Moyens Généraux). */
  dmgOnly?: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATEUR:      'Administrateur',
  SECRETAIRE_GENERALE: 'Secrétaire Générale',
  DIRECTEUR:           'Directeur',
  DIRECTEUR_DIRECTION: 'Directeur direction',
  CHARGE_ETUDE:        "Chargé d'étude",
  AGENT:               'Agent',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  animations: [pageEnter, dropdownEnter],
  template: `
    <div class="min-h-screen bg-ink-50 flex">
      <!-- ===================== SIDEBAR ===================== -->
      <aside
        class="fixed lg:sticky top-0 left-0 z-40 w-60 h-screen bg-white border-r border-ink-200 flex flex-col shadow-sm transition-transform duration-200 -translate-x-full lg:translate-x-0"
        [class.translate-x-0]="mobileOpen"
      >
        <!-- Logo + nom -->
        <a [routerLink]="['/']" (click)="mobileOpen = false"
           class="flex items-center gap-2 group h-16 px-5 border-b border-ink-200 shrink-0">
          <img src="/images/carfo-logo.png" alt="CARFO"
               class="h-9 w-9 object-contain rounded-lg shadow-sm bg-white" />
          <span class="text-lg font-bold text-ink-900 group-hover:text-carfo-primary transition tracking-tight">
            SYGEM
          </span>
        </a>

        <!-- Nav verticale -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <a
            *ngFor="let item of visibleNavItems"
            [routerLink]="[item.route]"
            (click)="mobileOpen = false"
            routerLinkActive="bg-carfo-50 text-carfo-primary font-semibold"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="px-3 py-2.5 rounded-md text-sm font-medium text-ink-600 hover:bg-white hover:shadow-sm hover:text-ink-900 transition flex items-center gap-3"
          >
            <app-icon [name]="item.icon" [size]="18"></app-icon>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <!-- Pied de sidebar : version -->
        <div class="px-5 py-3 border-t border-ink-200 text-[10px] text-ink-400">
          SYGEM · CARFO
        </div>
      </aside>

      <!-- Backdrop mobile -->
      <div *ngIf="mobileOpen" (click)="mobileOpen = false"
           class="fixed inset-0 bg-black/40 z-30 lg:hidden"></div>

      <!-- ===================== COLONNE PRINCIPALE ===================== -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Topbar -->
        <header class="sticky top-0 z-20 bg-white border-b border-ink-200 shadow-sm h-16 flex items-center">
          <div class="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <!-- Bouton menu mobile -->
            <button
              class="lg:hidden h-9 w-9 items-center justify-center rounded-md text-ink-700 hover:bg-white hover:shadow-sm transition flex"
              (click)="mobileOpen = !mobileOpen"
              [attr.aria-label]="mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
            >
              <app-icon [name]="mobileOpen ? 'x' : 'menu'" [size]="20"></app-icon>
            </button>
            <!-- Titre de page (desktop) -->
            <span class="hidden lg:block text-sm font-semibold text-ink-500 truncate">{{ title }}</span>

            <!-- Right side actions -->
            <div class="flex items-center gap-2">
              <!-- Toggle thème clair/sombre -->
              <button
                type="button"
                (click)="themeService.toggle()"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-white hover:shadow-sm transition"
                [title]="themeService.mode() === 'dark' ? 'Basculer en mode clair' : 'Basculer en mode sombre'"
                [attr.aria-label]="themeService.mode() === 'dark' ? 'Mode clair' : 'Mode sombre'"
              >
                <app-icon [name]="themeService.mode() === 'dark' ? 'sun' : 'moon'" [size]="18"></app-icon>
              </button>

              <!-- Notifications bell + dropdown -->
              <div *ngIf="user" class="relative">
                <button
                  type="button"
                  (click)="toggleNotifs()"
                  class="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:text-ink-900 hover:bg-white hover:shadow-sm transition relative"
                  [class.text-carfo-primary]="notifsOpen"
                  [class.bg-carfo-50]="notifsOpen"
                  title="Notifications"
                  aria-label="Notifications"
                  [attr.aria-expanded]="notifsOpen"
                >
                  <app-icon name="bell" [size]="18"></app-icon>
                  <span
                    *ngIf="notificationService.unreadCount() > 0"
                    class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 ring-2 ring-white text-[10px] font-bold text-white flex items-center justify-center"
                  >
                    {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
                  </span>
                </button>

                <!-- Dropdown -->
                <div
                  *ngIf="notifsOpen"
                  @dropdownEnter
                  class="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-1rem)] carfo-card p-0 shadow-elevated z-40 overflow-hidden"
                >
                  <header class="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-bold text-ink-900 inline-flex items-center gap-2">
                        <app-icon name="bell" [size]="14"></app-icon>
                        <span>Notifications</span>
                      </p>
                      <p class="text-[11px] text-ink-500">
                        {{ notificationService.unreadCount() }} non lue(s)
                      </p>
                    </div>
                    <button
                      *ngIf="notificationService.unreadCount() > 0"
                      type="button"
                      (click)="markAllAsRead()"
                      class="text-[11px] font-semibold text-carfo-primary hover:text-carfo-primary-light"
                    >
                      Tout marquer comme lu
                    </button>
                  </header>

                  <ul *ngIf="notificationService.notifications().length > 0; else emptyNotifs"
                      class="max-h-96 overflow-y-auto divide-y divide-ink-100">
                    <li *ngFor="let n of notificationService.notifications()"
                        class="transition"
                        [class.bg-carfo-50]="!n.lue"
                        [class.hover:bg-ink-50]="n.lue">
                      <button
                        type="button"
                        (click)="openNotif(n)"
                        class="w-full text-left px-4 py-3 flex gap-3 items-start"
                      >
                        <div
                          class="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                          [ngClass]="notifIconBg(n.type)"
                        >
                          <app-icon [name]="notifIcon(n.type)" [size]="14"></app-icon>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-semibold text-ink-900 truncate">{{ n.titre }}</p>
                          <p class="text-xs text-ink-600 line-clamp-2 mt-0.5">{{ n.message }}</p>
                          <p class="text-[10px] text-ink-400 mt-1">{{ formatDate(n.dateCreation) }}</p>
                        </div>
                        <span *ngIf="!n.lue" class="h-2 w-2 rounded-full bg-carfo-primary mt-1.5 shrink-0"></span>
                      </button>
                    </li>
                  </ul>

                  <ng-template #emptyNotifs>
                    <div class="px-4 py-10 text-center">
                      <div class="h-10 w-10 mx-auto rounded-full bg-ink-100 text-ink-400 flex items-center justify-center mb-2">
                        <app-icon name="inbox" [size]="20"></app-icon>
                      </div>
                      <p class="text-sm font-semibold text-ink-700">Aucune notification</p>
                      <p class="text-[11px] text-ink-500">Vous serez prévenu dès qu'une action vous concerne.</p>
                    </div>
                  </ng-template>
                </div>
              </div>

              <!-- Not authenticated -->
              <a
                *ngIf="!user"
                [routerLink]="['/login']"
                class="btn btn-primary text-sm"
              >
                <app-icon name="log-in" [size]="16"></app-icon>
                <span>Connexion</span>
              </a>

              <!-- Authenticated user menu -->
              <div *ngIf="user" class="relative">
                <button
                  type="button"
                  (click)="userMenuOpen = !userMenuOpen"
                  class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-white hover:shadow-sm transition"
                  [attr.aria-expanded]="userMenuOpen"
                >
                  <div class="h-7 w-7 rounded-full bg-carfo-primary text-white flex items-center justify-center text-[11px] font-bold">
                    {{ initials }}
                  </div>
                  <div class="hidden md:flex flex-col items-start leading-tight">
                    <span class="text-xs font-semibold text-ink-900">{{ user.prenom }} {{ user.nom }}</span>
                    <span class="text-[10px] text-ink-500">{{ roleLabel }}</span>
                  </div>
                  <app-icon name="chevron-right" [size]="14" class="text-ink-400 rotate-90"></app-icon>
                </button>

                <!-- Dropdown -->
                <div
                  *ngIf="userMenuOpen"
                  @dropdownEnter
                  class="absolute right-0 top-full mt-2 w-64 carfo-card p-2 shadow-elevated z-40"
                >
                  <div class="px-3 py-3 border-b border-ink-100 mb-1">
                    <p class="text-sm font-bold text-ink-900 truncate">{{ user.prenom }} {{ user.nom }}</p>
                    <p class="text-xs text-ink-500 truncate">{{ user.email }}</p>
                    <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-carfo-50 text-carfo-primary">
                      <app-icon name="shield-check" [size]="10"></app-icon>
                      <span>{{ roleLabel }}</span>
                    </div>
                    <p *ngIf="user.nomDirection" class="text-[11px] text-ink-500 mt-1.5 truncate inline-flex items-center gap-1">
                      <app-icon name="building" [size]="11"></app-icon>
                      <span>{{ user.nomDirection }}</span>
                    </p>
                  </div>

                  <a [routerLink]="['/dashboard']" (click)="userMenuOpen = false" class="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-white hover:shadow-sm transition">
                    <app-icon name="dashboard" [size]="14" class="text-ink-400"></app-icon>
                    <span>Tableau de bord</span>
                  </a>
                  <a [routerLink]="['/agents']" (click)="userMenuOpen = false" class="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-white hover:shadow-sm transition">
                    <app-icon name="user" [size]="14" class="text-ink-400"></app-icon>
                    <span>Annuaire des agents</span>
                  </a>
                  <button
                    type="button"
                    (click)="openLogoutConfirm()"
                    class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition border-t border-ink-100 mt-1 pt-2"
                  >
                    <app-icon name="log-out" [size]="14"></app-icon>
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1">
          <div *ngIf="title || description" class="bg-white border-b border-ink-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 class="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">{{ title }}</h1>
              <p *ngIf="description" class="text-ink-500 mt-1 text-sm sm:text-base">{{ description }}</p>
            </div>
          </div>

          <div @pageEnter class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <ng-content></ng-content>
          </div>
        </main>

        <!-- Footer -->
        <footer class="border-t border-ink-200 bg-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-ink-500">
            © 2026 CARFO — Caisse Autonome de Retraite des Fonctionnaires
          </div>
        </footer>
      </div>
      <!-- /Colonne principale -->

      <!-- Modale confirmation déconnexion -->
      <div
        *ngIf="logoutConfirmOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        (click)="cancelLogout()"
      >
        <div class="carfo-card max-w-md w-full p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-4">
            <div class="h-11 w-11 shrink-0 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <app-icon name="log-out" [size]="20"></app-icon>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-ink-900">Voulez-vous vraiment vous déconnecter ?</h3>
              <p class="text-xs text-ink-500 mt-1">
                Vous serez redirigé vers la page de connexion. Vos notifications non lues resteront disponibles à votre retour.
              </p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 mt-6">
            <button type="button" (click)="cancelLogout()" class="btn btn-secondary">
              <span>Annuler</span>
            </button>
            <button type="button" (click)="confirmLogout()" class="btn btn-danger">
              <app-icon name="log-out" [size]="14"></app-icon>
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppShellComponent implements OnInit, OnDestroy {
  @Input() title?: string;
  @Input() description?: string;

  mobileOpen = false;
  userMenuOpen = false;
  notifsOpen = false;
  logoutConfirmOpen = false;
  user: LoginResponse | null = null;

  /**
   * Matrice de navigation par rôle. `roles` énumère les rôles autorisés à voir
   * l'item (vide = tout le monde). `dmgOnly` restreint en plus aux DIRECTEUR_DIRECTION
   * dont la direction est "Moyens Généraux" (DMG).
   */
  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard',    route: '/dashboard' },
    { label: 'Missions',        icon: 'clipboard',    route: '/missions', exact: true,
      roles: ['ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE'] },
    { label: 'Validation',      icon: 'check-circle', route: '/missions/validation',
      roles: ['ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR'] },
    { label: 'Affectations',    icon: 'car',          route: '/missions/affecter',
      roles: ['ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION'] },
    { label: 'Chauffeurs',      icon: 'user',         route: '/chauffeurs',
      dmgOnly: true, roles: ['ADMINISTRATEUR', 'DIRECTEUR_DIRECTION'] },
    { label: 'Sessions',        icon: 'calendar',     route: '/sessions',
      roles: ['ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE'] },
    { label: 'Statistiques',    icon: 'bar',          route: '/statistiques',
      roles: ['ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE'] },
    { label: 'Agents',          icon: 'users',        route: '/agents',
      roles: ['ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE'] },
    { label: 'Paramètres',      icon: 'settings',     route: '/parametres',
      roles: ['ADMINISTRATEUR'] },
  ];

  /**
   * Items filtrés selon le rôle de l'utilisateur connecté. Le filtrage est purement UI ;
   * les backends restent protégés par @PreAuthorize.
   */
  get visibleNavItems(): NavItem[] {
    if (!this.user) return [];
    const role = this.user.role;
    return this.navItems.filter((item) => {
      // 1. Restriction par liste de rôles
      if (item.roles && !item.roles.includes(role)) return false;
      // 2. Restriction "DMG uniquement" : le DIRECTEUR_DIRECTION doit être celui des Moyens Généraux
      if (item.dmgOnly && role === 'DIRECTEUR_DIRECTION' && !this.isDmg) return false;
      // L'admin voit tout malgré dmgOnly
      return true;
    });
  }

  /** Le DMG est un DIRECTEUR_DIRECTION rattaché à la Direction des Moyens Généraux. */
  get isDmg(): boolean {
    if (!this.user) return false;
    if (this.user.role !== 'DIRECTEUR_DIRECTION') return false;
    const dir = (this.user.nomDirection || '').toLowerCase();
    return dir.includes('moyens') || dir.includes('général');
  }

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    readonly notificationService: NotificationService,
    readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user) {
      this.notificationService.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  get initials(): string {
    if (!this.user) return '';
    return `${(this.user.prenom || '').charAt(0)}${(this.user.nom || '').charAt(0)}`.toUpperCase();
  }

  get roleLabel(): string {
    if (!this.user) return '';
    return ROLE_LABEL[this.user.role] ?? this.user.role;
  }

  openLogoutConfirm(): void {
    this.userMenuOpen = false;
    this.logoutConfirmOpen = true;
  }

  cancelLogout(): void {
    this.logoutConfirmOpen = false;
  }

  confirmLogout(): void {
    this.logoutConfirmOpen = false;
    this.logout();
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.reset();
    this.userMenuOpen = false;
    this.user = null;
    this.router.navigateByUrl('/login');
  }

  // ============================================================
  // Notifications
  // ============================================================

  toggleNotifs(): void {
    this.notifsOpen = !this.notifsOpen;
    if (this.notifsOpen) {
      this.userMenuOpen = false;
      this.notificationService.refreshAll();
    }
  }

  openNotif(n: NotificationView): void {
    if (!n.lue) {
      this.notificationService.markAsRead(n.idNotification).subscribe();
    }
    this.notifsOpen = false;
    if (n.idMission) {
      this.router.navigate(['/missions', n.idMission]);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  notifIcon(type: NotificationView['type']): IconName {
    switch (type) {
      case 'MISSION_SOUMISE':       return 'clipboard';
      case 'MISSION_VALIDEE':       return 'check-circle';
      case 'MISSION_ANNULEE':       return 'x-circle';
      case 'MISSION_CLOTUREE':      return 'flag';
      case 'AFFECTATION_CREEE':     return 'route';
      case 'AFFECTATION_SUPPRIMEE': return 'trash';
      case 'ABSENCE_DECLAREE':      return 'calendar';
      default:                      return 'bell';
    }
  }

  notifIconBg(type: NotificationView['type']): string {
    switch (type) {
      case 'MISSION_SOUMISE':       return 'bg-amber-50 text-amber-700';
      case 'MISSION_VALIDEE':       return 'bg-blue-50 text-blue-700';
      case 'MISSION_ANNULEE':       return 'bg-red-50 text-red-700';
      case 'MISSION_CLOTUREE':      return 'bg-ink-100 text-ink-700';
      case 'AFFECTATION_CREEE':     return 'bg-carfo-50 text-carfo-primary';
      case 'AFFECTATION_SUPPRIMEE': return 'bg-red-50 text-red-700';
      case 'ABSENCE_DECLAREE':      return 'bg-amber-50 text-amber-700';
      default:                      return 'bg-ink-100 text-ink-700';
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // Close dropdowns on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen && !this.notifsOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('[aria-expanded]') && !target.closest('.carfo-card')) {
      this.userMenuOpen = false;
      this.notifsOpen = false;
    }
  }
}
