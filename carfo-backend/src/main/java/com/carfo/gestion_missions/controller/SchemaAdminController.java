package com.carfo.gestion_missions.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Endpoint d'administration pour forcer des migrations de schéma à la demande
 * (ne pas exposer en production).
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/schema")
@RequiredArgsConstructor
public class SchemaAdminController {

    private final DataSource dataSource;

    /**
     * Drop la contrainte UNIQUE résiduelle sur affectation.id_mission héritée de l'ancien
     * mapping @OneToOne. Diagnostique d'abord (liste tous les indexes uniques), puis tente
     * le DROP. Retourne le détail des opérations pour debug.
     */
    @PostMapping("/drop-affectation-unique-mission")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Map<String, Object>> dropAffectationUniqueOnMission() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> diagnostics = new ArrayList<>();
        List<String> dropped = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Connection conn = dataSource.getConnection(); Statement st = conn.createStatement()) {
            // 1. Diagnostic : tous les indexes sur affectation
            try (ResultSet rs = st.executeQuery("""
                    SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'affectation'
                    ORDER BY INDEX_NAME, SEQ_IN_INDEX
                    """)) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("indexName", rs.getString("INDEX_NAME"));
                    row.put("columnName", rs.getString("COLUMN_NAME"));
                    row.put("nonUnique", rs.getInt("NON_UNIQUE"));
                    diagnostics.add(row);
                }
            }

            // 2. Récupère les indexes UNIQUE (NON_UNIQUE=0) sur id_mission, hors PRIMARY
            List<String> uniqueIndexes = new ArrayList<>();
            try (ResultSet rs = st.executeQuery("""
                    SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'affectation'
                      AND COLUMN_NAME = 'id_mission'
                      AND NON_UNIQUE = 0
                      AND INDEX_NAME <> 'PRIMARY'
                    """)) {
                while (rs.next()) {
                    uniqueIndexes.add(rs.getString(1));
                }
            }

            // 3. Identifier les FK sur id_mission (l'UNIQUE est référencé par une FK → on doit
            //    dropper la FK d'abord, puis l'index, puis recréer une FK normale).
            List<String> fkNames = new ArrayList<>();
            try (ResultSet rs = st.executeQuery("""
                    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'affectation'
                      AND COLUMN_NAME = 'id_mission'
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                    """)) {
                while (rs.next()) {
                    fkNames.add(rs.getString(1));
                }
            }
            result.put("foreignKeysFound", new ArrayList<>(fkNames));

            // 3a. Drop FK
            for (String fk : fkNames) {
                try {
                    st.executeUpdate("ALTER TABLE affectation DROP FOREIGN KEY `" + fk + "`");
                    log.info("Schema admin : DROP FK `{}` OK", fk);
                } catch (Exception ex) {
                    errors.add("FK " + fk + " : " + ex.getMessage());
                }
            }

            // 3b. Drop chaque index UNIQUE
            for (String idx : uniqueIndexes) {
                try {
                    st.executeUpdate("ALTER TABLE affectation DROP INDEX `" + idx + "`");
                    dropped.add(idx);
                    log.info("Schema admin : DROP INDEX `{}` sur affectation.id_mission OK", idx);
                } catch (Exception ex) {
                    errors.add(idx + " : " + ex.getMessage());
                    log.warn("Schema admin : DROP INDEX `{}` failed : {}", idx, ex.getMessage());
                }
            }

            // 3c. Recréer la FK SANS contrainte unique (CASCADE comportement par défaut)
            if (!fkNames.isEmpty()) {
                try {
                    st.executeUpdate("""
                        ALTER TABLE affectation
                        ADD CONSTRAINT fk_affectation_mission
                        FOREIGN KEY (id_mission) REFERENCES mission(id_mission)
                        """);
                    log.info("Schema admin : FK fk_affectation_mission recréée sans UNIQUE.");
                    result.put("fkRecreated", "fk_affectation_mission");
                } catch (Exception ex) {
                    errors.add("FK recréation : " + ex.getMessage());
                }
            }

            result.put("ok", errors.isEmpty());
            result.put("diagnostics", diagnostics);
            result.put("dropped", dropped);
            result.put("errors", errors);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            log.error("Schema admin : erreur globale", ex);
            result.put("ok", false);
            result.put("error", ex.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
