package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.NotificationView;
import com.carfo.gestion_missions.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Mes notifications (les plus récentes). */
    @GetMapping
    public ResponseEntity<List<NotificationView>> getMyNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(notificationService.getMyNotifications(limit));
    }

    /** Nombre de notifications non lues — utilisé pour le badge dans la nav. */
    @GetMapping("/count-unread")
    public ResponseEntity<Map<String, Long>> countUnread() {
        long count = notificationService.countUnreadForCurrentUser();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/lu")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllAsRead() {
        int updated = notificationService.markAllAsReadForCurrentUser();
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
