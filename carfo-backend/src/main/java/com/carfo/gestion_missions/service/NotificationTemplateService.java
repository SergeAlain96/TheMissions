package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.NotificationTemplate;
import com.carfo.gestion_missions.enums.NotificationType;
import com.carfo.gestion_missions.repository.NotificationTemplateRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CRUD + interpolation des templates de notifications.
 * Bootstrap automatique des templates par défaut au premier démarrage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationTemplateService {

    private final NotificationTemplateRepository repository;

    /** Templates par défaut (basés sur les chaînes initialement hardcodées dans MissionService). */
    private static final Map<NotificationType, String[]> DEFAULTS = Map.ofEntries(
            Map.entry(NotificationType.MISSION_SOUMISE, new String[]{
                    "Nouvelle mission à valider",
                    "La {direction} a soumis : {objet} ({dateDebut} → {dateFin})."
            }),
            Map.entry(NotificationType.AVIS_SG_FAVORABLE, new String[]{
                    "Avis SG favorable",
                    "« {objet} » a reçu un avis favorable du SG."
            }),
            Map.entry(NotificationType.AVIS_SG_DEFAVORABLE, new String[]{
                    "Avis SG défavorable",
                    "« {objet} » a reçu un avis défavorable du SG. Mission bloquée.{motifSuffix}"
            }),
            Map.entry(NotificationType.MISSION_VALIDEE, new String[]{
                    "Mission validée",
                    "« {objet} » ({dateDebut} → {dateFin}) est validée."
            }),
            Map.entry(NotificationType.MISSION_ANNULEE, new String[]{
                    "Mission annulée",
                    "« {objet} » a été annulée.{motifSuffix}"
            }),
            Map.entry(NotificationType.MISSION_CLOTUREE, new String[]{
                    "Mission clôturée — traitement RH",
                    "« {objet} » ({dateDebut} → {dateFin}) est clôturée. Fiche disponible pour la DRH."
            }),
            Map.entry(NotificationType.AFFECTATION_CREEE, new String[]{
                    "Affectation créée",
                    "« {objet} » : chauffeur {chauffeur}, véhicule {vehicule}."
            }),
            Map.entry(NotificationType.AFFECTATION_SUPPRIMEE, new String[]{
                    "Affectation supprimée",
                    "Votre affectation à « {objet} » a été annulée."
            }),
            Map.entry(NotificationType.ABSENCE_DECLAREE, new String[]{
                    "Nouvelle demande d'absence",
                    "{prenom} {nom} a déclaré une absence du {dateDebut} au {dateFin}."
            })
    );

    @PostConstruct
    @Transactional
    public void ensureBootstrap() {
        for (NotificationType type : NotificationType.values()) {
            if (!repository.existsById(type)) {
                String[] def = DEFAULTS.getOrDefault(type, new String[]{ type.name(), "" });
                repository.save(NotificationTemplate.builder()
                        .notificationType(type)
                        .titre(def[0])
                        .corps(def[1])
                        .actif(true)
                        .build());
            }
        }
        log.info("NotificationTemplateService : {} templates initialisés.", NotificationType.values().length);
    }

    @Transactional(readOnly = true)
    public List<NotificationTemplate> listAll() {
        return Arrays.stream(NotificationType.values())
                .map(t -> repository.findById(t).orElseGet(() -> defaultTemplate(t)))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<NotificationTemplate> findActive(NotificationType type) {
        return repository.findById(type).filter(NotificationTemplate::isActif);
    }

    @Transactional
    public NotificationTemplate update(NotificationType type, NotificationTemplate payload) {
        NotificationTemplate current = repository.findById(type).orElseGet(() -> defaultTemplate(type));
        if (payload.getTitre() != null && !payload.getTitre().isBlank()) {
            current.setTitre(payload.getTitre());
        }
        if (payload.getCorps() != null) {
            current.setCorps(payload.getCorps());
        }
        current.setActif(payload.isActif());
        current.setNotificationType(type);
        return repository.save(current);
    }

    /**
     * Interpole un texte avec un map de variables. {key} → value.
     * Si une clé n'est pas trouvée, elle est laissée telle quelle (utile au debug).
     */
    public String interpolate(String template, Map<String, String> vars) {
        if (template == null) return "";
        if (vars == null || vars.isEmpty()) return template;
        String result = template;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            String key = "{" + e.getKey() + "}";
            String val = e.getValue() == null ? "" : e.getValue();
            result = result.replace(key, val);
        }
        return result;
    }

    private NotificationTemplate defaultTemplate(NotificationType type) {
        String[] def = DEFAULTS.getOrDefault(type, new String[]{ type.name(), "" });
        return NotificationTemplate.builder()
                .notificationType(type)
                .titre(def[0])
                .corps(def[1])
                .actif(true)
                .build();
    }
}
