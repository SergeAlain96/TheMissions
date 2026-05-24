package com.carfo.gestion_missions.enums;

/**
 * Statut d'un chauffeur.
 *
 * Persistés en base (réglés par le DMG manuellement) :
 *  - DISPONIBLE   : chauffeur libre, peut être affecté
 *  - INDISPONIBLE : chauffeur explicitement marqué indisponible (maladie, formation, ...)
 *
 * Calculés à la lecture (dérivés de l'état des données) :
 *  - EN_MISSION   : chauffeur affecté à une mission qui couvre la date du jour
 *  - ABSENT       : chauffeur ayant une absence approuvée couvrant la date du jour
 */
public enum StatutChauffeur {
    DISPONIBLE,
    INDISPONIBLE,
    EN_MISSION,
    ABSENT
}
