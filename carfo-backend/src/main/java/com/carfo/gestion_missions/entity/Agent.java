package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.RoleAgent;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "agent")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SuppressWarnings("java:S1948")
public class Agent implements UserDetails {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_agent")
    private Long idAgent;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @Column(name = "matricule", nullable = false, unique = true, length = 20)
    private String matricule;

    // Ajouter ce champ après "matricule"
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Column(name = "fonction", length = 150)
    private String fonction;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "est_chauffeur", nullable = false)
    @Builder.Default
    private boolean estChauffeur = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private RoleAgent role;

    @Column(name = "actif", nullable = false)
    @Builder.Default
    private boolean actif = true;  // Désactiver sans supprimer historique (missions, absences, affectations)

    // Relation avec Direction
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_direction", nullable = false)
    private Direction direction;

    // Participation aux missions (table Participe)
    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Participe> participations;

    // Absences
    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Absence> absences;

    // Affectations en tant que chauffeur
    @OneToMany(mappedBy = "chauffeur", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Affectation> affectations;

    // ============================================================
    // Spring Security - UserDetails
    // ============================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return actif; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return actif; }  // Respecte l'état actif pour rejeter les connexions d'agents désactivés
}
