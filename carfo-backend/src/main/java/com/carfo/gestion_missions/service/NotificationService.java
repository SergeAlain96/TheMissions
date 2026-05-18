package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.NotificationView;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Notification;
import com.carfo.gestion_missions.enums.NotificationType;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.NotificationRepository;
import com.carfo.gestion_missions.security.SecurityChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SecurityChecker securityChecker;

    // ------------------------------------------------------------------
    // PRODUCTION : appelée par les services métier sur événements
    // ------------------------------------------------------------------

    @Transactional
    public void notifier(Agent destinataire, NotificationType type, String titre, String message, Long idMission) {
        if (destinataire == null) return;
        try {
            Notification notif = Notification.builder()
                    .destinataire(destinataire)
                    .type(type)
                    .titre(titre)
                    .message(message)
                    .idMission(idMission)
                    .lue(false)
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ex) {
            // On n'interrompt JAMAIS le flow métier à cause d'une notif qui plante.
            log.warn("Echec création notification pour {} : {}", destinataire.getEmail(), ex.getMessage());
        }
    }

    @Transactional
    public void notifierTous(Collection<Agent> destinataires, NotificationType type,
                              String titre, String message, Long idMission) {
        if (destinataires == null) return;
        destinataires.forEach(a -> notifier(a, type, titre, message, idMission));
    }

    // ------------------------------------------------------------------
    // CONSOMMATION : utilisée par le controller pour l'utilisateur connecté
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<NotificationView> getMyNotifications(int limit) {
        return securityChecker.getCurrentAgent()
                .map(agent -> notificationRepository
                        .findByDestinataireIdAgentOrderByDateCreationDesc(
                                agent.getIdAgent(), PageRequest.of(0, Math.max(1, Math.min(limit, 100)))
                        )
                        .stream()
                        .map(this::toView)
                        .toList())
                .orElseGet(List::of);
    }

    @Transactional(readOnly = true)
    public long countUnreadForCurrentUser() {
        return securityChecker.getCurrentAgent()
                .map(agent -> notificationRepository.countByDestinataireIdAgentAndLueFalse(agent.getIdAgent()))
                .orElse(0L);
    }

    @Transactional
    public void markAsRead(Long idNotification) {
        Notification n = notificationRepository.findById(idNotification)
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable : " + idNotification));

        // Sécurité : seul le destinataire peut marquer comme lue
        Long currentAgentId = securityChecker.getCurrentAgent()
                .map(Agent::getIdAgent)
                .orElse(null);
        if (currentAgentId == null || !currentAgentId.equals(n.getDestinataire().getIdAgent())) {
            return;
        }

        if (!n.isLue()) {
            n.setLue(true);
            n.setDateLue(java.time.LocalDateTime.now());
            notificationRepository.save(n);
        }
    }

    @Transactional
    public int markAllAsReadForCurrentUser() {
        return securityChecker.getCurrentAgent()
                .map(agent -> notificationRepository.markAllAsReadForAgent(agent.getIdAgent()))
                .orElse(0);
    }

    private NotificationView toView(Notification n) {
        return new NotificationView(
                n.getIdNotification(),
                n.getType(),
                n.getTitre(),
                n.getMessage(),
                n.getIdMission(),
                n.isLue(),
                n.getDateCreation()
        );
    }
}
