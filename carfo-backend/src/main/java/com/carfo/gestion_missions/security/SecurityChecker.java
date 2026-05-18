package com.carfo.gestion_missions.security;

import com.carfo.gestion_missions.config.DataInitializer;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.enums.RoleAgent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Bean exposé pour les expressions @PreAuthorize.
 *
 * Usage en annotation :
 *   {@code @PreAuthorize("@securityChecker.isDmgOrAdmin()")}
 */
@Component("securityChecker")
public class SecurityChecker {

    private static final String ROLE_ADMIN = "ROLE_" + RoleAgent.ADMINISTRATEUR.name();

    /** L'utilisateur connecté est-il le DMG (Directeur des Moyens Généraux) ? */
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
        Direction direction = agent.getDirection();
        return direction != null
                && DataInitializer.SIGLE_DMG.equalsIgnoreCase(direction.getSigleDirection());
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
}
