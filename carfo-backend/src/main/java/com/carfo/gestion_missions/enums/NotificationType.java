package com.carfo.gestion_missions.enums;

public enum NotificationType {
    MISSION_SOUMISE,        // une nouvelle mission attend validation (SG)
    MISSION_VALIDEE,        // mission passée à INITIEE (directeur soumetteur + DMG)
    MISSION_ANNULEE,        // mission annulée (directeur soumetteur)
    MISSION_CLOTUREE,       // mission clôturée (DRH)
    AFFECTATION_CREEE,      // chauffeur + véhicule affectés (chauffeur + directeur soumetteur)
    AFFECTATION_SUPPRIMEE,  // affectation supprimée (chauffeur précédemment affecté)
    ABSENCE_DECLAREE        // demande d'absence en attente (chargé d'étude)
}
