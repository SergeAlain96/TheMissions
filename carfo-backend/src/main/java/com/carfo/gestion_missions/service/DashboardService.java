package com.carfo.gestion_missions.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carfo.gestion_missions.enums.StatutMission;
import com.carfo.gestion_missions.repository.AffectationRepository;
import com.carfo.gestion_missions.repository.MissionRepository;
import com.carfo.gestion_missions.repository.VehiculeRepository;
import com.carfo.gestion_missions.repository.AgentRepository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final MissionRepository missionRepository;
    private final VehiculeRepository vehiculeRepository;
    private final AffectationRepository affectationRepository;
    private final AgentRepository agentRepository;

    public DashboardService(MissionRepository missionRepository,
                            VehiculeRepository vehiculeRepository,
                            AffectationRepository affectationRepository,
                            AgentRepository agentRepository) {
        this.missionRepository = missionRepository;
        this.vehiculeRepository = vehiculeRepository;
        this.affectationRepository = affectationRepository;
        this.agentRepository = agentRepository;
    }

    /**
     * Récupère les statistiques globales de l'année courante
     */
    public Map<String, Object> getAnnualStats() {
        log.debug("le tableau annuel est en cours de récupération");
        int currentYear = LocalDate.now().getYear();
        return getStatsByYear(currentYear);
    }

    /**
     * Récupère les statistiques filtrées par année
     */
    public Map<String, Object> getStatsByYear(Integer year) {
        log.info("Fetching dashboard statistics for year: {}", year);
        if (year == null) {
            year = LocalDate.now().getYear();
        }

        Map<String, Object> stats = new HashMap<>();

        // Total missions
        long totalMissions = missionRepository.count();
        stats.put("totalMissions", totalMissions);
        log.debug("Total missions: {}", totalMissions);

        // Missions par statut
        Map<String, Long> missionsByStatus = new HashMap<>();
        missionsByStatus.put("PREVUE", countMissionsByStatus(StatutMission.PREVUE));
        missionsByStatus.put("INITIEE", countMissionsByStatus(StatutMission.INITIEE));
        missionsByStatus.put("ANNULEE", countMissionsByStatus(StatutMission.ANNULEE));
        missionsByStatus.put("CLOTUREE", countMissionsByStatus(StatutMission.CLOTUREE));
        stats.put("missionsByStatus", missionsByStatus);
        log.debug("Missions by status: {}", missionsByStatus);

        // Missions par direction (top 5)
        stats.put("missionsByDirection", missionRepository.countMissionsByDirectionTop5());

        // Chauffeur le plus sollicité
        var topChauffeur = affectationRepository.findMostUsedChauffeur();
        if (topChauffeur != null && !topChauffeur.isEmpty()) {
            Map<String, Object> chauffeurInfo = new HashMap<>();
            chauffeurInfo.put("nom", topChauffeur.get(0).toString());
            chauffeurInfo.put("nombreMissions", topChauffeur.get(1));
            stats.put("topChauffeur", chauffeurInfo);
            log.debug("Top driver: {}", chauffeurInfo);
        }

        // Véhicule le plus utilisé
        var topVehicule = vehiculeRepository.findMostUsedVehicle();
        if (topVehicule != null && !topVehicule.isEmpty()) {
            Map<String, Object> vehiculeInfo = new HashMap<>();
            vehiculeInfo.put("immatriculation", topVehicule.get(0).toString());
            vehiculeInfo.put("nombreMissions", topVehicule.get(1));
            stats.put("topVehicule", vehiculeInfo);
            log.debug("Top vehicle: {}", vehiculeInfo);
        }

        // Agents actifs
        stats.put("totalAgents", agentRepository.countByActif(true));
        stats.put("totalChauffeurs", agentRepository.countByEstChauffeurAndActif(true, true));

        // Véhicules disponibles
        stats.put("vehiculesDisponibles", vehiculeRepository.countByStatutAndActifTrue(
                com.carfo.gestion_missions.enums.StatutVehicule.DISPONIBLE));

        log.info("Dashboard statistics successfully retrieved for year: {}", year);
        return stats;
    }

    /**
     * Récupère les missions en cours (dans les 7 prochains jours)
     */
    public Map<String, Object> getUpcomingMissions() {
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);

        Map<String, Object> result = new HashMap<>();
        result.put("missions", missionRepository.findMissionsInDateRange(today, nextWeek));
        result.put("count", missionRepository.countMissionsInDateRange(today, nextWeek));

        return result;
    }

    /**
     * Compte les missions par statut
     */
    private long countMissionsByStatus(StatutMission status) {
        return missionRepository.countByStatut(status);
    }
}
