package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.MissionRequest;
import com.carfo.gestion_missions.dto.MissionViewDTO;
import com.carfo.gestion_missions.entity.*;
import com.carfo.gestion_missions.enums.NotificationType;
import com.carfo.gestion_missions.enums.RoleAgent;
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
    private final NotificationService notificationService;
    private final com.carfo.gestion_missions.repository.SessionSoumissionRepository sessionRepository;
    private final AppConfigService appConfigService;
    private final AuditService auditService;

    // ============================================================
    // SOUMETTRE UNE MISSION (règle des 10 jours)
    // ============================================================
    @Transactional
    public Mission soumettreMission(LocalDate dateDebut, LocalDate dateFin,
                                    String lieu, String objetMission,
                                    Long idDirection, List<Long> idAgents,
                                    List<String> rolesMission,
                                    Long idChefMission) {

        // Règle métier configurable (cf. onglet Paramètres → Règles métier)
        var cfg = appConfigService.get();
        int delaiMin = cfg.getDelaiMinJoursOuvrables() != null ? cfg.getDelaiMinJoursOuvrables() : 10;
        boolean excludeWeekends = Boolean.TRUE.equals(cfg.getExcludeWeekends());

        long jours = excludeWeekends
                ? com.carfo.gestion_missions.util.WorkingDaysUtil.workingDaysBetween(LocalDate.now(), dateDebut)
                : java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dateDebut);
        if (jours < delaiMin) {
            String unite = excludeWeekends ? "jours ouvrables" : "jours";
            throw new DelaiInsuffisantException(
                "Une mission doit être soumise au moins " + delaiMin + " " + unite + " avant la date de début. " +
                "Il reste seulement " + jours + " " + unite + "."
            );
        }

        // Mode strict des sessions : refuser la création hors session ouverte
        if (Boolean.TRUE.equals(cfg.getSessionStrictMode())
                && sessionRepository.findActive().isEmpty()) {
            throw new BusinessRuleException(
                "Aucune session de soumission n'est ouverte. Le mode strict est actif : "
                + "demandez au Chargé d'études d'ouvrir une session avant de soumettre."
            );
        }

        // Règle métier : date fin >= date début
        if (dateFin.isBefore(dateDebut)) {
            throw new BusinessRuleException("La date de fin ne peut pas être avant la date de début.");
        }

        Direction direction = directionRepository.findById(idDirection)
            .orElseThrow(() -> new ResourceNotFoundException("Direction introuvable : " + idDirection));

        LocalDateTime now = LocalDateTime.now();
        int annee = now.getYear();
        // Référence {prefix}-YYYY-NNN — NNN = (nb missions soumises cette année) + 1
        // Préfixe et padding paramétrables via AppConfig (Paramètres → Règles métier).
        long sequence = missionRepository.countSoumisesParAnnee(annee) + 1;
        String prefix = cfg.getReferencePrefix() != null ? cfg.getReferencePrefix() : "MIS";
        int padding = cfg.getReferenceNumberPadding() != null ? cfg.getReferenceNumberPadding() : 3;
        String reference = String.format("%s-%d-%0" + padding + "d", prefix, annee, sequence);

        // Rattachement à la session active du jour (mode souple : peut être null)
        var sessionActive = sessionRepository.findActive().orElse(null);

        Mission mission = Mission.builder()
                .reference(reference)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .lieu(lieu)
                .objetMission(objetMission)
                .statut(StatutMission.PREVUE)
                .dateSoumission(now)
                .direction(direction)
                .session(sessionActive)
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

        // Chef de mission : doit faire partie des participants
        if (idChefMission != null) {
            if (idAgents == null || !idAgents.contains(idChefMission)) {
                throw new BusinessRuleException(
                    "Le chef de mission doit faire partie des participants sélectionnés."
                );
            }
            Agent chef = agentRepository.findById(idChefMission)
                .orElseThrow(() -> new ResourceNotFoundException("Chef de mission introuvable : " + idChefMission));
            mission.setChefMission(chef);
            mission = missionRepository.save(mission);
        }

        // Audit
        auditService.log(com.carfo.gestion_missions.enums.AuditCategory.MISSION,
                "MISSION_SOUMETTRE", "Mission", mission.getIdMission(),
                "Soumission de " + reference + " — " + objetMission);

        // Notif : prévenir toutes les Secrétaires Générales d'une nouvelle mission à valider.
        // Utilise le template configurable (Paramètres → Notifications) avec fallback hardcodé.
        List<Agent> sgs = agentRepository.findByRoleAndActifTrue(RoleAgent.SECRETAIRE_GENERALE);
        notificationService.notifierTousTemplate(
                sgs,
                NotificationType.MISSION_SOUMISE,
                java.util.Map.of(
                        "direction", direction.getSigleDirection() != null ? direction.getSigleDirection() : "",
                        "objet",     objetMission != null ? objetMission : "",
                        "dateDebut", dateDebut.toString(),
                        "dateFin",   dateFin.toString(),
                        "reference", reference
                ),
                "Nouvelle mission à valider",
                String.format("La %s a soumis : %s (%s → %s)",
                        direction.getSigleDirection(), objetMission, dateDebut, dateFin),
                mission.getIdMission()
        );

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
    public Mission updateMission(Long idMission, MissionRequest request) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.PREVUE) {
            throw new BusinessRuleException("Une mission ne peut être modifiée qu'avant validation.");
        }

        var cfgUpd = appConfigService.get();
        int delaiMinUpd = cfgUpd.getDelaiMinJoursOuvrables() != null ? cfgUpd.getDelaiMinJoursOuvrables() : 10;
        boolean excludeWeekendsUpd = Boolean.TRUE.equals(cfgUpd.getExcludeWeekends());
        long joursUpd = excludeWeekendsUpd
                ? com.carfo.gestion_missions.util.WorkingDaysUtil.workingDaysBetween(LocalDate.now(), request.getDateDebut())
                : java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), request.getDateDebut());
        if (joursUpd < delaiMinUpd) {
            String unite = excludeWeekendsUpd ? "jours ouvrables" : "jours";
            throw new DelaiInsuffisantException(
                "Une mission doit être soumise au moins " + delaiMinUpd + " " + unite + " avant la date de début. " +
                "Il reste seulement " + joursUpd + " " + unite + "."
            );
        }

        if (request.getDateFin().isBefore(request.getDateDebut())) {
            throw new BusinessRuleException("La date de fin ne peut pas être avant la date de début.");
        }

        Direction direction = directionRepository.findById(request.getIdDirection())
            .orElseThrow(() -> new ResourceNotFoundException("Direction introuvable : " + request.getIdDirection()));

        mission.setDateDebut(request.getDateDebut());
        mission.setDateFin(request.getDateFin());
        mission.setLieu(request.getLieu());
        mission.setObjetMission(request.getObjetMission());
        mission.setDirection(direction);

        List<Long> idAgents = request.getIdAgents();
        if (idAgents != null) {
            participeRepository.deleteByMissionIdMission(idMission);
            if (!idAgents.isEmpty()) {
                List<Participe> participations = new ArrayList<>();
                List<String> rolesMission = request.getRolesMission();
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

        // Mise à jour du chef de mission (doit faire partie des participants)
        Long idChef = request.getIdChefMission();
        if (idChef != null) {
            if (idAgents == null || !idAgents.contains(idChef)) {
                throw new BusinessRuleException(
                    "Le chef de mission doit faire partie des participants sélectionnés."
                );
            }
            Agent chef = agentRepository.findById(idChef)
                .orElseThrow(() -> new ResourceNotFoundException("Chef de mission introuvable : " + idChef));
            mission.setChefMission(chef);
        } else if (idAgents != null) {
            // idAgents fournie sans chef : on retire l'ancien chef
            mission.setChefMission(null);
        }

        return missionRepository.save(mission);
    }

    // ============================================================
    // DONNER L'AVIS DU SECRÉTARIAT GÉNÉRAL (étape intermédiaire)
    // ============================================================
    @Transactional
    public Mission donnerAvisSG(Long idMission, boolean favorable, String motif) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.PREVUE) {
            throw new BusinessRuleException(
                "Seules les missions au statut PREVUE peuvent recevoir un avis du SG. Statut actuel : " + mission.getStatut()
            );
        }

        mission.setStatut(favorable ? StatutMission.AVIS_SG_FAVORABLE : StatutMission.AVIS_SG_DEFAVORABLE);
        mission.setMotifAvisSg(motif);
        Mission saved = missionRepository.save(mission);

        // Audit
        auditService.log(com.carfo.gestion_missions.enums.AuditCategory.MISSION,
                favorable ? "MISSION_AVIS_FAVORABLE" : "MISSION_AVIS_DEFAVORABLE",
                "Mission", idMission,
                "Avis SG " + (favorable ? "favorable" : "défavorable") + " sur "
                + (mission.getReference() != null ? mission.getReference() : ("#" + idMission))
                + (motif != null && !motif.isBlank() ? " — Motif : " + motif : ""));

        String sigle = mission.getDirection() != null ? mission.getDirection().getSigleDirection() : null;

        // Variables communes pour l'interpolation des templates
        java.util.Map<String, String> vars = new java.util.HashMap<>();
        vars.put("objet",       safeStr(mission.getObjetMission()));
        vars.put("reference",   safeStr(mission.getReference()));
        vars.put("dateDebut",   String.valueOf(mission.getDateDebut()));
        vars.put("dateFin",     String.valueOf(mission.getDateFin()));
        vars.put("direction",   safeStr(sigle));
        vars.put("motif",       safeStr(motif));
        vars.put("motifSuffix", (motif != null && !motif.isBlank()) ? " Motif : " + motif : "");

        if (favorable) {
            // Notif DMG : peut commencer l'affectation
            List<Agent> dmgs = agentRepository.findDmgAgents();
            notificationService.notifierTousTemplate(
                    dmgs, NotificationType.AVIS_SG_FAVORABLE, vars,
                    "Avis SG favorable — affectation possible",
                    String.format("« %s » (%s → %s) a reçu un avis favorable. Vous pouvez affecter un chauffeur et un véhicule.",
                            mission.getObjetMission(), mission.getDateDebut(), mission.getDateFin()),
                    idMission
            );
            // Notif DG : attend la validation finale
            List<Agent> dgs = agentRepository.findByRoleAndActifTrue(RoleAgent.DIRECTEUR);
            notificationService.notifierTousTemplate(
                    dgs, NotificationType.AVIS_SG_FAVORABLE, vars,
                    "Avis SG favorable — validation requise",
                    String.format("« %s » a reçu un avis favorable du SG. Validation finale à effectuer.",
                            mission.getObjetMission()),
                    idMission
            );
        }

        // Notif directeurs émetteurs
        if (sigle != null) {
            List<Agent> directeurs = agentRepository.findDirecteursParSigleDirection(sigle);
            NotificationType type = favorable
                    ? NotificationType.AVIS_SG_FAVORABLE
                    : NotificationType.AVIS_SG_DEFAVORABLE;
            String fallbackTitre = favorable ? "Avis SG favorable" : "Avis SG défavorable";
            String fallbackBody = favorable
                    ? String.format("« %s » a reçu un avis favorable du SG.", mission.getObjetMission())
                    : String.format("« %s » a reçu un avis défavorable du SG. Mission bloquée.%s",
                            mission.getObjetMission(),
                            (motif != null && !motif.isBlank()) ? " Motif : " + motif : "");
            notificationService.notifierTousTemplate(
                    directeurs, type, vars, fallbackTitre, fallbackBody, idMission
            );
        }
        return saved;
    }

    /** Helper local pour éviter les NPE lors de la construction de Map de vars. */
    private String safeStr(String s) { return s == null ? "" : s; }

    // ============================================================
    // VALIDER UNE MISSION (DG uniquement, après avis favorable du SG)
    // ============================================================
    @Transactional
    public Mission validerMission(Long idMission) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.AVIS_SG_FAVORABLE) {
            throw new BusinessRuleException(
                "Une mission ne peut être validée par le DG qu'après un avis favorable du SG. Statut actuel : " + mission.getStatut()
            );
        }

        mission.setStatut(StatutMission.INITIEE);
        Mission saved = missionRepository.save(mission);

        // Audit
        auditService.log(com.carfo.gestion_missions.enums.AuditCategory.MISSION,
                "MISSION_VALIDER", "Mission", idMission,
                "Validation DG de "
                + (mission.getReference() != null ? mission.getReference() : ("#" + idMission)));

        java.util.Map<String, String> vars = java.util.Map.of(
                "objet",     safeStr(mission.getObjetMission()),
                "reference", safeStr(mission.getReference()),
                "dateDebut", String.valueOf(mission.getDateDebut()),
                "dateFin",   String.valueOf(mission.getDateFin()),
                "direction", mission.getDirection() != null ? safeStr(mission.getDirection().getSigleDirection()) : ""
        );

        // Notif : prévenir le DMG qu'une affectation est à faire (si pas déjà fait)
        List<Agent> dmgs = agentRepository.findDmgAgents();
        notificationService.notifierTousTemplate(
                dmgs, NotificationType.MISSION_VALIDEE, vars,
                "Mission validée par le DG",
                String.format("« %s » (%s → %s) est validée et attend un chauffeur + véhicule.",
                        mission.getObjetMission(), mission.getDateDebut(), mission.getDateFin()),
                idMission
        );
        // Notif : prévenir les directeurs de la direction émettrice
        if (mission.getDirection() != null) {
            List<Agent> directeurs = agentRepository.findDirecteursParSigleDirection(
                    mission.getDirection().getSigleDirection());
            notificationService.notifierTousTemplate(
                    directeurs, NotificationType.MISSION_VALIDEE, vars,
                    "Votre mission est validée",
                    String.format("« %s » a été validée par le Directeur Général.", mission.getObjetMission()),
                    idMission
            );
        }
        return saved;
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
        Mission saved = missionRepository.save(mission);

        // Audit
        auditService.log(com.carfo.gestion_missions.enums.AuditCategory.MISSION,
                "MISSION_ANNULER", "Mission", idMission,
                "Annulation de "
                + (mission.getReference() != null ? mission.getReference() : ("#" + idMission))
                + (motif != null && !motif.isBlank() ? " — Motif : " + motif : ""));

        // Notif : prévenir les directeurs de la direction émettrice
        if (mission.getDirection() != null) {
            List<Agent> directeurs = agentRepository.findDirecteursParSigleDirection(
                    mission.getDirection().getSigleDirection());
            java.util.Map<String, String> varsAnn = java.util.Map.of(
                    "objet",       safeStr(mission.getObjetMission()),
                    "reference",   safeStr(mission.getReference()),
                    "motif",       safeStr(motif),
                    "motifSuffix", (motif != null && !motif.isBlank()) ? " Motif : " + motif : ""
            );
            notificationService.notifierTousTemplate(
                    directeurs, NotificationType.MISSION_ANNULEE, varsAnn,
                    "Mission annulée",
                    String.format("« %s » a été annulée. Motif : %s",
                            mission.getObjetMission(), motif != null ? motif : "non précisé"),
                    idMission
            );
        }
        return saved;
    }

    // ============================================================
    // PROLONGER UNE MISSION (Chargé d'étude)
    // ============================================================
    @Transactional
    public Mission prolongerMission(Long idMission, LocalDate nouvelleDateFin) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.INITIEE
                && mission.getStatut() != StatutMission.AVIS_SG_FAVORABLE
                && mission.getStatut() != StatutMission.PREVUE) {
            throw new BusinessRuleException(
                "Une mission ne peut être prolongée que tant qu'elle n'est pas clôturée ou annulée. Statut actuel : " + mission.getStatut()
            );
        }

        if (nouvelleDateFin == null) {
            throw new BusinessRuleException("La nouvelle date de fin est obligatoire.");
        }
        if (!nouvelleDateFin.isAfter(mission.getDateFin())) {
            throw new BusinessRuleException(
                "La nouvelle date de fin doit être strictement postérieure à la date de fin actuelle ("
                + mission.getDateFin() + ")."
            );
        }

        LocalDate ancienneDateFin = mission.getDateFin();
        mission.setDateFin(nouvelleDateFin);
        Mission saved = missionRepository.save(mission);

        java.util.Map<String, String> varsProl = java.util.Map.of(
                "objet",            safeStr(mission.getObjetMission()),
                "reference",        safeStr(mission.getReference()),
                "dateDebut",        String.valueOf(mission.getDateDebut()),
                "dateFin",          String.valueOf(nouvelleDateFin),
                "ancienneDateFin",  String.valueOf(ancienneDateFin),
                "nouvelleDateFin",  String.valueOf(nouvelleDateFin)
        );

        // Notif : prévenir le DMG (les chauffeurs et véhicules affectés peuvent être impactés)
        List<Agent> dmgs = agentRepository.findDmgAgents();
        notificationService.notifierTousTemplate(
                dmgs, NotificationType.MISSION_VALIDEE, varsProl,
                "Mission prolongée",
                String.format("« %s » prolongée jusqu'au %s (auparavant %s). Vérifiez les affectations.",
                        mission.getObjetMission(), nouvelleDateFin, ancienneDateFin),
                idMission
        );
        // Notif : directeurs émetteurs
        if (mission.getDirection() != null) {
            List<Agent> directeurs = agentRepository.findDirecteursParSigleDirection(
                    mission.getDirection().getSigleDirection());
            notificationService.notifierTousTemplate(
                    directeurs, NotificationType.MISSION_VALIDEE, varsProl,
                    "Votre mission a été prolongée",
                    String.format("« %s » : nouvelle date de fin %s.", mission.getObjetMission(), nouvelleDateFin),
                    idMission
            );
        }
        return saved;
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

        // Libérer tous les véhicules des affectations ACTIVE et marquer celles-ci comme ANNULEE
        // pour conserver l'historique tout en libérant les ressources.
        List<Affectation> actives = affectationRepository.findByMissionIdMissionAndStatut(
                idMission, com.carfo.gestion_missions.enums.StatutAffectation.ACTIVE);
        for (Affectation aff : actives) {
            Vehicule v = aff.getVehicule();
            if (v != null) {
                v.setStatut(com.carfo.gestion_missions.enums.StatutVehicule.DISPONIBLE);
                vehiculeRepository.save(v);
            }
            aff.setStatut(com.carfo.gestion_missions.enums.StatutAffectation.ANNULEE);
        }
        affectationRepository.saveAll(actives);

        Mission saved = missionRepository.save(mission);

        // Notif : DRH (la mission clôturée passe au traitement RH)
        List<Agent> drhs = agentRepository.findDirecteursParSigleDirection("DRH");
        java.util.Map<String, String> varsClo = java.util.Map.of(
                "objet",     safeStr(mission.getObjetMission()),
                "reference", safeStr(mission.getReference()),
                "dateDebut", String.valueOf(mission.getDateDebut()),
                "dateFin",   String.valueOf(mission.getDateFin())
        );
        notificationService.notifierTousTemplate(
                drhs, NotificationType.MISSION_CLOTUREE, varsClo,
                "Mission clôturée — traitement RH",
                String.format("« %s » (%s → %s) est clôturée. Fiche disponible pour la DRH.",
                        mission.getObjetMission(), mission.getDateDebut(), mission.getDateFin()),
                idMission
        );
        return saved;
    }

    // ============================================================
    // AFFECTER CHAUFFEUR ET VÉHICULE
    // ============================================================
    @Transactional
    public Affectation affecterRessources(Long idMission, Long idChauffeur, Long idVehicule) {
        Mission mission = getMissionById(idMission);

        if (mission.getStatut() != StatutMission.AVIS_SG_FAVORABLE
                && mission.getStatut() != StatutMission.INITIEE) {
            throw new BusinessRuleException(
                "Une mission ne peut être affectée qu'après un avis favorable du SG. Statut actuel : " + mission.getStatut()
            );
        }

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

        // Avec le multi-affect, un véhicule peut être EN_MISSION (déjà engagé sur une autre
        // mission). On accepte tant qu'il n'y a pas de chevauchement de période.
        if (!affectationRepository.findAffectationsVehiculeEnChevauchement(
                idVehicule, mission.getDateDebut(), mission.getDateFin()).isEmpty()) {
            throw new VehiculeIndisponibleException(
                "Le véhicule " + vehicule.getImmatriculation() + " est déjà engagé sur une mission qui chevauche cette période."
            );
        }

        // Capture des données dont on aura besoin pour les notifications, avant tout flush Hibernate.
        // Cela évite des lazy-loads après la perte éventuelle de session (LazyInitializationException).
        String objetMission   = mission.getObjetMission();
        LocalDate dateDebut   = mission.getDateDebut();
        LocalDate dateFin     = mission.getDateFin();
        String sigleDirection = mission.getDirection() != null ? mission.getDirection().getSigleDirection() : null;
        String prenomChauffeur = chauffeur.getPrenom();
        String nomChauffeur    = chauffeur.getNom();
        String marque         = vehicule.getMarque();
        String modele         = vehicule.getModele();
        String immat          = vehicule.getImmatriculation();

        // Multi-affect : on AJOUTE une affectation, on ne remplace pas l'existante.
        // Pour remplacer, le DMG doit explicitement annuler l'ancienne via removeAffectation.
        Affectation affectation = Affectation.builder()
                .mission(mission)
                .chauffeur(chauffeur)
                .vehicule(vehicule)
                .statut(com.carfo.gestion_missions.enums.StatutAffectation.ACTIVE)
                .build();

        // Mettre le véhicule en statut EN_MISSION
        vehicule.setStatut(StatutVehicule.EN_MISSION);
        vehiculeRepository.save(vehicule);

        Affectation saved = affectationRepository.save(affectation);

        // Audit
        auditService.log(com.carfo.gestion_missions.enums.AuditCategory.AFFECTATION,
                "AFFECTATION_CREER", "Affectation", saved.getIdAffectation(),
                "Affectation de " + prenomChauffeur + " " + nomChauffeur
                + " + " + marque + " " + modele + " (" + immat + ") sur "
                + (mission.getReference() != null ? mission.getReference() : ("#" + idMission)));

        java.util.Map<String, String> varsAff = java.util.Map.of(
                "objet",     safeStr(objetMission),
                "reference", safeStr(mission.getReference()),
                "dateDebut", String.valueOf(dateDebut),
                "dateFin",   String.valueOf(dateFin),
                "chauffeur", safeStr(prenomChauffeur) + " " + safeStr(nomChauffeur),
                "vehicule",  safeStr(marque) + " " + safeStr(modele) + " (" + safeStr(immat) + ")",
                "prenom",    safeStr(prenomChauffeur),
                "nom",       safeStr(nomChauffeur)
        );

        // Notif : prévenir le chauffeur
        notificationService.notifierTemplate(
                chauffeur, NotificationType.AFFECTATION_CREEE, varsAff,
                "Vous avez été affecté à une mission",
                String.format("« %s » du %s au %s — véhicule %s %s (%s).",
                        objetMission, dateDebut, dateFin, marque, modele, immat),
                idMission
        );

        // Notif : prévenir les directeurs de la direction émettrice
        if (sigleDirection != null) {
            List<Agent> directeurs = agentRepository.findDirecteursParSigleDirection(sigleDirection);
            notificationService.notifierTousTemplate(
                    directeurs, NotificationType.AFFECTATION_CREEE, varsAff,
                    "Mission affectée",
                    String.format("« %s » : chauffeur %s %s, véhicule %s %s.",
                            objetMission, prenomChauffeur, nomChauffeur, marque, modele),
                    idMission
            );
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<MissionViewDTO.AffectationView> getAffectationsByChauffeur(Long idChauffeur) {
        return affectationRepository.findByChauffeurIdAgent(idChauffeur).stream()
                .map(this::toAffectationView)
                .toList();
    }

    /**
     * Annule une affectation (soft-delete via statut ANNULEE). Libère le véhicule.
     * L'affectation reste visible dans l'historique de la mission.
     */
    @Transactional
    public void removeAffectation(Long idAffectation) {
        Affectation affectation = affectationRepository.findById(idAffectation)
            .orElseThrow(() -> new ResourceNotFoundException("Affectation introuvable : " + idAffectation));

        if (affectation.getStatut() == com.carfo.gestion_missions.enums.StatutAffectation.ANNULEE) {
            return; // déjà annulée — idempotent
        }

        Vehicule vehicule = affectation.getVehicule();
        if (vehicule != null) {
            // On ne libère le véhicule que s'il n'a pas d'autre affectation ACTIVE qui chevauche
            // (cas multi-mission). Recherche par chevauchement de période.
            boolean encoreEngage = !affectationRepository
                    .findAffectationsVehiculeEnChevauchement(vehicule.getIdVehicule(),
                            affectation.getMission().getDateDebut(),
                            affectation.getMission().getDateFin())
                    .stream()
                    .filter(a -> !a.getIdAffectation().equals(idAffectation))
                    .toList()
                    .isEmpty();
            if (!encoreEngage) {
                vehicule.setStatut(StatutVehicule.DISPONIBLE);
                vehiculeRepository.save(vehicule);
            }
        }

        affectation.setStatut(com.carfo.gestion_missions.enums.StatutAffectation.ANNULEE);
        affectationRepository.save(affectation);
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
        Mission mission = affectation.getMission();
        return new MissionViewDTO.AffectationView(
                affectation.getIdAffectation(),
                mission != null ? mission.getIdMission() : null,
                chauffeur != null ? chauffeur.getIdAgent() : null,
                chauffeur != null ? chauffeur.getNom() : null,
                chauffeur != null ? chauffeur.getPrenom() : null,
                vehicule != null ? vehicule.getIdVehicule() : null,
                vehicule != null ? vehicule.getImmatriculation() : null,
                vehicule != null ? vehicule.getMarque() : null,
                vehicule != null ? vehicule.getModele() : null,
                affectation.getStatut() != null ? affectation.getStatut().name() : null,
                affectation.getDateAffectation()
        );
    }

    @Transactional(readOnly = true)
    public List<MissionViewDTO.AffectationView> getAllAffectations() {
        return affectationRepository.findAll().stream()
                .map(this::toAffectationView)
                .toList();
    }

    private MissionViewDTO.MissionSummaryView toSummaryView(Mission mission) {
        return new MissionViewDTO.MissionSummaryView(
                mission.getIdMission(),
                mission.getReference(),
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

        List<MissionViewDTO.AffectationView> affectations = mission.getAffectations() == null
                ? List.of()
                : mission.getAffectations().stream()
                    .map(this::toAffectationView)
                    .filter(java.util.Objects::nonNull)
                    .sorted(Comparator.comparing(MissionViewDTO.AffectationView::dateAffectation,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();

        MissionViewDTO.ChefMissionView chefView = null;
        if (mission.getChefMission() != null) {
            Agent chef = mission.getChefMission();
            chefView = new MissionViewDTO.ChefMissionView(
                    chef.getIdAgent(),
                    chef.getNom(),
                    chef.getPrenom(),
                    chef.getMatricule()
            );
        }

        return new MissionViewDTO.MissionDetailView(
                mission.getIdMission(),
                mission.getReference(),
                mission.getDateDebut(),
                mission.getDateFin(),
                mission.getLieu(),
                mission.getObjetMission(),
                mission.getStatut(),
                mission.getDateSoumission(),
                mission.getMotifAnnulation(),
                mission.getMotifAvisSg(),
                mission.getDirection() != null ? mission.getDirection().getIdDirection() : null,
                mission.getDirection() != null ? mission.getDirection().getNomDirection() : null,
                chefView,
                participants,
                affectations
        );
    }
}
