package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.entity.NotificationTemplate;
import com.carfo.gestion_missions.enums.NotificationType;
import com.carfo.gestion_missions.service.NotificationTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Gestion des templates de notifications (Paramètres → Notifications).
 * Lecture/écriture réservées strictement à l'Administrateur.
 */
@RestController
@RequestMapping("/api/notification-templates")
@RequiredArgsConstructor
public class NotificationTemplateController {

    private final NotificationTemplateService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<NotificationTemplate>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @PutMapping("/{type}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<NotificationTemplate> update(@PathVariable NotificationType type,
                                                       @RequestBody NotificationTemplate payload) {
        return ResponseEntity.ok(service.update(type, payload));
    }
}
