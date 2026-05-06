# 🗺️ Feuille de Route — Application CARFO
## Suivi des Prévisions des Missions du Personnel
> **Stack :** Spring Boot · Angular · MySQL  
> **Période de stage :** 16 mars – 15 juin 2026

---

## ✅ PHASE 1 — Authentification
> Statut : **TERMINÉE**

- [x] Entité `Agent` avec `UserDetails` Spring Security
- [x] Génération automatique du username (`1ère lettre NOM + 1er PRENOM`)
- [x] Encodage mot de passe avec BCrypt
- [x] Génération du token JWT à la connexion
- [x] Filtre HTTP `JwtAuthFilter` (vérifie le token à chaque requête)
- [x] Contrôle d'accès par rôle avec `@PreAuthorize`
- [x] Endpoints : `POST /api/auth/login` et `POST /api/auth/register`
- [x] Gestion des doublons de username (`YANGELO` → `YANGELO2`...)

---

## 🔵 PHASE 2 — Gestion des Directions & Agents
> Statut : **TERMINÉE**

### 2.1 Directions
- [x] `GET /api/directions` — Lister toutes les directions
- [x] `GET /api/directions/{id}` — Détail d'une direction
- [x] `POST /api/directions` — Créer une direction *(Admin)*
- [x] `PUT /api/directions/{id}` — Modifier une direction *(Admin)*
- [x] `DELETE /api/directions/{id}` — Supprimer une direction *(Admin)*

### 2.2 Agents
- [x] `GET /api/agents` — Lister tous les agents *(Admin, Chargé Étude)*
- [x] `GET /api/agents/{id}` — Détail d'un agent
- [x] `GET /api/agents/chauffeurs` — Lister uniquement les chauffeurs
- [x] `GET /api/agents/direction/{id}` — Agents d'une direction
- [x] `PUT /api/agents/{id}` — Modifier un agent *(Admin)*
- [x] `PATCH /api/agents/{id}/desactiver` — Désactiver un compte *(Admin)*
- [x] Service `AgentService` avec toute la logique métier
- [x] Controller `AgentController`

---

## 🔵 PHASE 3 — Gestion des Missions
> Statut : **PARTIELLEMENT FAIT** (service + controller de base créés)

### 3.1 CRUD Missions
- [x] Entité `Mission` avec statuts (PREVUE, INITIEE, ANNULEE, CLOTUREE)
- [x] Règle des **10 jours d'anticipation** minimum
- [x] `POST /api/missions/soumettre` — Soumettre une mission
- [x] `PATCH /api/missions/{id}/valider` — Valider *(Secrétaire Générale)*
- [x] `PATCH /api/missions/{id}/annuler` — Annuler avec motif
- [x] `PATCH /api/missions/{id}/cloturer` — Clôturer + libérer véhicule
- [x] `GET /api/missions` — Lister avec filtres (statut, direction, date)
- [x] `GET /api/missions/{id}` — Détail complet avec participants + affectation
- [x] `PUT /api/missions/{id}` — Modifier une mission *(avant validation)*
- [x] Vérification des **chevauchements de dates** avant soumission

### 3.2 Participants
- [x] `POST /api/missions/{id}/participants` — Ajouter un participant
- [x] `DELETE /api/missions/{id}/participants/{idAgent}` — Retirer un participant
- [x] `GET /api/missions/{id}/participants` — Lister les participants

### 3.3 Génération de la Fiche de Mission (PDF)
- [x] Ajouter dépendance **iText** ou **JasperReports** dans `pom.xml`
- [x] Créer `FicheMissionService` qui génère le PDF
- [x] `GET /api/missions/{id}/fiche` — Télécharger la fiche PDF
- [x] La fiche doit contenir : objet, dates, lieu, participants, chauffeur, véhicule

---

## 🔵 PHASE 4 — Gestion des Véhicules
> Statut : **TERMINÉE**

- [x] `GET /api/vehicules` — Lister tous les véhicules
- [x] `GET /api/vehicules/disponibles` — Véhicules disponibles seulement
- [x] `POST /api/vehicules` — Ajouter un véhicule *(Chargé Étude, Admin)*
- [x] `PUT /api/vehicules/{id}` — Modifier un véhicule
- [x] `PATCH /api/vehicules/{id}/maintenance` — Mettre en maintenance
- [x] `DELETE /api/vehicules/{id}` — Supprimer *(si jamais utilisé)*
- [x] Service `VehiculeService`
- [x] Controller `VehiculeController`

---

## 🔵 PHASE 5 — Affectation Chauffeur & Véhicule
> Statut : **TERMINÉE**

- [x] Entité `Affectation` (Mission ↔ Chauffeur ↔ Véhicule)
- [x] `POST /api/missions/{id}/affecter` — Affecter chauffeur + véhicule
- [x] Vérification disponibilité du véhicule avant affectation
- [x] Libération automatique du véhicule à la clôture
- [x] Vérification qu'un chauffeur n'est pas déjà en mission sur les mêmes dates
- [x] Vérification qu'un chauffeur n'est pas en **absence approuvée** sur ces dates
- [x] `GET /api/affectations/chauffeur/{id}` — Missions d'un chauffeur
- [x] `DELETE /api/missions/{id}/affectation` — Annuler une affectation
- [x] Interface Missions Angular pour affecter / retirer chauffeur et véhicule

---

## � PHASE 6 — Gestion des Absences
> Statut : **TERMINÉE**

- [x] `GET /api/absences` — Lister toutes les absences *(Chargé Étude, Admin)*
- [x] `GET /api/absences/agent/{id}` — Absences d'un agent
- [x] `POST /api/absences` — Déclarer une absence
- [x] `PATCH /api/absences/{id}/approuver` — Approuver *(Chargé Étude)*
- [x] `PATCH /api/absences/{id}/rejeter` — Rejeter avec motif
- [x] `DELETE /api/absences/{id}` — Supprimer une absence
- [x] Service `AbsenceService`
- [x] Controller `AbsenceController` avec @PreAuthorize
- [x] Frontend UI `AbsencesComponent` avec list, create/edit, approve/reject, delete
- [x] Blocage affectation si le chauffeur est en absence approuvée
- [x] Routes et menu intégrés

---

## � PHASE 7 — Tableau de Bord & Statistiques
> Statut : **TERMINÉE**

- [x] `GET /api/dashboard/stats` — Statistiques globales de l'année
  - Nombre total de missions
  - Nombre de missions par statut
  - Nombre de missions par direction
  - Chauffeur le plus sollicité
  - Véhicule le plus utilisé
- [x] `GET /api/dashboard/stats/year` — Filtrer par année
- [x] `GET /api/dashboard/missions-en-cours` — Missions des 7 prochains jours
- [x] Service `DashboardService` backend avec requêtes JPQL d'agrégation
- [x] Controller `DashboardController` avec @PreAuthorize
- [x] Frontend `DashboardComponent` avec statistiques, cartes, et charts
- [x] Charts PrimeNG : Doughnut (statuts), Bar (directions)

---

## 🔵 PHASE 8 — Gestion des Erreurs & Qualité
> Statut : **À FAIRE**

- [ ] Créer `GlobalExceptionHandler` avec `@ControllerAdvice`
  - Gérer `RuntimeException` → HTTP 400
  - Gérer `AccessDeniedException` → HTTP 403
  - Gérer `EntityNotFoundException` → HTTP 404
  - Retourner des messages d'erreur clairs en JSON
- [x] Créer exceptions métier personnalisées
  - `MissionNotFoundException`
  - `DelaiInsuffisantException`
  - `VehiculeIndisponibleException`
  - `ChauffeurIndisponibleException`
- [x] Améliorer GlobalExceptionHandler avec
  - Handlers dédiés pour chaque type d'exception
  - Réponse JSON standardisée (timestamp, status, error, title, message)
  - Support MethodArgumentNotValidException avec détail des erreurs
  - Gestion authentification (BadCredentialsException, UsernameNotFoundException)
- [x] Ajouter des logs dans les services (`@Slf4j`)
  - [x] DashboardService
  - [x] MissionService
  - [x] VehiculeService
  - [x] AbsenceService
- [ ] Remplacer les `RuntimeException` par les exceptions métier dans les services
- [ ] Ajouter la validation `@Valid` sur tous les DTOs

---

## 🔵 PHASE 9 — Frontend Angular
> Statut : **À FAIRE APRÈS LE BACKEND**

### 9.1 Mise en place
- [ ] Créer le projet Angular : `ng new carfo-frontend`
- [ ] Installer Angular Material : `ng add @angular/material`
- [ ] Configurer `HttpClient` et l'intercepteur JWT
- [ ] Configurer le routeur Angular (`app.routes.ts`)
- [ ] Créer le service `AuthService` Angular (login, logout, token)
- [ ] Créer le `Guard` pour protéger les routes privées

### 9.2 Pages à créer
- [ ] Page **Login** (formulaire username + mot de passe)
- [ ] Page **Dashboard** (statistiques, graphiques)
- [ ] Page **Liste des Missions** (tableau avec filtres)
- [ ] Page **Détail Mission** (infos + participants + affectation)
- [ ] Page **Nouvelle Mission** (formulaire de soumission)
- [ ] Page **Gestion Agents** (liste + ajout + modification)
- [ ] Page **Gestion Véhicules** (liste + statuts)
- [ ] Page **Gestion Absences** (liste + validation)
- [ ] Page **Profil Agent** (infos personnelles)

### 9.3 Composants partagés
- [ ] Barre de navigation avec rôle affiché
- [ ] Composant tableau générique réutilisable
- [ ] Composant badge de statut coloré (PREVUE=orange, INITIEE=bleu...)
- [ ] Modale de confirmation (annulation, suppression)
- [ ] Composant de téléchargement PDF fiche mission

---

## 🔵 PHASE 10 — Tests & Livraison
> Statut : **À FAIRE EN DERNIER**

- [ ] Tester tous les endpoints avec **Postman**
- [ ] Créer une collection Postman exportable
- [ ] Tests unitaires sur `MissionService` (règle des 10 jours, transitions)
- [ ] Tests d'intégration sur `AuthController`
- [ ] Vérifier la sécurité : tester les accès refusés (HTTP 403)
- [ ] Rédiger le **rapport de stage**
- [ ] Préparer la **soutenance**

---

## 📊 Avancement global

| Phase | Description | Avancement |
|---|---|---|
| 1 | Authentification | ✅ 100% |
| 2 | Directions & Agents | ✅ 100% |
| 3 | Missions | 🟡 75% |
| 4 | Véhicules | ✅ 100% |
| 5 | Affectations | ✅ 100% |
| 6 | Absences | ⬜ 0% |
| 7 | Tableau de bord | ⬜ 0% |
| 8 | Gestion des erreurs | ⬜ 0% |
| 9 | Frontend Angular | ⬜ 0% |
| 10 | Tests & Livraison | ⬜ 0% |

---

> 📅 **Prochaine étape recommandée :** Phase 3 — Gestion des Missions
