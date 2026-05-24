package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.SessionSoumission;
import com.carfo.gestion_missions.exception.BusinessRuleException;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.SessionSoumissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionSoumissionService {

    private final SessionSoumissionRepository repository;

    @Transactional(readOnly = true)
    public List<SessionSoumission> listAll() {
        return repository.findAllSorted();
    }

    @Transactional(readOnly = true)
    public Optional<SessionSoumission> findActive() {
        return repository.findActive();
    }

    @Transactional(readOnly = true)
    public SessionSoumission getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session introuvable : " + id));
    }

    @Transactional
    public SessionSoumission create(SessionSoumission payload) {
        validate(payload);
        // Le CRUD frontend fournit titre/dates ; on ignore les champs serveur (id, dateCreation)
        SessionSoumission entity = SessionSoumission.builder()
                .titre(payload.getTitre())
                .description(payload.getDescription())
                .dateOuverture(payload.getDateOuverture())
                .dateFermeture(payload.getDateFermeture())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public SessionSoumission update(Long id, SessionSoumission payload) {
        SessionSoumission existing = getById(id);
        validate(payload);
        existing.setTitre(payload.getTitre());
        existing.setDescription(payload.getDescription());
        existing.setDateOuverture(payload.getDateOuverture());
        existing.setDateFermeture(payload.getDateFermeture());
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        SessionSoumission session = getById(id);
        if (session.getMissions() != null && !session.getMissions().isEmpty()) {
            throw new BusinessRuleException(
                "Impossible de supprimer une session qui contient des missions. Détachez-les d'abord."
            );
        }
        repository.delete(session);
    }

    private void validate(SessionSoumission s) {
        if (s.getTitre() == null || s.getTitre().isBlank()) {
            throw new BusinessRuleException("Le titre de la session est obligatoire.");
        }
        if (s.getDateOuverture() == null || s.getDateFermeture() == null) {
            throw new BusinessRuleException("Les dates d'ouverture et de fermeture sont obligatoires.");
        }
        if (s.getDateFermeture().isBefore(s.getDateOuverture())) {
            throw new BusinessRuleException("La date de fermeture doit être postérieure à la date d'ouverture.");
        }
    }
}
