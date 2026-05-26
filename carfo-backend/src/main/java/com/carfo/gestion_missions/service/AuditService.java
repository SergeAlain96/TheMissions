package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.AuditLog;
import com.carfo.gestion_missions.enums.AuditCategory;
import com.carfo.gestion_missions.repository.AuditLogRepository;
import com.carfo.gestion_missions.security.SecurityChecker;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Enregistre les actions sensibles dans la table audit_log.
 * Échoue silencieusement : un problème d'audit ne doit JAMAIS interrompre le flow métier.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;
    private final SecurityChecker securityChecker;

    /** Injection optionnelle de la requête en cours pour capturer l'IP (proxy-friendly). */
    @Autowired(required = false)
    private HttpServletRequest currentRequest;

    /**
     * Enregistre une entrée d'audit pour l'utilisateur courant (résolu via SecurityChecker).
     * Si aucun utilisateur n'est authentifié (cas LOGIN avant succès), les champs agent restent vides.
     */
    @Transactional
    public void log(AuditCategory category, String action, String entityType, Long entityId, String summary) {
        var currentAgent = securityChecker.getCurrentAgent().orElse(null);
        logAs(currentAgent, category, action, entityType, entityId, summary);
    }

    /**
     * Variante explicite : enregistre une entrée d'audit en imputant l'action à un agent spécifique
     * (utilisée notamment lors du LOGIN, où l'utilisateur n'est pas encore dans le SecurityContext).
     */
    @Transactional
    public void logAs(Agent agent, AuditCategory category, String action,
                       String entityType, Long entityId, String summary) {
        try {
            AuditLog entry = AuditLog.builder()
                    .category(category)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .summary(truncate(summary, 500))
                    .ipAddress(resolveClientIp())
                    .agentEmail(agent != null ? agent.getEmail() : null)
                    .agentNom(agent != null ? (agent.getPrenom() + " " + agent.getNom()) : null)
                    .build();
            repository.save(entry);
        } catch (Exception ex) {
            // Erreur d'audit non-bloquante (par ex. connexion DB momentanée).
            log.warn("Audit log skipped ({}/{}): {}", category, action, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> search(AuditCategory category, String email,
                                  LocalDateTime fromDate, LocalDateTime toDate,
                                  int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(200, Math.max(1, size));
        return repository.search(category, email, fromDate, toDate,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "timestamp")));
    }

    private String resolveClientIp() {
        if (currentRequest == null) return null;
        String forwarded = currentRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return currentRequest.getRemoteAddr();
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
