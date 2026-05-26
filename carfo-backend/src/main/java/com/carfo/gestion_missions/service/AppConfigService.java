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
        // Identité institutionnelle
        current.setInstitutionNom(payload.getInstitutionNom());
        current.setInstitutionSigle(payload.getInstitutionSigle());
        current.setInstitutionPays(payload.getInstitutionPays());
        current.setInstitutionDevise(payload.getInstitutionDevise());
        current.setInstitutionAdresse(payload.getInstitutionAdresse());
        current.setInstitutionEmail(payload.getInstitutionEmail());
        current.setInstitutionTelephone(payload.getInstitutionTelephone());
        // Règles métier (seulement si valeurs non nulles dans le payload, pour ne pas écraser
        // accidentellement avec null si le formulaire ne les envoie pas)
        if (payload.getDelaiMinJoursOuvrables() != null) {
            // borne sécuritaire : 0 à 30 jours
            int v = Math.max(0, Math.min(30, payload.getDelaiMinJoursOuvrables()));
            current.setDelaiMinJoursOuvrables(v);
        }
        if (payload.getReferencePrefix() != null && !payload.getReferencePrefix().isBlank()) {
            current.setReferencePrefix(payload.getReferencePrefix().toUpperCase());
        }
        if (payload.getReferenceNumberPadding() != null) {
            int v = Math.max(2, Math.min(6, payload.getReferenceNumberPadding()));
            current.setReferenceNumberPadding(v);
        }
        if (payload.getAutoClosureEnabled() != null) {
            current.setAutoClosureEnabled(payload.getAutoClosureEnabled());
        }
        if (payload.getExcludeWeekends() != null) {
            current.setExcludeWeekends(payload.getExcludeWeekends());
        }
        if (payload.getSessionStrictMode() != null) {
            current.setSessionStrictMode(payload.getSessionStrictMode());
        }
        // Comptes & sécurité
        if (payload.getPasswordMinLength() != null) {
            int v = Math.max(4, Math.min(32, payload.getPasswordMinLength()));
            current.setPasswordMinLength(v);
        }
        if (payload.getPasswordRequireUppercase() != null) {
            current.setPasswordRequireUppercase(payload.getPasswordRequireUppercase());
        }
        if (payload.getPasswordRequireDigit() != null) {
            current.setPasswordRequireDigit(payload.getPasswordRequireDigit());
        }
        if (payload.getPasswordRequireSpecial() != null) {
            current.setPasswordRequireSpecial(payload.getPasswordRequireSpecial());
        }
        if (payload.getJwtExpirationHours() != null) {
            int v = Math.max(1, Math.min(168, payload.getJwtExpirationHours()));
            current.setJwtExpirationHours(v);
        }
        return repository.save(current);
    }
}
