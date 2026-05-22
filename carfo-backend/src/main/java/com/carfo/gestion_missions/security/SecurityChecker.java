package com.carfo.gestion_missions.security;

import com.carfo.gestion_missions.config.DataInitializer;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.enums.RoleAgent;
import com.carfo.gestion_missions.repository.AgentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Bean exposé pour les expressions @PreAuthorize.
 *
 * Usage en annotation :
 *   {@code @PreAuthorize("@securityChecker.isDmgOrAdmin()")}
 */
@Component("securityChecker")
@RequiredArgsConstructor
public class SecurityChecker {

    private static final String ROLE_ADMIN = "ROLE_" + RoleAgent.ADMINISTRATEUR.name();

    private final AgentRepository agentRepository;

    /**
     * L'utilisateur connecté est-il le DMG (Directeur des Moyens Généraux) ?
     * On recharge l'agent depuis le repo pour éviter le LazyInitializationException
     * que provoquerait l'accès à {@code agent.getDirection()} sur le principal détaché.
     */
    public boolean isDmg() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        if (!(auth.getPrincipal() instanceof Agent agent)) {
            return false;
        }
        if (agent.getRole() != RoleAgent.DIRECTEUR_DIRECTION) {
            return false;
        }
        // Re-fetch dans une session active pour éviter le proxy detaché
        return agentRepository.findById(agent.getIdAgent())
                .map(fresh -> fresh.getDirection() != null
                        && DataInitializer.SIGLE_DMG.equalsIgnoreCase(fresh.getDirection().getSigleDirection()))
                .orElse(false);
    }

    /** L'utilisateur est-il administrateur ? */
    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ROLE_ADMIN::equals);
    }

    /** DMG OU administrateur — pour les opérations d'affectation de ressources. */
    public boolean isDmgOrAdmin() {
        return isAdmin() || isDmg();
    }

    /** Retourne l'agent connecté si présent dans le contexte de sécurité. */
    public Optional<Agent> getCurrentAgent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof Agent agent) {
            return Optional.of(agent);
        }
        return Optional.empty();
    }
}
