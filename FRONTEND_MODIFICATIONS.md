# Modifications Frontend - Phase 2 (Directions & Agents)

## Services Créés

### 1. **AuthService** (`src/app/core/services/auth.service.ts`)
- Gestion de l'authentification (login, register, logout)
- Stockage du token JWT en localStorage
- Observable pour le suivi de l'utilisateur actif
- Méthodes de vérification de rôles

### 2. **DirectionService** (`src/app/core/services/direction.service.ts`)
- CRUD complet pour les directions
- Endpoints: GET, POST, PUT, DELETE
- Interfaces: Direction, DirectionRequest

### 3. **AgentService** (`src/app/core/services/agent.service.ts`)
- CRUD et gestion des agents
- Endpoints spécialisés: getAllChauffeurs, getAgentsByDirection, deactivateAgent
- Enums: RoleAgent (ADMINISTRATEUR, CHARGE_ETUDE, AGENT)
- Interface: Agent, AgentUpdateRequest

### 4. **MissionService** (`src/app/core/services/mission.service.ts`)
- Gestion complète des missions
- Filtrage par statut, direction, dates
- Endpoints: soumettre, valider, compléter, annuler
- Enums: StatutMission

### 5. **VehiculeService** (`src/app/core/services/vehicule.service.ts`)
- Gestion des véhicules
- Statuts: DISPONIBLE, EN_MISSION, EN_MAINTENANCE, HORS_SERVICE
- Endpoint: getDisponibleVehicules

### 6. **AbsenceService** (`src/app/core/services/absence.service.ts`)
- Gestion des absences
- Endpoints: approver, rejeter
- Filtre par agent

## Composants Créés

### 1. **DirectionsComponent** (`src/app/pages/directions/directions.component.ts`)
- Tableau des directions avec pagination
- Dialog pour créer/modifier
- Actions: éditer, supprimer
- Validation des doublons côté serveur

### 2. **AgentsComponent** (`src/app/pages/agents/agents.component.ts`)
- Gestion complète des agents
- Tableau avec filtrage et tri
- Dialog de création/modification
- Checkbox pour: Chauffeur, Actif
- Tags pour affichage des rôles et statuts
- Désactivation avec confirmation

### 3. **LoginComponent** (`src/app/pages/auth/login/login.component.ts`)
- Page de connexion professionnelle
- Logo CARFO avec fallback
- Styling hero gradient
- Validation des identifiants

## Intercepteurs

### **JwtInterceptor** (`src/app/core/interceptors/jwt.interceptor.ts`)
- Ajoute automatiquement le token JWT aux requêtes
- Récupère le token depuis localStorage
- Injecte l'en-tête Authorization

## Guards de Routage

### **authGuard** (`src/app/core/guards/auth.guard.ts`)
- Protège les routes authentifiées
- Redirige vers /login si non authentifié

### **roleGuard** (`src/app/core/guards/auth.guard.ts`)
- Contrôle d'accès basé sur les rôles
- Paramètre: rôles autorisés

## Modifications de Configuration

### **app.routes.ts**
- Route /login (publique)
- Routes protégées avec authGuard
- Role-based access:
  - /directions → ADMINISTRATEUR seulement
  - /agents → ADMINISTRATEUR, CHARGE_ETUDE
  - Autres routes disponibles pour tous authentifiés

### **app.config.ts**
- Injection du JwtInterceptor
- Configuration HTTP avec withFetch

### **app.menu.ts**
- Affichage conditionnel des menus basé sur les rôles
- Directions visible pour ADMINISTRATEUR uniquement
- Agents visible pour ADMINISTRATEUR et CHARGE_ETUDE

### **app.topbar.ts**
- Menu utilisateur avec profil et déconnexion
- Affichage du nom d'utilisateur connecté
- Logo CARFO avec fallback

## Fichiers d'Environnement

### **environment.ts**
- apiUrl: `http://localhost:8080` (sans /api dans l'URL de base)

## Styles et Thème

- Couleurs CARFO intégrées (--carfo-primary, --carfo-secondary, --carfo-accent)
- Responsive design avec Tailwind CSS
- Glassmorphism pour les dialogues
- Tags PrimeNG pour affichage des statuts

## Compilation

✅ **Build réussi**
- Bundle initial: 1.21 MB (main)
- Styles: 34.43 kB
- Transfer size: 237.31 kB
- Avertissement: Budget dépassé (normal avec PrimeNG et Angular)

## Prochaines Étapes

1. **Integration Tests**: Créer tests avec @WebMvcTest
2. **Phase 3**: Implémenter les missions complètes
3. **Postman Collection**: Générer pour tests manuels
4. **Frontend Pages**: Créer pages pour missions, véhicules, absences
