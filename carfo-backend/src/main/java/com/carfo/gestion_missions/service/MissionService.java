package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.MissionViewDTO;
import com.carfo.gestion_missions.entity.*;
import com.carfo.gestion_missions.enums.StatutMission;
import com.carfo.gestion_missions.enums.StatutVehicule;
import com.carfo.gestion_missions.exception.*;
import com.carfo.gestion_missions.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MissionService {

    private static final String ROLE_MEMBRE = "MEMBRE";

    private final MissionRepository missionRepository;
    private final AgentRepository agentRepository;
    private final DirectionRepository directionRepository;
    private final ParticipeRepository participeRepository;
    private final AbsenceRepository absenceRepository;
    private final AffectationRepository affectationRepository;
    private final VehiculeRepository vehiculeRepository;

    // ============================================================
    // SOUMETTRE UNE MISSION (règle des 10 jours)
    // ============================================================
    @Transactional
    public Mission soumettreMission(LocalDate dateDebut, LocalDate dateFin,
                                    String lieu, String objetMission,
                                    Long idDirection, List<Long> idAgents,
                                    List<String> rolesMission) {

        // Règle métier : 10 jours d'anticipation minimum
        long joursAvant = ChronoUnit.DAYS.between(LocalDate.now(), dateDebut);
        if (joursAvant < 10) {
            throw new DelaiInsuffisantException(
                "Une mission doit être soumise au moins 10 jours avant la date de début. " +
                "Il reste seulement " + joursAvant + " jour(s)."
            );
        }

        // Règle métier : date fin >= date début
        if (dateFin.isBefore(dateDebut)) {
            throw new BusinessRuleException("La date de fin ne peut pas être avant la date de début.");
        }

        verifierChevauchement(dateDebut, dateFin, null);

        Direction direction = directionRepository.findById(idDirection)
            .orElseThrow(() -> new ResourceNotFoundException("Direction introuvable : " + idDirection));

        Mission mission = Mission.builder()
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .lieu(lieu)
                .objetMission(objetMission)
                .statut(StatutMission.PREVUE)
                .dateSoumission(LocalDateTime.now())
                .direction(direction)
                .build();

        mission = missionRepository.save(mission);

        // Ajouter les participants
        if (idAgents != null && !idAgents.isEmpty()) {
            List<Participe> participations = new ArrayList<>();
            for (int i = 0; i < idAgents.size(); i++) {
                Agent agent = agentRepository.findById(idAgents.get(i))
                    .orElseThrow(() -> new ResourceNotFoundException("Agent introuvable"));

                String role = (rolesMission != null && i < rolesMission.size())
                    ? rolesMission.get(i) : ROLE_MEMBRE;

                Participe p = Participe.builder()
                        .agent(agent)
                        .mission(mission)
                        .roleMission(role)
                        .build();
                participations.add(p);
            }
            participeRepository.saveAll(participations);
        }

        return mission;
    }

    @Transactional(readOnly = true)
    public List<MissionViewDTO.MissionSummaryView> getMissionsFiltrees(StatutMission statut,
                                                                       Long idDirection,
                                                                       LocalDate dateDebut,
                                                                       LocalDate dateFin) {
        List<Mission> missions;

        if (statut != null && idDirection != null) {
            missions = missionRepository.findByDirectionIdDirectionAndStatut(idDirection, statut);
        } else if (statut != null) {
            missions = missionRepository.findByStatut(statut);
        } else if (idDirection != null) {
            missions = missionRepository.findByDirectionIdDirection(idDirection);
        } else if (dateDebut != null && dateFin != null) {
            missions = missionRepository.findMissionsEnChevauchement(dateDebut, dateFin);
        } else {
            missions = missionRepository.findAll();
        }

        return missions.stream()
                .map(this::toSummaryView)
                .sorted(Comparator.comparing(MissionViewDTO.MissionSummaryView::dateDebut).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public MissionViewDTO.MissionDetailView getMissionDetail(Long idMission) {
        Mission mission = getMissionById(idMission);
        return toDetailView(mission);
    }

    @Transactional
    public Mission updateMission(Long idMission, LocalDate dateDebut, LocalDate dateFin,
                                 String lieu, String objetMission,
                                 Long idDirection, List<Long> idAgents,
                                 List<String> rolesMission) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.PREVUE) {
            throw new BusinessRuleException("Une mission ne peut être modifiée qu'avant validation.");
        }

        long joursAvant = ChronoUnit.DAYS.between(LocalDate.now(), dateDebut);
        if (joursAvant < 10) {
            throw new DelaiInsuffisantException(
                "Une mission doit être soumise au moins 10 jours avant la date de début. " +
                "Il reste seulement " + joursAvant + " jour(s)."
            );
        }

        if (dateFin.isBefore(dateDebut)) {
            throw new BusinessRuleException("La date de fin ne peut pas être avant la date de début.");
        }

        verifierChevauchement(dateDebut, dateFin, idMission);

        Direction direction = directionRepository.findById(idDirection)
            .orElseThrow(() -> new ResourceNotFoundException("Direction introuvable : " + idDirection));

        mission.setDateDebut(dateDebut);
        mission.setDateFin(dateFin);
        mission.setLieu(lieu);
        mission.setObjetMission(objetMission);
        mission.setDirection(direction);

        if (idAgents != null) {
            participeRepository.deleteByMissionIdMission(idMission);
            if (!idAgents.isEmpty()) {
                List<Participe> participations = new ArrayList<>();
                for (int i = 0; i < idAgents.size(); i++) {
                    Long idAgent = idAgents.get(i);
                    Agent agent = agentRepository.findById(idAgent)
                        .orElseThrow(() -> new ResourceNotFoundException("Agent introuvable : " + idAgent));

                        String role = (rolesMission != null && i < rolesMission.size())
                            ? rolesMission.get(i) : ROLE_MEMBRE;

                    participations.add(Participe.builder()
                            .agent(agent)
                            .mission(mission)
                            .roleMission(role)
                            .build());
                }
                participeRepository.saveAll(participations);
            }
        }

        return missionRepository.save(mission);
    }

    // ============================================================
    // VALIDER UNE MISSION
    // ============================================================
    @Transactional
    public Mission validerMission(Long idMission) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.PREVUE &&
            mission.getStatut() != StatutMission.INITIEE) {
            throw new BusinessRuleException(
                "Impossible de valider une mission avec le statut : " + mission.getStatut()
            );
        }

        mission.setStatut(StatutMission.INITIEE);
        return missionRepository.save(mission);
    }

    // ============================================================
    // ANNULER UNE MISSION
    // ============================================================
    @Transactional
    public Mission annulerMission(Long idMission, String motif) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() == StatutMission.CLOTUREE) {
            throw new BusinessRuleException("Impossible d'annuler une mission déjà clôturée.");
        }

        mission.setStatut(StatutMission.ANNULEE);
        mission.setMotifAnnulation(motif);
        return missionRepository.save(mission);
    }

    // ============================================================
    // CLÔTURER UNE MISSION
    // ============================================================
    @Transactional
    public Mission cloturerMission(Long idMission) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.INITIEE) {
            throw new BusinessRuleException(
                "Seules les missions initiées peuvent être clôturées."
            );
        }

        mission.setStatut(StatutMission.CLOTUREE);

        // Libérer le véhicule si affecté
        if (mission.getAffectation() != null) {
            Vehicule vehicule = mission.getAffectation().getVehicule();
            vehicule.setStatut(com.carfo.gestion_missions.enums.StatutVehicule.DISPONIBLE);
            vehiculeRepository.save(vehicule);
        }

        return missionRepository.save(mission);
    }

    // ============================================================
    // AFFECTER CHAUFFEUR ET VÉHICULE
    // ============================================================
    @Transactional
    public Affectation affecterRessources(Long idMission, Long idChauffeur, Long idVehicule) {
        Mission mission = getMissionById(idMission);

        Agent chauffeur = agentRepository.findById(idChauffeur)
            .orElseThrow(() -> new ResourceNotFoundException("Chauffeur introuvable : " + idChauffeur));

        if (!chauffeur.isEstChauffeur()) {
            throw new ChauffeurIndisponibleException("L'agent sélectionné n'est pas un chauffeur.");
        }

        if (!absenceRepository.findAbsencesEnChevauchement(idChauffeur, mission.getDateDebut(), mission.getDateFin()).isEmpty()) {
            throw new ChauffeurIndisponibleException("Le chauffeur est en absence approuvée sur cette période.");
        }

        if (!affectationRepository.findAffectationsChauffeurEnChevauchement(idChauffeur, mission.getDateDebut(), mission.getDateFin()).isEmpty()) {
            throw new ChauffeurIndisponibleException("Le chauffeur est déjà affecté à une autre mission sur cette période.");
        }

        Vehicule vehicule = vehiculeRepository.findById(idVehicule)
            .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable : " + idVehicule));

        if (vehicule.getStatut() != StatutVehicule.DISPONIBLE) {
            throw new VehiculeIndisponibleException(
                "Le véhicule " + vehicule.getImmatriculation() + " n'est pas disponible."
            );
        }

        // Supprimer l'ancienne affectation si elle existe
        affectationRepository.findByMissionIdMission(idMission)
                .ifPresent(affectationRepository::delete);

        // Créer la nouvelle affectation
        Affectation affectation = Affectation.builder()
                .mission(mission)
                .chauffeur(chauffeur)
                .vehicule(vehicule)
                .build();

        // Mettre le véhicule en statut EN_MISSION
        vehicule.setStatut(StatutVehicule.EN_MISSION);
        vehiculeRepository.save(vehicule);

        return affectationRepository.save(affectation);
    }

    @Transactional(readOnly = true)
    public List<MissionViewDTO.AffectationView> getAffectationsByChauffeur(Long idChauffeur) {
        return affectationRepository.findByChauffeurIdAgent(idChauffeur).stream()
                .map(this::toAffectationView)
                .toList();
    }

    @Transactional
    public void removeAffectation(Long idMission) {
        Affectation affectation = affectationRepository.findByMissionIdMission(idMission)
            .orElseThrow(() -> new ResourceNotFoundException("Affectation introuvable pour la mission : " + idMission));

        Vehicule vehicule = affectation.getVehicule();
        if (vehicule != null) {
            vehicule.setStatut(StatutVehicule.DISPONIBLE);
            vehiculeRepository.save(vehicule);
        }

        affectationRepository.delete(affectation);
    }

    // ============================================================
    // GETTERS
    // ============================================================

    public Mission getMissionById(Long idMission) {
        return missionRepository.findById(idMission)
                .orElseThrow(() -> new MissionNotFoundException("Mission introuvable : " + idMission));
    }

    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    public List<Mission> getMissionsByStatut(StatutMission statut) {
        return missionRepository.findByStatut(statut);
    }

    public List<Mission> getMissionsByDirection(Long idDirection) {
        return missionRepository.findByDirectionIdDirection(idDirection);
    }

    public List<Mission> getMissionsAVenir() {
        return missionRepository.findMissionsAVenir(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<MissionViewDTO.ParticipantView> getParticipants(Long idMission) {
        return participeRepository.findByMissionIdMission(idMission).stream()
                .map(this::toParticipantView)
                .toList();
    }

    @Transactional
    public List<MissionViewDTO.ParticipantView> addParticipants(Long idMission, List<Long> idAgents, List<String> rolesMission) {
        Mission mission = getMissionById(idMission);
        if (idAgents == null || idAgents.isEmpty()) {
            return participeRepository.findByMissionIdMission(idMission).stream()
                    .map(this::toParticipantView)
                    .toList();
        }

        List<Participe> participations = new ArrayList<>();
        for (int i = 0; i < idAgents.size(); i++) {
            Long idAgent = idAgents.get(i);
            if (participeRepository.existsByAgentIdAgentAndMissionIdMission(idAgent, idMission)) {
                continue;
            }

            Agent agent = agentRepository.findById(idAgent)
                    .orElseThrow(() -> new ResourceNotFoundException("Agent introuvable : " + idAgent));
            String role = (rolesMission != null && i < rolesMission.size()) ? rolesMission.get(i) : ROLE_MEMBRE;

            participations.add(Participe.builder()
                    .agent(agent)
                    .mission(mission)
                    .roleMission(role)
                    .build());
        }

        if (!participations.isEmpty()) {
            participeRepository.saveAll(participations);
        }

        return participeRepository.findByMissionIdMission(idMission).stream()
            .map(this::toParticipantView)
            .toList();
    }

    @Transactional
    public void removeParticipant(Long idMission, Long idAgent) {
        List<Participe> participations = participeRepository.findByMissionIdMission(idMission);
        participations.stream()
                .filter(p -> p.getAgent() != null && idAgent.equals(p.getAgent().getIdAgent()))
                .findFirst()
                .ifPresent(participeRepository::delete);
    }

    private void verifierChevauchement(LocalDate dateDebut, LocalDate dateFin, Long missionIdIgnore) {
        List<Mission> collisions = missionRepository.findMissionsEnChevauchement(dateDebut, dateFin);
        boolean conflit = collisions.stream()
                .anyMatch(m -> missionIdIgnore == null || !missionIdIgnore.equals(m.getIdMission()));
        if (conflit) {
            throw new BusinessRuleException("Une autre mission existe déjà sur cette période.");
        }
    }

    private MissionViewDTO.ParticipantView toParticipantView(Participe participe) {
        Agent agent = participe.getAgent();
        return new MissionViewDTO.ParticipantView(
                agent.getIdAgent(),
                agent.getNom(),
                agent.getPrenom(),
                agent.getMatricule(),
                participe.getRoleMission()
        );
    }

    private MissionViewDTO.AffectationView toAffectationView(Affectation affectation) {
        if (affectation == null) {
            return null;
        }
        Agent chauffeur = affectation.getChauffeur();
        Vehicule vehicule = affectation.getVehicule();
        return new MissionViewDTO.AffectationView(
                affectation.getIdAffectation(),
                chauffeur != null ? chauffeur.getIdAgent() : null,
                chauffeur != null ? chauffeur.getNom() : null,
                chauffeur != null ? chauffeur.getPrenom() : null,
                vehicule != null ? vehicule.getIdVehicule() : null,
                vehicule != null ? vehicule.getImmatriculation() : null,
                vehicule != null ? vehicule.getMarque() : null,
                vehicule != null ? vehicule.getModele() : null
        );
    }

    private MissionViewDTO.MissionSummaryView toSummaryView(Mission mission) {
        return new MissionViewDTO.MissionSummaryView(
                mission.getIdMission(),
                mission.getDateDebut(),
                mission.getDateFin(),
                mission.getLieu(),
                mission.getObjetMission(),
                mission.getStatut(),
                mission.getDateSoumission(),
                mission.getDirection() != null ? mission.getDirection().getIdDirection() : null,
                mission.getDirection() != null ? mission.getDirection().getNomDirection() : null
        );
    }

    private MissionViewDTO.MissionDetailView toDetailView(Mission mission) {
        List<MissionViewDTO.ParticipantView> participants = mission.getParticipants() == null
                ? List.of()
                : mission.getParticipants().stream().map(this::toParticipantView).toList();

        return new MissionViewDTO.MissionDetailView(
                mission.getIdMission(),
                mission.getDateDebut(),
                mission.getDateFin(),
                mission.getLieu(),
                mission.getObjetMission(),
                mission.getStatut(),
                mission.getDateSoumission(),
                mission.getMotifAnnulation(),
                mission.getDirection() != null ? mission.getDirection().getIdDirection() : null,
                mission.getDirection() != null ? mission.getDirection().getNomDirection() : null,
                participants,
                toAffectationView(mission.getAffectation())
        );
    }
}
