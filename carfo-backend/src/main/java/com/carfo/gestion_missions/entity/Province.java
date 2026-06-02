package com.carfo.gestion_missions.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Province du Burkina Faso et son chef-lieu. Référentiel en lecture pour alimenter
 * les listes déroulantes (sélection du lieu de mission).
 */
@Entity
@Table(name = "province")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Province {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_province")
    private Long idProvince;

    @Column(name = "nom", nullable = false, unique = true, length = 100)
    private String nom;

    @Column(name = "chef_lieu", nullable = false, length = 100)
    private String chefLieu;
}
