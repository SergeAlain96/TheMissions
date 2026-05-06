package com.carfo.gestion_missions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DirectionDTO {

    private DirectionDTO() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotBlank(message = "Le nom de la direction est obligatoire")
        private String nomDirection;

        private String sigleDirection;
    }
}
