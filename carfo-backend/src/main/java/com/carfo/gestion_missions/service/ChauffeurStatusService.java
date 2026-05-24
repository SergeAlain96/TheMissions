package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.ChauffeurStatusView;
import com.carfo.gestion_missions.entity.Absence;
import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.enums.StatutChauffeur;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.AbsenceRepository;
import com.carfo.gestion_missions.repository.AffectationRepository;
import com.carfo.gestion_missions.repository.AgentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChauffeurStatusService {

    private final AgentRepository agentRepository;
    private final AbsenceRepository absenceRepository;
    private final AffectationRepository affectationRepository;

    /**
     * Liste tous les chauffeurs actifs avec leur statut effectif calculé.
     * Le statut effectif est déterminé dans l'ordre :
     *   1. ABSENT       — une absence approuvée couvre aujourd'hui
     *   2. EN_MISSION   — chauffeur affecté à une mission INITIEE couvrant aujourd'hui
     *   3. INDISPONIBLE — statut manuel INDISPONIBLE et dateDisponibilite future (ou nulle)
     *   4. DISPONIBLE   — sinon
     */
    @Transactional(readOnly = true)
    public List<ChauffeurStatusView> listChauffeurStatuses() {
        LocalDate today = LocalDate.now();

        List<Agent> chauffeurs = agentRepository.findAllChauffeurs();

        // Index des absences en cours par idAgent → date_fin
        Map<Long, LocalDate> absentTodayUntil = new HashMap<>();
        for (Absence abs : absenceRepository.findApprouveesContenantDate(today)) {
            if (abs.getAgent() != null) {
                absentTodayUntil.put(abs.getAgent().getIdAgent(), abs.getDateFin());
            }
        }

        // Index des affectations actives par idAgent (chauffeur) → référence mission
        Map<Long, String> onMissionRef = new HashMap<>();
        for (Affectation aff : affectationRepository.findActivesAtDate(today)) {
            if (aff.getChauffeur() != null && aff.getMission() != null) {
                String ref = aff.getMission().getReference() != null
                        ? aff.getMission().getReference()
                        : "#" + aff.getMission().getIdMission();
                onMissionRef.put(aff.getChauffeur().getIdAgent(), ref);
            }
        }

        return chauffeurs.stream()
                .map(c -> toView(c, today, absentTodayUntil, onMissionRef))
                .sorted(Comparator.comparing((ChauffeurStatusView v) -> v.statutEffectif().ordinal())
                        .thenComparing(ChauffeurStatusView::nom))
                .toList();
    }

    /**
     * Met à jour le statut manuel d'un chauffeur (DMG only).
     * Seul DISPONIBLE et INDISPONIBLE sont acceptés ici ; EN_MISSION et ABSENT sont dérivés.
     */
    @Transactional
    public ChauffeurStatusView updateStatutManuel(Long idAgent, StatutChauffeur statut, LocalDate dateDisponibilite) {
        if (statut != StatutChauffeur.DISPONIBLE && statut != StatutChauffeur.INDISPONIBLE) {
            throw new IllegalArgumentException(
                "Seuls DISPONIBLE et INDISPONIBLE peuvent être posés manuellement. EN_MISSION et ABSENT sont automatiques."
            );
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new ResourceNotFoundException("Agent introuvable : " + idAgent));
        if (!agent.isEstChauffeur()) {
            throw new IllegalArgumentException("Cet agent n'est pas un chauffeur (idAgent=" + idAgent + ").");
        }

        agent.setStatutChauffeur(statut);
        // dateDisponibilite ne fait sens qu'en INDISPONIBLE ; remise à null si DISPONIBLE
        agent.setDateDisponibilite(statut == StatutChauffeur.INDISPONIBLE ? dateDisponibilite : null);
        agentRepository.save(agent);

        // Recalculer la vue effective pour ce chauffeur seul
        return listChauffeurStatuses().stream()
                .filter(v -> idAgent.equals(v.idAgent()))
                .findFirst()
                .orElseThrow();
    }

    private ChauffeurStatusView toView(Agent c,
                                       LocalDate today,
                                       Map<Long, LocalDate> absentTodayUntil,
                                       Map<Long, String> onMissionRef) {
        StatutChauffeur manuel = c.getStatutChauffeur() != null ? c.getStatutChauffeur() : StatutChauffeur.DISPONIBLE;

        // Auto-clear de l'INDISPONIBILITÉ expirée (lecture seule — on ne persiste pas le clear ici
        // pour éviter d'écrire en base sur un GET ; le DMG verra "DISPONIBLE" et pourra
        // confirmer en ré-éditant le statut, ou un job de maintenance pourra nettoyer plus tard).
        StatutChauffeur manuelEffectif = manuel;
        if (manuel == StatutChauffeur.INDISPONIBLE
                && c.getDateDisponibilite() != null
                && !c.getDateDisponibilite().isAfter(today)) {
            manuelEffectif = StatutChauffeur.DISPONIBLE;
        }

        StatutChauffeur effectif;
        LocalDate absenceFin = absentTodayUntil.get(c.getIdAgent());
        String missionRef = onMissionRef.get(c.getIdAgent());

        if (absenceFin != null) {
            effectif = StatutChauffeur.ABSENT;
        } else if (missionRef != null) {
            effectif = StatutChauffeur.EN_MISSION;
        } else if (manuelEffectif == StatutChauffeur.INDISPONIBLE) {
            effectif = StatutChauffeur.INDISPONIBLE;
        } else {
            effectif = StatutChauffeur.DISPONIBLE;
        }

        return new ChauffeurStatusView(
                c.getIdAgent(),
                c.getNom(),
                c.getPrenom(),
                c.getMatricule(),
                c.getTelephone(),
                manuel,
                effectif,
                c.getDateDisponibilite(),
                missionRef,
                absenceFin
        );
    }
}
