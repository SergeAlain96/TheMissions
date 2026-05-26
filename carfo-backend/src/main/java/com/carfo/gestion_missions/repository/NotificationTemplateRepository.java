package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.NotificationTemplate;
import com.carfo.gestion_missions.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, NotificationType> {
}
