package com.carfo.gestion_missions.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carfo.gestion_missions.enums.StatutMission;
import com.carfo.gestion_missions.repository.AffectationRepository;
import com.carfo.gestion_missions.repository.MissionRepository;
import com.carfo.gestion_missions.repository.VehiculeRepository;
import com.carfo.gestion_missions.repository.AgentRepository;

import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Vehicule;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
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

        // Chauffeur le plus sollicité — la requête renvoie [nom, count]
        var topChauffeurResult = affectationRepository.findMostUsedChauffeur();
        if (topChauffeurResult != null && !topChauffeurResult.isEmpty()) {
            Object[] row = topChauffeurResult.get(0);
            if (row != null && row.length >= 2) {
                Map<String, Object> chauffeurInfo = new HashMap<>();
                chauffeurInfo.put("nom", String.valueOf(row[0]));
                chauffeurInfo.put("nombreMissions", row[1]);
                stats.put("topChauffeur", chauffeurInfo);
            }
        }

        // Véhicule le plus utilisé — la requête renvoie [immatriculation, count]
        var topVehiculeResult = vehiculeRepository.findMostUsedVehicle();
        if (topVehiculeResult != null && !topVehiculeResult.isEmpty()) {
            Object[] row = topVehiculeResult.get(0);
            if (row != null && row.length >= 2) {
                Map<String, Object> vehiculeInfo = new HashMap<>();
                vehiculeInfo.put("immatriculation", String.valueOf(row[0]));
                vehiculeInfo.put("nombreMissions", row[1]);
                stats.put("topVehicule", vehiculeInfo);
            }
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
     * Module Statistiques — payload spécialisé filtré strictement par année.
     * Renvoie les 6 métriques attendues par la page /statistiques :
     *  total, validated, cancelled, pending, byDirection, byMonth.
     */
    /** Surcharge par année (défaut = 1er janv → 31 déc de l'année). */
    public Map<String, Object> getStatistics(Integer year) {
        int annee = (year != null) ? year : LocalDate.now().getYear();
        return getStatistics(LocalDate.of(annee, 1, 1), LocalDate.of(annee, 12, 31));
    }

    /**
     * Module Statistiques filtré par plage de dates (dateDebut des missions ∈ [from, to]).
     * Si from/to nuls → année courante.
     */
    public Map<String, Object> getStatistics(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now();
        if (from == null) from = LocalDate.of(today.getYear(), 1, 1);
        if (to == null)   to   = LocalDate.of(today.getYear(), 12, 31);
        // Sécurité : si bornes inversées, on les remet dans l'ordre
        if (to.isBefore(from)) { LocalDate tmp = from; from = to; to = tmp; }
        log.info("Computing statistics from {} to {}", from, to);

        Map<String, Object> stats = new HashMap<>();
        stats.put("year", from.getYear());
        stats.put("from", from.toString());
        stats.put("to",   to.toString());

        long total      = missionRepository.countMissionsInRange(from, to);
        long validated  = missionRepository.countByStatutAndRange(StatutMission.INITIEE, from, to);
        long cancelled  = missionRepository.countByStatutAndRange(StatutMission.ANNULEE, from, to);
        long closed     = missionRepository.countByStatutAndRange(StatutMission.CLOTUREE, from, to);
        long prevue     = missionRepository.countByStatutAndRange(StatutMission.PREVUE, from, to);
        long avisFav    = missionRepository.countByStatutAndRange(StatutMission.AVIS_SG_FAVORABLE, from, to);
        long avisDefav  = missionRepository.countByStatutAndRange(StatutMission.AVIS_SG_DEFAVORABLE, from, to);

        long pending = prevue + avisFav;

        stats.put("totalMissions",      total);
        stats.put("missionsValidated",  validated);
        stats.put("missionsCancelled",  cancelled);
        stats.put("missionsClosed",     closed);
        stats.put("missionsPending",    pending);

        Map<String, Long> byStatus = new HashMap<>();
        byStatus.put("PREVUE",              prevue);
        byStatus.put("AVIS_SG_FAVORABLE",   avisFav);
        byStatus.put("AVIS_SG_DEFAVORABLE", avisDefav);
        byStatus.put("INITIEE",             validated);
        byStatus.put("CLOTUREE",            closed);
        byStatus.put("ANNULEE",             cancelled);
        stats.put("missionsByStatus", byStatus);

        var byDirection = missionRepository.countMissionsByDirectionInRange(from, to).stream()
                .map(row -> Map.of("direction", String.valueOf(row[0]), "count", row[1]))
                .toList();
        stats.put("missionsByDirection", byDirection);

        long[] byMonth = new long[12];
        for (Object[] row : missionRepository.countMissionsByMonthInRange(from, to)) {
            int mois = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            if (mois >= 1 && mois <= 12) byMonth[mois - 1] = count;
        }
        stats.put("missionsByMonth", byMonth);

        stats.put("chauffeurStats", buildChauffeurStats(from, to));
        stats.put("vehiculeStats",  buildVehiculeStats(from, to));

        var topLieux = missionRepository.findTopLieuxInRange(from, to).stream()
                .map(row -> Map.of("lieu", String.valueOf(row[0]), "count", row[1]))
                .toList();
        stats.put("topLieux", topLieux);

        Map<String, Object> ressources = new HashMap<>();
        ressources.put("totalAgents",          agentRepository.countByActif(true));
        ressources.put("totalChauffeurs",      agentRepository.countByEstChauffeurAndActif(true, true));
        ressources.put("vehiculesDisponibles", vehiculeRepository.countByStatutAndActifTrue(
                com.carfo.gestion_missions.enums.StatutVehicule.DISPONIBLE));
        stats.put("ressources", ressources);

        // Comparaison période précédente de même durée (N-1 décalée)
        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevTo = from.minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);
        Map<String, Long> prevKpi = new HashMap<>();
        prevKpi.put("total",     missionRepository.countMissionsInRange(prevFrom, prevTo));
        prevKpi.put("validated", missionRepository.countByStatutAndRange(StatutMission.INITIEE, prevFrom, prevTo));
        prevKpi.put("cancelled", missionRepository.countByStatutAndRange(StatutMission.ANNULEE, prevFrom, prevTo));
        prevKpi.put("pending",
                missionRepository.countByStatutAndRange(StatutMission.PREVUE, prevFrom, prevTo)
              + missionRepository.countByStatutAndRange(StatutMission.AVIS_SG_FAVORABLE, prevFrom, prevTo));
        Map<String, Object> previousYear = new HashMap<>();
        previousYear.put("year", prevFrom.getYear());
        previousYear.put("kpi",  prevKpi);
        stats.put("previousYear", previousYear);

        return stats;
    }

    private Map<String, Object> buildVehiculeStats(LocalDate from, LocalDate to) {
        var vehicules = vehiculeRepository.findByActifTrue();

        Map<Long, Long> countById = new HashMap<>();
        for (Object[] row : affectationRepository.countAffectationsByVehiculeInRange(from, to)) {
            Long id    = ((Number) row[0]).longValue();
            Long count = ((Number) row[1]).longValue();
            countById.put(id, count);
        }

        List<Map<String, Object>> activity = vehicules.stream()
                .map(v -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("idVehicule",      v.getIdVehicule());
                    entry.put("immatriculation", v.getImmatriculation());
                    entry.put("marque",          v.getMarque());
                    entry.put("modele",          v.getModele());
                    entry.put("missions",        countById.getOrDefault(v.getIdVehicule(), 0L));
                    return entry;
                })
                .sorted(Comparator.comparingLong(
                        (Map<String, Object> m) -> ((Number) m.get("missions")).longValue()).reversed())
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("missionsPerVehicule", activity);

        Map<String, Object> top = activity.stream()
                .filter(m -> ((Number) m.get("missions")).longValue() > 0)
                .findFirst()
                .orElse(null);
        result.put("topVehicule", top);

        Map<String, Object> least = activity.stream()
                .filter(m -> ((Number) m.get("missions")).longValue() > 0)
                .reduce((a, b) -> b)
                .orElse(null);
        result.put("leastVehicule", least);

        return result;
    }

    /**
     * Construit la liste d'activité des chauffeurs pour l'année.
     * Renvoie une List<Map> triée par nombre de missions DESC, avec en bonus topChauffeur
     * et leastChauffeur côté payload sous une forme aplatie.
     */
    private Map<String, Object> buildChauffeurStats(LocalDate from, LocalDate to) {
        // 1. Tous les chauffeurs actifs (même à 0 affectation)
        List<Agent> chauffeurs = agentRepository.findAllChauffeurs();

        // 2. Counts par chauffeur ayant affecté au moins 1 mission sur la période
        Map<Long, Long> countByIdAgent = new HashMap<>();
        for (Object[] row : affectationRepository.countAffectationsByChauffeurInRange(from, to)) {
            Long idAgent = ((Number) row[0]).longValue();
            Long count   = ((Number) row[1]).longValue();
            countByIdAgent.put(idAgent, count);
        }

        // 3. Fusion + tri DESC (le plus actif en premier)
        List<Map<String, Object>> activity = chauffeurs.stream()
                .map(c -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("idAgent",     c.getIdAgent());
                    entry.put("nom",         c.getNom());
                    entry.put("prenom",      c.getPrenom());
                    entry.put("matricule",   c.getMatricule());
                    entry.put("missions",    countByIdAgent.getOrDefault(c.getIdAgent(), 0L));
                    return entry;
                })
                .sorted(Comparator.comparingLong((Map<String, Object> m) -> ((Number) m.get("missions")).longValue()).reversed())
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("missionsPerChauffeur", activity);

        // Top = premier ayant strictement > 0 mission
        Map<String, Object> top = activity.stream()
                .filter(m -> ((Number) m.get("missions")).longValue() > 0)
                .findFirst()
                .orElse(null);
        result.put("topChauffeur", top);

        // Least = dernier ayant strictement > 0 mission (pas d'intérêt de retourner un 0 ici)
        Map<String, Object> least = activity.stream()
                .filter(m -> ((Number) m.get("missions")).longValue() > 0)
                .reduce((a, b) -> b)
                .orElse(null);
        result.put("leastChauffeur", least);

        return result;
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
