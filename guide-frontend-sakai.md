# 🎨 Guide Frontend — Sakai-NG pour CARFO
## Template Angular PrimeNG — Installation & Adaptation

> **Template :** Sakai-NG (officiel PrimeNG)  
> **Licence :** MIT — 100% Gratuit  
> **Angular :** v21  
> **Lien GitHub :** https://github.com/primefaces/sakai-ng  
> **Demo live :** https://sakai.primeng.org

---

## 📋 Prérequis

Avant de commencer, vérifiez que vous avez installé :

```bash
node --version     # v18 ou plus récent
npm --version      # v9 ou plus récent
ng version         # Angular CLI installé
```

Si Angular CLI n'est pas installé :
```bash
npm install -g @angular/cli
```

---

## 🚀 ÉTAPE 1 — Télécharger le template

```bash
# Cloner le template depuis GitHub
git clone https://github.com/primefaces/sakai-ng.git carfo-frontend

# Entrer dans le dossier
cd carfo-frontend
```

---

## 📦 ÉTAPE 2 — Installer les dépendances

```bash
npm install
```

> ⏳ Cette étape peut prendre 2 à 5 minutes selon votre connexion.

---

## ▶️ ÉTAPE 3 — Lancer et vérifier

```bash
ng serve
```

Ouvrir votre navigateur sur : **http://localhost:4200**

Vous devriez voir le dashboard Sakai avec un menu latéral, des graphiques et des cartes de statistiques. C'est votre point de départ !

---

## 🔧 ÉTAPE 4 — Personnaliser pour CARFO

### 4.1 Changer le nom de l'application

Ouvrir le fichier :
```
src/app/layout/components/app.topbar.ts
```

Trouver et remplacer :
```typescript
// AVANT
<span class="font-semibold text-2xl">Sakai</span>

// APRÈS
<span class="font-semibold text-2xl">CARFO — Gestion des Missions</span>
```

---

### 4.2 Modifier le menu de navigation

Ouvrir le fichier :
```
src/app/layout/components/app.menu.ts
```

Remplacer tout le contenu du tableau `model` par :

```typescript
this.model = [
  {
    label: 'Tableau de bord',
    items: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/dashboard']
      }
    ]
  },
  {
    label: 'Missions',
    items: [
      {
        label: 'Liste des missions',
        icon: 'pi pi-list',
        routerLink: ['/missions']
      },
      {
        label: 'Nouvelle mission',
        icon: 'pi pi-plus',
        routerLink: ['/missions/nouvelle']
      }
    ]
  },
  {
    label: 'Ressources',
    items: [
      {
        label: 'Agents',
        icon: 'pi pi-users',
        routerLink: ['/agents']
      },
      {
        label: 'Véhicules',
        icon: 'pi pi-car',
        routerLink: ['/vehicules']
      },
      {
        label: 'Absences',
        icon: 'pi pi-calendar-times',
        routerLink: ['/absences']
      }
    ]
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Directions',
        icon: 'pi pi-building',
        routerLink: ['/directions']
      },
      {
        label: 'Mon profil',
        icon: 'pi pi-user',
        routerLink: ['/profil']
      }
    ]
  }
];
```

---

### 4.3 Configurer l'URL du backend Spring Boot

Créer le fichier :
```
src/environments/environment.ts
```

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // URL de votre backend Spring Boot
};
```

---

## 🔌 ÉTAPE 5 — Connecter Angular au Backend

### 5.1 Générer les services

```bash
# Service d'authentification
ng generate service services/auth

# Service missions
ng generate service services/mission

# Service agents
ng generate service services/agent

# Service véhicules
ng generate service services/vehicule

# Service absences
ng generate service services/absence
```

---

### 5.2 Créer le service Auth (connexion JWT)

Ouvrir : `src/app/services/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // Connexion : envoie username + motDePasse, reçoit le token JWT
  login(username: string, motDePasse: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, {
      username,
      motDePasse
    });
  }

  // Sauvegarder le token après connexion
  sauvegarderToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Récupérer le token pour les requêtes suivantes
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Vérifier si l'utilisateur est connecté
  estConnecte(): boolean {
    return !!this.getToken();
  }

  // Déconnexion
  deconnexion() {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }
}
```

---

### 5.3 Créer l'intercepteur JWT

L'intercepteur ajoute **automatiquement** le token JWT à chaque requête HTTP.

```bash
ng generate interceptor interceptors/jwt
```

Ouvrir : `src/app/interceptors/jwt.interceptor.ts`

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si un token existe, l'ajouter dans l'en-tête Authorization
  if (token) {
    const reqAvecToken = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`  // Format attendu par Spring Boot
      }
    });
    return next(reqAvecToken);
  }

  return next(req);
};
```

Enregistrer l'intercepteur dans `app.config.ts` :

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([jwtInterceptor])),
    // ... autres providers
  ]
};
```

---

### 5.4 Créer le Guard de protection des routes

Le Guard empêche un utilisateur non connecté d'accéder aux pages privées.

```bash
ng generate guard guards/auth
```

Ouvrir : `src/app/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estConnecte()) {
    return true;  // Autorisé : l'utilisateur est connecté
  }

  // Refusé : rediriger vers la page de connexion
  router.navigate(['/auth/login']);
  return false;
};
```

---

## 📁 ÉTAPE 6 — Générer les pages

```bash
# Dashboard
ng generate component pages/dashboard

# Missions
ng generate component pages/missions/liste-missions
ng generate component pages/missions/detail-mission
ng generate component pages/missions/nouvelle-mission

# Agents
ng generate component pages/agents/liste-agents

# Véhicules
ng generate component pages/vehicules/liste-vehicules

# Absences
ng generate component pages/absences/liste-absences

# Auth
ng generate component pages/auth/login
```

---

## 🗂️ Structure finale du projet

```
carfo-frontend/
├── src/
│   └── app/
│       ├── layout/                  ← Structure Sakai (menu, topbar)
│       │   └── components/
│       │       ├── app.menu.ts      ← ✏️ Modifier (Étape 4.2)
│       │       └── app.topbar.ts   ← ✏️ Modifier (Étape 4.1)
│       ├── pages/
│       │   ├── auth/
│       │   │   └── login/          ← Page de connexion
│       │   ├── dashboard/          ← Tableau de bord + stats
│       │   ├── missions/
│       │   │   ├── liste-missions/ ← Tableau des missions
│       │   │   ├── detail-mission/ ← Détail + participants
│       │   │   └── nouvelle-mission/ ← Formulaire
│       │   ├── agents/             ← Gestion agents
│       │   ├── vehicules/          ← Gestion véhicules
│       │   └── absences/           ← Gestion absences
│       ├── services/
│       │   ├── auth.service.ts     ← ✏️ Créer (Étape 5.2)
│       │   ├── mission.service.ts
│       │   ├── agent.service.ts
│       │   ├── vehicule.service.ts
│       │   └── absence.service.ts
│       ├── interceptors/
│       │   └── jwt.interceptor.ts  ← ✏️ Créer (Étape 5.3)
│       ├── guards/
│       │   └── auth.guard.ts       ← ✏️ Créer (Étape 5.4)
│       └── environments/
│           └── environment.ts      ← ✏️ Créer (Étape 4.3)
```

---

## ✅ Récapitulatif des étapes

| # | Étape | Statut |
|---|---|---|
| 1 | Cloner le template Sakai-NG | ⬜ À faire |
| 2 | `npm install` | ⬜ À faire |
| 3 | `ng serve` — vérifier que ça marche | ⬜ À faire |
| 4 | Personnaliser nom + menu | ⬜ À faire |
| 5 | Configurer `environment.ts` | ⬜ À faire |
| 6 | Créer les services (auth, mission...) | ⬜ À faire |
| 7 | Créer l'intercepteur JWT | ⬜ À faire |
| 8 | Créer le Guard de protection | ⬜ À faire |
| 9 | Générer les pages | ⬜ À faire |

---

## 🔗 Ressources utiles

| Ressource | Lien |
|---|---|
| 📥 GitHub Sakai-NG | https://github.com/primefaces/sakai-ng |
| 👁️ Demo live | https://sakai.primeng.org |
| 📚 Doc PrimeNG (composants) | https://primeng.org |
| 🎨 Icônes PrimeIcons | https://primeng.org/icons |
| 📐 PrimeFlex (CSS utilitaire) | https://primeflex.org |
