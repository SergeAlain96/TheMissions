package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.AppConfig;
import com.carfo.gestion_missions.repository.AppConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Accès à la configuration globale (singleton id=1). Initialise les valeurs par défaut
 * au premier démarrage si la ligne n'existe pas encore.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppConfigService {

    private static final Long SINGLETON_ID = 1L;

    private final AppConfigRepository repository;

    @PostConstruct
    @Transactional
    public void ensureInitialized() {
        if (!repository.existsById(SINGLETON_ID)) {
            AppConfig cfg = AppConfig.builder()
                    .idConfig(SINGLETON_ID)
                    .institutionNom("Caisse Autonome de Retraite des Fonctionnaires")
                    .institutionSigle("CARFO")
                    .institutionPays("BURKINA FASO")
                    .institutionDevise("La patrie ou la mort, nous vaincrons")
                    .institutionAdresse("Direction Générale — Ouagadougou")
                    .build();
            repository.save(cfg);
            log.info("AppConfig: configuration par défaut initialisée.");
        }
    }

    @Transactional(readOnly = true)
    public AppConfig get() {
        return repository.findById(SINGLETON_ID).orElseGet(() -> {
            ensureInitialized();
            return repository.findById(SINGLETON_ID).orElseThrow();
        });
    }

    @Transactional
    public AppConfig update(AppConfig payload) {
        AppConfig current = get();
        current.setInstitutionNom(payload.getInstitutionNom());
        current.setInstitutionSigle(payload.getInstitutionSigle());
        current.setInstitutionPays(payload.getInstitutionPays());
        current.setInstitutionDevise(payload.getInstitutionDevise());
        current.setInstitutionAdresse(payload.getInstitutionAdresse());
        current.setInstitutionEmail(payload.getInstitutionEmail());
        current.setInstitutionTelephone(payload.getInstitutionTelephone());
        return repository.save(current);
    }
}
