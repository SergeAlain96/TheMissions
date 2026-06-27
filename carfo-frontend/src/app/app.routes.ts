import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'statistiques',
    loadComponent: () => import('./pages/statistics/statistics.component').then((m) => m.StatisticsComponent),
  },
  {
    path: 'sessions',
    loadComponent: () => import('./pages/sessions/sessions.component').then((m) => m.SessionsComponent),
  },
  {
    path: 'parametres',
    loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'missions',
    loadComponent: () => import('./pages/missions/missions.component').then((m) => m.MissionsComponent),
  },
  {
    path: 'missions/creer',
    loadComponent: () => import('./pages/missions/mission-create.component').then((m) => m.MissionCreateComponent),
  },
  {
    path: 'missions/validation',
    loadComponent: () => import('./pages/missions/mission-validation-list.component').then((m) => m.MissionValidationListComponent),
  },
  {
    path: 'missions/valider/:id',
    loadComponent: () => import('./pages/missions/mission-validate.component').then((m) => m.MissionValidateComponent),
  },
  {
    path: 'missions/affecter',
    loadComponent: () => import('./pages/missions/mission-affectation-list.component').then((m) => m.MissionAffectationListComponent),
  },
  {
    path: 'missions/affecter/:id',
    loadComponent: () => import('./pages/missions/mission-affectation-form.component').then((m) => m.MissionAffectationFormComponent),
  },
  {
    path: 'missions/:id',
    loadComponent: () => import('./pages/missions/mission-detail.component').then((m) => m.MissionDetailComponent),
  },
  {
    path: 'agents',
    loadComponent: () => import('./pages/agents/agents.component').then((m) => m.AgentsComponent),
  },
  {
    path: 'agents/creer',
    loadComponent: () => import('./pages/agents/agent-form.component').then((m) => m.AgentFormComponent),
  },
  {
    path: 'agents/:id/edit',
    loadComponent: () => import('./pages/agents/agent-form.component').then((m) => m.AgentFormComponent),
  },
  {
    path: 'chauffeurs',
    loadComponent: () => import('./pages/chauffeurs/chauffeurs-dmg.component').then((m) => m.ChauffeursDmgComponent),
  },
  {
    path: 'absences',
    loadComponent: () => import('./pages/absences/absences.component').then((m) => m.AbsencesComponent),
  },
  {
    path: 'directions',
    loadComponent: () => import('./pages/directions/directions.component').then((m) => m.DirectionsComponent),
  },
  { path: '**', redirectTo: '' },
];
