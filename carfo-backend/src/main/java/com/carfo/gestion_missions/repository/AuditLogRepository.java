package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.AuditLog;
import com.carfo.gestion_missions.enums.AuditCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Recherche paginée avec filtres optionnels. Un paramètre null = pas de filtre sur ce champ.
     */
    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:category IS NULL OR a.category = :category)
          AND (:email IS NULL OR LOWER(a.agentEmail) LIKE LOWER(CONCAT('%', :email, '%')))
          AND (:fromDate IS NULL OR a.timestamp >= :fromDate)
          AND (:toDate IS NULL OR a.timestamp <= :toDate)
        ORDER BY a.timestamp DESC
    """)
    Page<AuditLog> search(
            @Param("category") AuditCategory category,
            @Param("email") String email,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}
