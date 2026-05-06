package com.carfo.gestion_missions.service;

import java.util.List;
import java.util.Optional;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carfo.gestion_missions.entity.Absence;
import com.carfo.gestion_missions.enums.StatutAbsence;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.AbsenceRepository;

@Slf4j
@Service
@Transactional
public class AbsenceService {

    private static final String ABSENCE_NOT_FOUND = "Absence introuvable";

    private final AbsenceRepository absenceRepository;

    public AbsenceService(AbsenceRepository absenceRepository) {
        this.absenceRepository = absenceRepository;
    }

    public List<Absence> findAll() {
        log.debug("Fetching all absences");
        return absenceRepository.findAll();
    }

    public List<Absence> findByAgentId(Long agentId) {
        log.debug("Fetching absences for agent id: {}", agentId);
        return absenceRepository.findAll()
            .stream()
            .filter(a -> a.getAgent() != null && a.getAgent().getIdAgent() != null && a.getAgent().getIdAgent().equals(agentId))
            .toList();
    }

    public Optional<Absence> findById(Long id) {
        return absenceRepository.findById(id);
    }

    public Absence save(Absence absence) {
        return absenceRepository.save(absence);
    }

    public Absence update(Long id, Absence updated) {
        Absence existing = absenceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(ABSENCE_NOT_FOUND + " : " + id));
        existing.setDateDebut(updated.getDateDebut());
        existing.setDateFin(updated.getDateFin());
        existing.setMotif(updated.getMotif());
        existing.setStatut(updated.getStatut());
        existing.setAgent(updated.getAgent());
        return absenceRepository.save(existing);
    }

    public Absence approve(Long id) {
        Absence a = absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ABSENCE_NOT_FOUND + " : " + id));
        a.setStatut(StatutAbsence.APPROUVE);
        return absenceRepository.save(a);
    }

    public Absence reject(Long id) {
        Absence a = absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ABSENCE_NOT_FOUND + " : " + id));
        a.setStatut(StatutAbsence.REFUSE);
        return absenceRepository.save(a);
    }

    public void delete(Long id) {
        absenceRepository.deleteById(id);
    }
}
