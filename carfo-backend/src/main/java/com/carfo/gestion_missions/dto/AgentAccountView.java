package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.RoleAgent;

import java.time.LocalDateTime;

/**
 * Vue compacte d'un compte agent pour l'onglet Comptes & sécurité.
 * Expose les infos utiles à l'administration des accès (jamais le mot de passe).
 */
public record AgentAccountView(
        Long idAgent,
        String matricule,
        String nom,
        String prenom,
        String email,
        RoleAgent role,
        String nomDirection,
        boolean actif,
        LocalDateTime lastLoginAt
) {}
