# 🔑 Comptes de test — CARFO

> Comptes seedés automatiquement par [`DataInitializer`](carfo-backend/src/main/java/com/carfo/gestion_missions/config/DataInitializer.java) au démarrage du backend.
> Idempotent : un compte n'est créé que si son email **et** son matricule n'existent pas déjà.

## Mot de passe commun à tous les comptes

```
carfo123
```

> ⚠️ Mot de passe à usage **développement / démo uniquement**. À changer en production.

---

## 📋 Liste des comptes

### 🛡️ Administration générale

| Email | Mot de passe | Rôle | Direction | Cas d'usage |
|---|---|---|---|---|
| `admin@carfo.bf` | `carfo123` | **ADMINISTRATEUR** | Direction Générale (DG) | Tout faire, super-utilisateur |
| `sg@carfo.bf` | `carfo123` | **SECRETAIRE_GENERALE** | DG | **Valider / annuler les missions** + dashboard |
| `directeur@carfo.bf` | `carfo123` | **DIRECTEUR** | DG | Consultation transversale + dashboard |

### 🏢 Directeurs de direction (peuvent **soumettre des missions**)

| Email | Mot de passe | Rôle | Direction | Cas d'usage |
|---|---|---|---|---|
| **`dmg@carfo.bf`** | `carfo123` | **DIRECTEUR_DIRECTION** | **DMG** (Direction des Moyens Généraux) | **Affecter chauffeurs + véhicules aux missions**, créer les comptes chauffeurs, gérer le parc auto |
| `df@carfo.bf` | `carfo123` | DIRECTEUR_DIRECTION | Direction Financière (DF) | Soumettre missions DF |
| `drh@carfo.bf` | `carfo123` | DIRECTEUR_DIRECTION | Direction des Ressources Humaines (DRH) | Soumettre missions DRH |
| `dt@carfo.bf` | `carfo123` | DIRECTEUR_DIRECTION | Direction Technique (DT) | Soumettre missions DT |

### 📊 Chargés d'étude (gestion des absences)

| Email | Mot de passe | Rôle | Direction | Cas d'usage |
|---|---|---|---|---|
| `charge1@carfo.bf` | `carfo123` | **CHARGE_ETUDE** | DG | Gérer les absences |
| `charge2@carfo.bf` | `carfo123` | CHARGE_ETUDE | DF | Idem |

### 🚗 Chauffeurs (rattachés à la DMG, `estChauffeur=true`)

| Email | Mot de passe | Rôle | Direction | Nom |
|---|---|---|---|---|
| `chauffeur1@carfo.bf` | `carfo123` | AGENT 🚗 | DMG | DIALLO Mamadou |
| `chauffeur2@carfo.bf` | `carfo123` | AGENT 🚗 | DMG | KONATE Seydou |

### 👥 Agents simples (participants potentiels aux missions)

| Email | Mot de passe | Rôle | Direction | Nom |
|---|---|---|---|---|
| `agent1@carfo.bf` | `carfo123` | AGENT | DF | NIKIEMA Ousmane |
| `agent2@carfo.bf` | `carfo123` | AGENT | DSI | BARRY Habib |
| `agent3@carfo.bf` | `carfo123` | AGENT | DT | YAMEOGO Angèle |

---

## 🧪 Scénarios de test recommandés

### Scénario 1 — Workflow complet d'une mission

1. Connecte-toi avec **`df@carfo.bf`** (directeur de direction)
2. Va sur **Missions** → **Nouvelle mission** → soumets une mission (date ≥ J+10)
3. Déconnecte-toi
4. Connecte-toi avec **`sg@carfo.bf`** (secrétaire générale)
5. Va sur **Validation** → **Valider** la mission soumise → statut passe à `INITIEE`
6. Déconnecte-toi
7. Connecte-toi avec **`dmg@carfo.bf`** (Directeur des Moyens Généraux)
8. Va sur **Affectations** → **Affecter** un chauffeur (Diallo ou Konate) + un véhicule
9. Retourne sur la page Détail → télécharge la **fiche PDF** avec logo CARFO

### Scénario 2 — Permission DMG

1. Connecte-toi avec **`df@carfo.bf`** (directeur de direction, **mais pas DMG**)
2. Tente de créer un chauffeur via `POST /api/auth/register` avec `estChauffeur=true`
   → ❌ doit refuser ("Seul le DMG peut créer un chauffeur")
3. Connecte-toi avec **`dmg@carfo.bf`**
4. Refais l'opération → ✅ doit accepter

### Scénario 3 — Dashboard multi-rôles

Le dashboard est accessible à : `ADMINISTRATEUR`, `SECRETAIRE_GENERALE`, `DIRECTEUR`, `DIRECTEUR_DIRECTION`, `CHARGE_ETUDE`.
Connecte-toi avec chacun → tu verras le même dashboard.

Le rôle `AGENT` (chauffeurs et agents simples) **n'a pas accès** au dashboard.

---

## ⚙️ Profil backend

Ces comptes sont seedés peu importe le profil. **Pour tester l'authentification réelle**, il faut le profil `dev` (et non `dev-noauth`) :

```bash
mvn -f carfo-backend/pom.xml spring-boot:run
# (sans -Dspring-boot.run.profiles=dev-noauth)
```

Si tu lances en `dev-noauth`, le login UI affichera une erreur car l'AuthenticationManager est désactivé — mais tous les endpoints sont accessibles sans token.

---

## 🔄 Pour réinitialiser les comptes

Le seeding est idempotent (skip si email/matricule existe). Pour repartir de zéro :

```sql
-- Optionnel : supprimer tous les comptes test avant rebuild
DELETE FROM agent WHERE email LIKE '%@carfo.bf';
```

Puis redémarre le backend.
