package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.SessionSoumission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionSoumissionRepository extends JpaRepository<SessionSoumission, Long> {

    /** Toutes les sessions, triées par date d'ouverture décroissante (plus récentes d'abord). */
    @Query("SELECT s FROM SessionSoumission s ORDER BY s.dateOuverture DESC")
    List<SessionSoumission> findAllSorted();

    /**
     * Session ouverte à la date donnée (typiquement aujourd'hui).
     * Renvoie la première trouvée s'il y en a plusieurs (cas non normal).
     */
    @Query("""
        SELECT s FROM SessionSoumission s
        WHERE s.dateOuverture <= :date AND s.dateFermeture >= :date
        ORDER BY s.dateOuverture DESC
    """)
    List<SessionSoumission> findOuvertesADate(@Param("date") LocalDate date);

    default Optional<SessionSoumission> findActive() {
        List<SessionSoumission> ouvertes = findOuvertesADate(LocalDate.now());
        return ouvertes.isEmpty() ? Optional.empty() : Optional.of(ouvertes.get(0));
    }
}
