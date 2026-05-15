package com.carfo.gestion_missions.config;

import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.repository.DirectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Objects;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    /** Sigle de la Direction du Matériel Général — utilisé pour identifier le DMG. */
    public static final String SIGLE_DMG = "DMG";

    private final DirectionRepository directionRepository;

    @Bean
    public CommandLineRunner initDirections() {
        return args -> {
            // Création initiale (BDD vide)
            if (directionRepository.count() == 0) {
                directionRepository.saveAll(List.of(
                        direction("Direction Générale",                   "DG"),
                        direction("Direction Financière",                 "DF"),
                        direction("Direction des Ressources Humaines",    "DRH"),
                        direction("Direction Technique",                  "DT"),
                        direction("Direction Informatique",               "DI"),
                        direction("Direction du Matériel Général",        SIGLE_DMG)
                ));
                log.info("DataInitializer: 6 directions initiales créées (DG, DF, DRH, DT, DI, DMG).");
                return;
            }

            // Backfill idempotent — assure que la direction DMG existe même si la BDD a déjà
            // été initialisée avant cette version (cas du dev qui a la base depuis avant).
            if (!directionRepository.existsBySigleDirection(SIGLE_DMG)) {
                directionRepository.save(direction("Direction du Matériel Général", SIGLE_DMG));
                log.info("DataInitializer: direction DMG ajoutée a posteriori (backfill).");
            }
        };
    }

    private Direction direction(String nom, String sigle) {
        return Objects.requireNonNull(Direction.builder()
                .nomDirection(nom)
                .sigleDirection(sigle)
                .build());
    }
}
