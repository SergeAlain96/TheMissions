package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationView(
        Long idNotification,
        NotificationType type,
        String titre,
        String message,
        Long idMission,
        boolean lue,
        LocalDateTime dateCreation
) {}
