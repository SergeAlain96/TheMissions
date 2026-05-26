package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.entity.AuditLog;
import com.carfo.gestion_missions.enums.AuditCategory;
import com.carfo.gestion_missions.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Journal d'audit (admin only). Lecture seule via API ; pas d'endpoint d'écriture
 * — toute la traçabilité est produite par les services métier via AuditService.log().
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditService auditService;

    /**
     * Recherche paginée. Tous les filtres sont optionnels.
     * Exemple : GET /api/audit?category=MISSION&fromDate=2026-05-01T00:00:00&page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(required = false) AuditCategory category,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        Page<AuditLog> result = auditService.search(category, email, fromDate, toDate, page, size);
        return ResponseEntity.ok(Map.of(
                "content",       result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages",    result.getTotalPages(),
                "page",          result.getNumber(),
                "size",          result.getSize()
        ));
    }
}
