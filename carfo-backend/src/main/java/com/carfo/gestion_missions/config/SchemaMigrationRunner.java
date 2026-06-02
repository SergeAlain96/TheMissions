package com.carfo.gestion_missions.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Petites migrations de schéma exécutées au démarrage pour rattraper les évolutions
 * que `ddl-auto=update` ne sait pas faire (notamment : étendre la longueur d'une colonne enum,
 * dropper une contrainte UNIQUE devenue obsolète).
 *
 * Toutes les opérations sont idempotentes — exécutées avec "IF EXISTS" ou try/catch silencieux.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(0) // s'exécute avant DataInitializer
public class SchemaMigrationRunner {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void run() {
        try (Connection conn = dataSource.getConnection(); Statement st = conn.createStatement()) {

            // 1. Étendre mission.statut (les nouveaux statuts AVIS_SG_FAVORABLE / AVIS_SG_DEFAVORABLE
            //    font jusqu'à 19 caractères, alors que la colonne initiale était plus courte).
            safeExec(st, "ALTER TABLE mission MODIFY COLUMN statut VARCHAR(30) NOT NULL");

            // 2. Étendre affectation.statut au cas où la colonne préexisterait sans length explicite.
            safeExec(st, "ALTER TABLE affectation MODIFY COLUMN statut VARCHAR(20) NOT NULL");

            // 3. Étendre notification.type (AFFECTATION_SUPPRIMEE = 21 chars).
            safeExec(st, "ALTER TABLE notification MODIFY COLUMN type VARCHAR(40) NOT NULL");

            // 4. Dropper la contrainte UNIQUE sur affectation.id_mission si elle existe encore
            //    (initialement OneToOne → maintenant ManyToOne pour le multi-affectations).
            //    On résout dynamiquement le nom de l'index via information_schema.
            dropUniqueIndexIfExists(st, "affectation", "id_mission");

            // 5. Rendre nullable email / mot_de_passe / role / username sur agent
            //    (séparation agent identité vs compte d'accès).
            safeExec(st, "ALTER TABLE agent MODIFY COLUMN email VARCHAR(255) NULL");
            safeExec(st, "ALTER TABLE agent MODIFY COLUMN mot_de_passe VARCHAR(255) NULL");
            safeExec(st, "ALTER TABLE agent MODIFY COLUMN role VARCHAR(40) NULL");
            safeExec(st, "ALTER TABLE agent MODIFY COLUMN username VARCHAR(50) NULL");

            log.info("SchemaMigrationRunner : migrations idempotentes appliquées.");
        } catch (Exception e) {
            log.warn("SchemaMigrationRunner : échec global, certaines migrations n'ont pas été appliquées : {}",
                    e.getMessage());
        }
    }

    /** Exécute un ALTER TABLE et log un avertissement si l'opération échoue, sans crasher l'app. */
    private void safeExec(Statement st, String sql) {
        try {
            st.executeUpdate(sql);
            log.info("Migration OK : {}", sql);
        } catch (Exception ex) {
            // Souvent : la colonne a déjà la bonne taille, ou la table n'existe pas encore.
            log.debug("Migration skipped ({}) : {}", ex.getMessage(), sql);
        }
    }

    /**
     * Drop tout index UNIQUE (sauf PRIMARY) qui couvre la colonne donnée — typiquement
     * la contrainte historique générée par Hibernate quand l'entité était en @OneToOne(unique=true).
     * On utilise une approche en deux passes :
     *   1. Lecture des noms d'index dans une liste (pour éviter de garder un ResultSet ouvert
     *      pendant qu'on exécute ALTER TABLE, ce qui peut bloquer sur certains drivers).
     *   2. Exécution des DROP INDEX un par un.
     */
    private void dropUniqueIndexIfExists(Statement st, String table, String column) {
        java.util.List<String> indexes = new java.util.ArrayList<>();
        String findSql = String.format("""
            SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = '%s'
              AND COLUMN_NAME = '%s'
              AND NON_UNIQUE = 0
              AND INDEX_NAME <> 'PRIMARY'
            """, table, column);
        try (var rs = st.executeQuery(findSql)) {
            while (rs.next()) {
                indexes.add(rs.getString(1));
            }
        } catch (Exception ex) {
            log.warn("dropUniqueIndexIfExists : recherche échouée sur {}.{} ({})", table, column, ex.getMessage());
            return;
        }

        if (indexes.isEmpty()) {
            log.info("Migration : aucun index UNIQUE trouvé sur {}.{} (probablement déjà droppé).", table, column);
            return;
        }

        for (String indexName : indexes) {
            try {
                st.executeUpdate(String.format("ALTER TABLE %s DROP INDEX `%s`", table, indexName));
                log.info("Migration OK : DROP INDEX `{}` sur {}.{}", indexName, table, column);
            } catch (Exception ex) {
                log.warn("Impossible de dropper l'index {} sur {}.{} : {}", indexName, table, column, ex.getMessage());
            }
        }
    }
}
