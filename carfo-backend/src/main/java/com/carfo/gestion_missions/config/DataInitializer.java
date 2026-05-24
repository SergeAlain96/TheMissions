package com.carfo.gestion_missions.config;

import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.entity.Vehicule;
import com.carfo.gestion_missions.enums.RoleAgent;
import com.carfo.gestion_missions.enums.StatutVehicule;
import com.carfo.gestion_missions.repository.AgentRepository;
import com.carfo.gestion_missions.repository.DirectionRepository;
import com.carfo.gestion_missions.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    /** Sigle de la Direction des Moyens Généraux — utilisé pour identifier le DMG. */
    public static final String SIGLE_DMG = "DMG";

    /** Mot de passe par défaut pour TOUS les comptes de test (à changer en prod). */
    private static final String DEFAULT_TEST_PASSWORD = "carfo123";

    private final DirectionRepository directionRepository;
    private final AgentRepository agentRepository;
    private final VehiculeRepository vehiculeRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            Map<String, Direction> directions = seedDirections();
            seedTestAgents(directions);
            seedTestVehicules();
        };
    }

    // ------------------------------------------------------------------
    // Directions
    // ------------------------------------------------------------------

    private Map<String, Direction> seedDirections() {
        if (directionRepository.count() == 0) {
            directionRepository.saveAll(List.of(
                    direction("Direction Générale",                "DG"),
                    direction("Direction Financière",              "DF"),
                    direction("Direction des Ressources Humaines", "DRH"),
                    direction("Direction Technique",               "DT"),
                    direction("Direction des Systèmes d'Information", "DSI"),
                    direction("Direction des Moyens Généraux",     SIGLE_DMG)
            ));
            log.info("DataInitializer: 6 directions initiales créées.");
        } else if (!directionRepository.existsBySigleDirection(SIGLE_DMG)) {
            directionRepository.save(direction("Direction des Moyens Généraux", SIGLE_DMG));
            log.info("DataInitializer: direction DMG ajoutée a posteriori (backfill).");
        } else {
            // Migration : renommer l'ancienne dénomination DMG si elle existe encore
            directionRepository.findBySigleDirectionIgnoreCase(SIGLE_DMG).ifPresent(d -> {
                if (!"Direction des Moyens Généraux".equals(d.getNomDirection())) {
                    d.setNomDirection("Direction des Moyens Généraux");
                    directionRepository.save(d);
                    log.info("DataInitializer: direction DMG renommée -> 'Direction des Moyens Généraux'.");
                }
            });

            // Migration : Direction Informatique (DI) -> Direction des Systèmes d'Information (DSI)
            directionRepository.findBySigleDirectionIgnoreCase("DI").ifPresent(d -> {
                d.setSigleDirection("DSI");
                d.setNomDirection("Direction des Systèmes d'Information");
                directionRepository.save(d);
                log.info("DataInitializer: direction DI renommée -> DSI ('Direction des Systèmes d'Information').");
            });
        }

        Map<String, Direction> bySigle = new HashMap<>();
        directionRepository.findAll().forEach(d -> bySigle.put(d.getSigleDirection(), d));
        return bySigle;
    }

    private Direction direction(String nom, String sigle) {
        return Objects.requireNonNull(Direction.builder()
                .nomDirection(nom)
                .sigleDirection(sigle)
                .build());
    }

    // ------------------------------------------------------------------
    // Agents de test
    // ------------------------------------------------------------------

    private void seedTestAgents(Map<String, Direction> dirs) {
        String hash = passwordEncoder.encode(DEFAULT_TEST_PASSWORD);
        int created = 0;

        created += tryCreate(agent("OUEDRAOGO", "Mariam",  "ADM001", "MOUEDRAOGO", "admin@carfo.bf",
                hash, "Administrateur système",  "+22670000001", RoleAgent.ADMINISTRATEUR,      false, dirs.get("DG")));
        created += tryCreate(agent("KABORE",    "Awa",     "SG001",  "AKABORE",    "sg@carfo.bf",
                hash, "Secrétaire Générale",     "+22670000002", RoleAgent.SECRETAIRE_GENERALE, false, dirs.get("DG")));
        created += tryCreate(agent("TRAORE",    "Issa",    "DIR001", "ITRAORE",    "dg@carfo.bf",
                hash, "Directeur Général",         "+22670000003", RoleAgent.DIRECTEUR,           false, dirs.get("DG")));

        // Directeurs de direction (un par direction)
        created += tryCreate(agent("ZONGO",     "Boukary", "DMG001", "BZONGO",     "dmg@carfo.bf",
                hash, "Directeur DMG",           "+22670000010", RoleAgent.DIRECTEUR_DIRECTION, false, dirs.get(SIGLE_DMG)));
        created += tryCreate(agent("SAWADOGO",  "Fatoumata","DF001", "FSAWADOGO",  "df@carfo.bf",
                hash, "Directrice Financière",   "+22670000011", RoleAgent.DIRECTEUR_DIRECTION, false, dirs.get("DF")));
        created += tryCreate(agent("COMPAORE",  "Salif",   "DRH001", "SCOMPAORE",  "drh@carfo.bf",
                hash, "Directeur RH",            "+22670000012", RoleAgent.DIRECTEUR_DIRECTION, false, dirs.get("DRH")));
        created += tryCreate(agent("ILBOUDO",   "Aminata", "DT001",  "AILBOUDO",   "dt@carfo.bf",
                hash, "Directrice Technique",    "+22670000013", RoleAgent.DIRECTEUR_DIRECTION, false, dirs.get("DT")));

        // Chargés d'étude
        created += tryCreate(agent("OUATTARA",  "Yacouba", "CE001",  "YOUATTARA",  "charge1@carfo.bf",
                hash, "Chargé d'étude",          "+22670000020", RoleAgent.CHARGE_ETUDE,        false, dirs.get("DG")));
        created += tryCreate(agent("SANOU",     "Cécile",  "CE002",  "CSANOU",     "charge2@carfo.bf",
                hash, "Chargée d'étude",         "+22670000021", RoleAgent.CHARGE_ETUDE,        false, dirs.get("DF")));

        // Chauffeurs (rattachés à la DMG, estChauffeur=true)
        created += tryCreate(agent("DIALLO",    "Mamadou", "CH001",  "MDIALLO",    "chauffeur1@carfo.bf",
                hash, "Chauffeur principal",     "+22670000030", RoleAgent.AGENT,               true,  dirs.get(SIGLE_DMG)));
        created += tryCreate(agent("KONATE",    "Seydou",  "CH002",  "SKONATE",    "chauffeur2@carfo.bf",
                hash, "Chauffeur",               "+22670000031", RoleAgent.AGENT,               true,  dirs.get(SIGLE_DMG)));

        // Agents simples (participants potentiels)
        created += tryCreate(agent("NIKIEMA",   "Ousmane", "AG001",  "ONIKIEMA",   "agent1@carfo.bf",
                hash, "Agent comptable",         "+22670000040", RoleAgent.AGENT,               false, dirs.get("DF")));
        created += tryCreate(agent("BARRY",     "Habib",   "AG002",  "HBARRY",     "agent2@carfo.bf",
                hash, "Technicien support",      "+22670000041", RoleAgent.AGENT,               false, dirs.get("DI")));
        created += tryCreate(agent("YAMEOGO",   "Angèle",  "AG003",  "AYAMEOGO",   "agent3@carfo.bf",
                hash, "Agent administratif",     "+22670000042", RoleAgent.AGENT,               false, dirs.get("DT")));

        if (created == 0) {
            log.info("DataInitializer: aucun nouvel agent test à créer (tous déjà présents).");
        } else {
            log.info("DataInitializer: {} agent(s) test créé(s) — mot de passe : '{}'.", created, DEFAULT_TEST_PASSWORD);
        }
    }

    private Agent agent(String nom, String prenom, String matricule, String username, String email,
                        String motDePasseHash, String fonction, String telephone,
                        RoleAgent role, boolean estChauffeur, Direction direction) {
        return Agent.builder()
                .nom(nom)
                .prenom(prenom)
                .matricule(matricule)
                .username(username)
                .email(email)
                .motDePasse(motDePasseHash)
                .fonction(fonction)
                .telephone(telephone)
                .role(role)
                .estChauffeur(estChauffeur)
                .actif(true)
                .direction(direction)
                .build();
    }

    private int tryCreate(Agent agent) {
        // Si l'agent existe déjà (par email OU par matricule, le matricule étant l'identifiant
        // métier stable), on force la synchronisation des champs identifiants. Cela couvre
        // le cas où un email a changé entre deux versions du DataInitializer (ex : directeur@ → dg@).
        var existing = agentRepository.findByEmail(agent.getEmail()).orElse(null);
        if (existing == null) {
            existing = agentRepository.findByMatricule(agent.getMatricule()).orElse(null);
        }
        if (existing != null) {
            existing.setEmail(agent.getEmail());
            existing.setUsername(agent.getUsername());
            existing.setNom(agent.getNom());
            existing.setPrenom(agent.getPrenom());
            existing.setFonction(agent.getFonction());
            existing.setMotDePasse(agent.getMotDePasse());
            existing.setActif(true);
            agentRepository.save(existing);
            return 0;
        }
        agentRepository.save(agent);
        return 1;
    }

    // ------------------------------------------------------------------
    // Véhicules de test
    // ------------------------------------------------------------------

    private void seedTestVehicules() {
        int created = 0;
        created += tryCreateVehicule("11AA1234", "Toyota",     "Hilux",        "Pick-up 4x4",  5,  LocalDate.of(2022, 3, 15));
        created += tryCreateVehicule("11AA5678", "Toyota",     "Land Cruiser", "SUV 4x4",      7,  LocalDate.of(2021, 7, 10));
        created += tryCreateVehicule("11BB1122", "Nissan",     "Patrol",       "SUV 4x4",      5,  LocalDate.of(2023, 1, 5));
        created += tryCreateVehicule("11BB3344", "Mitsubishi", "Pajero",       "SUV 4x4",      5,  LocalDate.of(2020, 11, 20));
        created += tryCreateVehicule("11CC9988", "Toyota",     "Hiace",        "Minibus",     14,  LocalDate.of(2022, 6, 1));
        created += tryCreateVehicule("11CC7755", "Renault",    "Master",       "Utilitaire",   9,  LocalDate.of(2021, 4, 18));
        created += tryCreateVehicule("11DD4321", "Peugeot",    "508",          "Berline",      4,  LocalDate.of(2023, 9, 12));
        created += tryCreateVehicule("11DD8765", "Hyundai",    "H1",           "Minibus",     11,  LocalDate.of(2022, 12, 3));

        if (created == 0) {
            log.info("DataInitializer: aucun nouveau vehicule a creer (tous deja presents).");
        } else {
            log.info("DataInitializer: {} vehicule(s) test cree(s).", created);
        }
    }

    private int tryCreateVehicule(String immatriculation, String marque, String modele,
                                   String typeVehicule, int capacite, LocalDate dateAcquisition) {
        if (vehiculeRepository.existsByImmatriculation(immatriculation)) {
            return 0;
        }
        Vehicule v = Vehicule.builder()
                .immatriculation(immatriculation)
                .marque(marque)
                .modele(modele)
                .typeVehicule(typeVehicule)
                .capacite(capacite)
                .dateAcquisition(dateAcquisition)
                .statut(StatutVehicule.DISPONIBLE)
                .actif(true)
                .build();
        vehiculeRepository.save(v);
        return 1;
    }
}
