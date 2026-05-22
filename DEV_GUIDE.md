# Guide développeur CARFO

Ce guide explique **comment ajouter des agents** et **comment coder les permissions** dans le projet (backend Spring Boot + frontend Angular).

---

## 1. Ajouter des agents

Tu as trois façons d'ajouter un agent selon le contexte.

### 1.1 Compte de test (recommandé en développement)

Ajoute une ligne dans [`DataInitializer.seedTestAgents()`](carfo-backend/src/main/java/com/carfo/gestion_missions/config/DataInitializer.java). Le seeding est **idempotent** : un compte n'est créé que si son email **et** son matricule n'existent pas déjà.

```java
created += tryCreate(agent(
    "NOM_MAJUSCULES",         // nom
    "Prénom",                 // prenom
    "MAT123",                 // matricule (unique)
    "PNOM",                   // username (unique, en MAJ)
    "prenom.nom@carfo.bf",    // email (unique)
    hash,                     // mot de passe BCrypt — utilise la variable `hash` déjà calculée
    "Comptable",              // fonction
    "+22670000099",           // telephone
    RoleAgent.AGENT,          // rôle (cf. section 2.1)
    false,                    // estChauffeur
    dirs.get("DF")            // direction (sigle : "DG", "DF", "DRH", "DT", "DSI", "DMG")
));
```

Puis **redémarre le backend** (`Ctrl+C` puis `mvn spring-boot:run`). Le mot de passe par défaut est `carfo123` (constante `DEFAULT_TEST_PASSWORD` en haut du `DataInitializer`).

⚠️ N'oublie pas de documenter le nouveau compte dans [`TEST_ACCOUNTS.md`](TEST_ACCOUNTS.md).

### 1.2 Création utilisateur en production — via l'API

L'endpoint d'inscription est `POST /api/auth/register`. Le username est **généré automatiquement** (1ʳᵉ lettre du nom + 1ᵉʳ prénom, avec suffixe numérique si conflit), et le mot de passe est BCrypt-hashé côté serveur.

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "DIALLO",
    "prenom": "Aminata",
    "matricule": "AG999",
    "email": "aminata.diallo@carfo.bf",
    "motDePasse": "monMotDePasse123",
    "role": "CHARGE_ETUDE",
    "idDirection": 1,
    "fonction": "Chargée d''étude",
    "telephone": "+22670111222",
    "estChauffeur": false
  }'
```

Règles métier appliquées par `AuthService.register()` :
- `email` et `matricule` doivent être uniques
- Si `estChauffeur = true`, **seul le DMG connecté peut créer ce compte** (voir `isCurrentUserDmg()`)
- La direction (`idDirection`) doit exister en base

### 1.3 Insertion SQL directe (cas d'urgence uniquement)

Pré-requis : générer un hash BCrypt du mot de passe. Le plus simple est d'utiliser un compte existant comme référence — tous les comptes de test partagent le même hash de `carfo123` :

```sql
-- Récupérer un hash de référence
SELECT mot_de_passe FROM agent WHERE email = 'admin@carfo.bf';
-- Copier le hash et l'utiliser ci-dessous
INSERT INTO agent
  (nom, prenom, matricule, username, email, mot_de_passe, fonction, telephone, role, est_chauffeur, actif, id_direction)
VALUES
  ('ALAIN', 'SERGE', 'AG888', 'MDUPONT', 'serge.alaint@carfo.bf',
   '$2a$10$....hash_copié....', 'Auditeur', '+22670000088',
   'AGENT', FALSE, TRUE, 1);
```

À n'utiliser que si l'application est en panne ou si tu importes un export externe.

---

## 2. Système de permissions

### 2.1 Les 6 rôles disponibles

Enum [`RoleAgent`](carfo-backend/src/main/java/com/carfo/gestion_missions/enums/RoleAgent.java) :

| Rôle | Description | Responsabilités métier |
|------|-------------|------------------------|
| `ADMINISTRATEUR` | DSI / super-utilisateur | Tout faire |
| `SECRETAIRE_GENERALE` | Secrétariat Général | Valider / annuler les missions |
| `DIRECTEUR` | Directeur Général Adjoint | Consultation transversale |
| `DIRECTEUR_DIRECTION` | Directeur d'une direction | Soumettre les missions de sa direction. **Si rattaché à la direction DMG** → affecter chauffeurs/véhicules, créer les comptes chauffeurs |
| `CHARGE_ETUDE` | Chargé d'étude | Gérer les absences |
| `AGENT` | Agent simple / chauffeur | Participant aux missions (passif) |

> Note métier : **le DMG est un `DIRECTEUR_DIRECTION` rattaché à la direction de sigle `DMG`** (Direction des Moyens Généraux). Voir [`acteurs-roles.md`](../.claude/projects/c--Users-PC-Desktop-STAGE-CARFO-TheMissions/memory/acteurs-roles.md) côté mémoire projet, ou la classe [`SecurityChecker`](carfo-backend/src/main/java/com/carfo/gestion_missions/security/SecurityChecker.java).

### 2.2 Les deux patterns de `@PreAuthorize`

Toutes les méthodes de contrôleur sont protégées par `@PreAuthorize`. Tu rencontres deux patterns dans le code :

**Pattern 1 — liste de rôles (cas standard)**

```java
@GetMapping
@PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR_DIRECTION')")
public ResponseEntity<List<Mission>> getAllMissions() { ... }
```

Convention : pour les endpoints **lecture** ouverts à plusieurs profils décisionnels, on extrait une constante en tête de classe pour ne pas se répéter :

```java
private static final String READ_ROLES =
    "hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')";

@GetMapping
@PreAuthorize(READ_ROLES)
public ResponseEntity<...> getAll() { ... }
```

Voir [`AgentController`](carfo-backend/src/main/java/com/carfo/gestion_missions/controller/AgentController.java) et [`VehiculeController`](carfo-backend/src/main/java/com/carfo/gestion_missions/controller/VehiculeController.java) pour des exemples.

**Pattern 2 — vérification conditionnelle (rôle + autre critère)**

Quand un rôle seul ne suffit pas (ex : « DIRECTEUR_DIRECTION **mais uniquement le DMG** »), on utilise le bean [`SecurityChecker`](carfo-backend/src/main/java/com/carfo/gestion_missions/security/SecurityChecker.java) :

```java
@PostMapping
@PreAuthorize("@securityChecker.isDmgOrAdmin()")
public ResponseEntity<...> createAffectation(...) { ... }
```

Spring résout `@securityChecker` comme un bean Spring et appelle la méthode publique correspondante. Tout `boolean` est utilisable.

### 2.3 Méthodes existantes dans `SecurityChecker`

```java
@Component("securityChecker")
public class SecurityChecker {
    public boolean isDmg()              // DIRECTEUR_DIRECTION rattaché à la direction DMG
    public boolean isAdmin()            // ROLE_ADMINISTRATEUR
    public boolean isDmgOrAdmin()       // DMG OU admin
    public Optional<Agent> getCurrentAgent()  // Agent connecté (Optional vide si pas auth)
}
```

### 2.4 Le profil `dev-noauth`

Pour faciliter le dev frontend, on a un profil Spring qui **désactive complètement les `@PreAuthorize`** :

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev-noauth"
```

C'est piloté par [`SecurityNoAuthConfig`](carfo-backend/src/main/java/com/carfo/gestion_missions/config/SecurityNoAuthConfig.java) qui annote `@EnableMethodSecurity(prePostEnabled = false)`. Pour tester les permissions réelles, **lance toujours en profil `dev`** (sans flag).

---

## 3. Ajouter une nouvelle permission end-to-end

Scénario : tu veux qu'un nouveau type d'utilisateur (par exemple "le DRH") puisse **télécharger un nouveau type de rapport** sur `GET /api/rapports/synthese-rh`.

### Étape 1 — Choisir le pattern de permission

**Question** : la permission tient-elle dans une simple liste de rôles ?

- ✅ Oui → `@PreAuthorize("hasAnyRole(...)")` directement
- ❌ Non (condition métier complexe : direction, état d'un objet, etc.) → ajouter une méthode dans `SecurityChecker`

Dans notre exemple, on veut "Directeur de la DRH OU admin" — c'est conditionnel (rôle + direction spécifique). Donc **pattern 2**.

### Étape 2 — Ajouter la méthode dans `SecurityChecker`

```java
// SecurityChecker.java
public boolean isDrh() {
    return getCurrentAgent()
        .filter(a -> a.getRole() == RoleAgent.DIRECTEUR_DIRECTION)
        .map(Agent::getDirection)
        .map(d -> "DRH".equalsIgnoreCase(d.getSigleDirection()))
        .orElse(false);
}

public boolean isDrhOrAdmin() {
    return isAdmin() || isDrh();
}
```

> Si c'est juste une liste de rôles, **saute cette étape** et passe à l'étape 3 avec `hasAnyRole(...)`.

### Étape 3 — Appliquer `@PreAuthorize` sur le contrôleur

```java
@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService rapportService;

    @GetMapping("/synthese-rh")
    @PreAuthorize("@securityChecker.isDrhOrAdmin()")
    public ResponseEntity<byte[]> syntheseRh() {
        return ResponseEntity.ok(rapportService.genererSyntheseRh());
    }
}
```

### Étape 4 — Tester le backend avec curl + JWT

Récupère un token JWT avec un compte conforme au critère :

```bash
# 1. Login DRH
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"drh@carfo.bf","motDePasse":"carfo123"}' | jq -r .token)

# 2. Appel endpoint protégé
curl -X GET http://localhost:8000/api/rapports/synthese-rh \
  -H "Authorization: Bearer $TOKEN" -w "\nHTTP %{http_code}\n"
# → 200 attendu

# 3. Test avec un compte non autorisé (SG)
TOKEN_SG=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sg@carfo.bf","motDePasse":"carfo123"}' | jq -r .token)
curl -X GET http://localhost:8000/api/rapports/synthese-rh \
  -H "Authorization: Bearer $TOKEN_SG" -w "\nHTTP %{http_code}\n"
# → 403 attendu
```

### Étape 5 — Côté frontend : masquer le bouton si non autorisé

**Important** : le backend reste la **seule source de vérité** pour les permissions. Le frontend ne fait que masquer les boutons et rediriger sur 401/403 (déjà géré par [`auth.interceptor.ts`](carfo-frontend/src/app/core/interceptors/auth.interceptor.ts)).

**a) Ajouter le bouton dans un composant** (exemple `dashboard.component.ts`) :

```html
<button
  *ngIf="canDownloadSyntheseRh()"
  (click)="downloadSyntheseRh()"
  class="btn btn-primary"
>
  Synthèse RH
</button>
```

**b) Logique dans la classe** :

```typescript
import { AuthService } from '../../core/services/auth.service';

constructor(private readonly authService: AuthService) {}

canDownloadSyntheseRh(): boolean {
  if (this.authService.hasAnyRole(['ADMINISTRATEUR'])) return true;
  const user = this.authService.getUser();
  // DRH = directeur de direction rattaché à la direction DRH
  return user?.role === 'DIRECTEUR_DIRECTION' && user?.nomDirection?.includes('Ressources Humaines');
}

downloadSyntheseRh(): void {
  this.http.get(`${environment.apiUrl}/rapports/synthese-rh`, { responseType: 'blob' })
    .subscribe(blob => { /* trigger download */ });
}
```

> Le helper [`AuthService.hasAnyRole(roles)`](carfo-frontend/src/app/core/services/auth.service.ts) suffit pour les vérifications simples par rôle.

### Étape 6 — Tester le flow complet dans l'UI

1. **Hard refresh** http://localhost:4200 (Ctrl+Shift+R)
2. Login en `drh@carfo.bf` → le bouton doit apparaître
3. Clic → le PDF se télécharge
4. Logout / login en `sg@carfo.bf` → le bouton est masqué
5. Si la SG forge l'URL ou tape directement l'appel API, l'interceptor reçoit 403 et la redirige sur `/login`

---

## 4. Patterns récurrents à connaître

| Pattern | Quand l'utiliser | Exemple existant |
|---------|------------------|------------------|
| `@PreAuthorize("hasAnyRole(...)")` | Permission basée uniquement sur le rôle | `AgentController.getAllAgents()` |
| `@PreAuthorize("@securityChecker.isDmgOrAdmin()")` | Permission conditionnelle (rôle + critère métier) | `AffectationController.createAffectation()` |
| Constante `READ_ROLES` | Plusieurs endpoints partagent la même liste | `AffectationController` |
| Contrainte au niveau service | Règle métier (ex: « mission doit être PREVUE pour être validée ») | `MissionService.validerMission()` |

---

## 5. Mémo final

✅ **Toujours faire** :
- Définir `@PreAuthorize` sur **chaque endpoint** de chaque contrôleur (jamais d'endpoint sans annotation)
- Tester côté backend avec **curl + JWT** avant de toucher au frontend
- Masquer les actions non autorisées dans l'UI (UX) **sans** se reposer dessus pour la sécurité
- Ajouter le compte de test dans [`TEST_ACCOUNTS.md`](TEST_ACCOUNTS.md) quand tu seedes un nouveau profil

❌ **Ne jamais faire** :
- Implémenter la vérification de permission uniquement côté frontend (contournable)
- Mélanger plusieurs profils de connexion en localStorage sans appeler `authService.logout()` entre deux
- Hardcoder un mot de passe en clair dans le code Java (toujours passer par `passwordEncoder.encode()`)
