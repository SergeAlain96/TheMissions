package com.carfo.gestion_missions.enums;

/**
 * Statut d'une affectation chauffeur+véhicule.
 *  - ACTIVE  : affectation en vigueur (compte pour les conflits ressources)
 *  - ANNULEE : affectation soft-deleted (gardée pour l'historique, n'occupe plus la ressource)
 *
 * Une même mission peut avoir plusieurs affectations ACTIVE en parallèle
 * (gros convoi avec plusieurs voitures, par exemple).
 */
public enum StatutAffectation {
    ACTIVE,
    ANNULEE
}
