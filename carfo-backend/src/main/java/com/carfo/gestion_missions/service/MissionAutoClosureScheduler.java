package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.Mission;
import com.carfo.gestion_missions.enums.StatutMission;
import com.carfo.gestion_missions.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Clôture automatique des missions dont la date de fin est dépassée.
 * Tourne tous les jours à 01h00 (heure du serveur). Délègue la logique de clôture
 * (libération véhicules, notifications DRH) à MissionService.cloturerMission.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MissionAutoClosureScheduler {

    private final MissionRepository missionRepository;
    private final MissionService missionService;
    private final AppConfigService appConfigService;

    /** Cron : tous les jours à 01:00. */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void cloturerMissionsEchues() {
        // Respecte le flag de l'admin (Paramètres → Règles métier)
        var cfg = appConfigService.get();
        if (!Boolean.TRUE.equals(cfg.getAutoClosureEnabled())) {
            log.info("Auto-clôture désactivée par configuration — skip.");
            return;
        }

        LocalDate today = LocalDate.now();
        List<Mission> candidates = missionRepository.findByStatut(StatutMission.INITIEE).stream()
                .filter(m -> m.getDateFin() != null && !m.getDateFin().isAfter(today))
                .toList();

        if (candidates.isEmpty()) {
            log.debug("Auto-clôture : aucune mission échue à clôturer ({})", today);
            return;
        }

        log.info("Auto-clôture : {} mission(s) échue(s) détectée(s) — clôture en cours.", candidates.size());
        for (Mission m : candidates) {
            try {
                missionService.cloturerMission(m.getIdMission());
                log.info("Auto-clôture OK : mission {} ({})", m.getReference(), m.getIdMission());
            } catch (Exception ex) {
                log.error("Auto-clôture KO pour mission {} : {}", m.getIdMission(), ex.getMessage(), ex);
            }
        }
    }
}
