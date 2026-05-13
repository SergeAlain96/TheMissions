# Ajout direct des agents lors de la soumission d'une mission

## 📋 Résumé du changement

**Ancien flux:**
1. Créer mission (sans agents)
2. Soumettre mission
3. Affecter chauffeur + véhicule (étape séparée)
4. Ajouter participants optionnels (étape séparée)

**Nouveau flux:**
1. Créer mission
2. **Sélectionner directement les agents participants dans le formulaire**
3. Soumettre mission (agents et affectation chauffeur/véhicule faits après)

---

## 🔧 Modifications effectuées

### Backend (déjà supporté)

**MissionService.java** — `soumettreMission()` accepte déjà :
- `idAgents: List<Long>` — IDs des agents
- `rolesMission: List<String>` — rôles (MEMBRE, CHEF_MISSION, etc.)

**MissionController.java** — POST `/api/missions/soumettre` extrait ces champs du body JSON

**Entité Participe** — lie Mission ↔ Agent avec rôle

---

### Frontend (modifié)

**mission-create.component.ts** — Ajout :

1. **Import AgentService** pour charger les agents disponibles
2. **Multi-select checkbox** dans le formulaire
   - Affiche nom + prénom de chaque agent
   - Badge "🚗 Chauffeur" pour les chauffeurs
   - Compteur: "X agent(s) sélectionné(s)"
3. **selectedAgentIds: Set<number>** pour tracker les agents cochés
4. **onAgentToggle(idAgent, checked)** — ajoute/supprime agent de la sélection
5. **onSubmit()** — ajoute `idAgents` et `rolesMission` au payload mission

---

## 📡 Payload de soumission

**Ancien:**
```json
{
  "dateDebut": "2026-06-15",
  "dateFin": "2026-06-17",
  "lieu": "Dakar",
  "objetMission": "Visite site A",
  "idDirection": 1
}
```

**Nouveau:**
```json
{
  "dateDebut": "2026-06-15",
  "dateFin": "2026-06-17",
  "lieu": "Dakar",
  "objetMission": "Visite site A",
  "idDirection": 1,
  "idAgents": [2, 5, 7],
  "rolesMission": ["MEMBRE", "MEMBRE", "CHEF_MISSION"]
}
```

---

## 🖥️ Interface utilisateur

**Formulaire de création:**

```
┌─────────────────────────────────────┐
│ 🎯 Créer une nouvelle mission       │
├─────────────────────────────────────┤
│ Objet de mission: [                 ]│
│ Lieu:            [                 ]│
│ Date début:      [____]  Fin: [____]│
│ Direction:       [Sélectionner...  ]│
│                                     │
│ 👥 Agents participants              │
│ ┌────────────────────────────────┐  │
│ │ ☐ Jean Dupont                  │  │
│ │ ☐ Mariama Ndiaye   🚗 Chauffeur│  │
│ │ ☑ Amadou Sow      🚗 Chauffeur │  │
│ │ ☐ Fatou Sarr                   │  │
│ │ ☐ Ousmane Ba                   │  │
│ └────────────────────────────────┘  │
│ 1 agent(s) sélectionné(s)           │
│                                     │
│ [✨ Soumettre] [✕ Annuler]         │
└─────────────────────────────────────┘
```

---

## ✅ Validation

- ✅ Backend: `/api/agents` endpoint pour lister les agents
- ✅ Backend: `soumettreMission()` crée les entrées `Participe`
- ✅ Frontend: Chargement des agents au démarrage du formulaire
- ✅ Frontend: Sélection multi-agent avec visual feedback
- ✅ Frontend: Envoi des IDs et rôles au backend

---

## 🚀 Utilisation

1. Naviguer vers **Missions → Créer mission**
2. Remplir objet, lieu, dates, direction (comme avant)
3. **Cocher les agents** qui participeront à la mission
4. Cliquer **"✨ Soumettre la mission"**
5. Les agents sont créés instantanément dans la relation `Participe`

---

## 📌 Notes importantes

- Les agents sont **créés immédiatement** dans la base lors de la soumission
- Le rôle par défaut est `"MEMBRE"` pour tous les agents sélectionnés
  - Pour assigner un rôle différent, modifier le code ou ajouter un dropdown
- L'affectation du **chauffeur + véhicule** se fait toujours après via `/api/missions/{id}/affecter`
- Les agents doivent déjà exister en base pour être sélectionnés

---

## 🔄 Flux complet

```
Frontend: Formulaire création
    ↓
    ├─ User sélectionne agents via checkboxes
    ├─ User clique "Soumettre"
    ↓
Backend: POST /api/missions/soumettre
    ├─ Valide règles métier (10 jours, chevauchement)
    ├─ Crée Mission
    ├─ Pour chaque agent sélectionné:
    │   └─ Crée entrée Participe (mission_id, agent_id, role)
    ├─ Retourne Mission avec status 201
    ↓
Frontend: Redirection vers liste missions
```

---

## 🎯 Prochaines améliorations

- [ ] Ajouter select de rôle (CHEF_MISSION vs MEMBRE) pour chaque agent
- [ ] Filtrer agents par disponibilité (absences)
- [ ] Afficher agent + rôle dans le détail mission
- [ ] Interface pour modifier participants après soumission
- [ ] Validation: au moins 1 agent sélectionné (optionnel)
