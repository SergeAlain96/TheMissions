package com.carfo.gestion_missions.security;

import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.service.AppConfigService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    /** Fallback statique utilisé si AppConfig n'est pas encore initialisé (en millisecondes). */
    @Value("${jwt.expiration}")
    private long jwtExpirationFallback;

    /** Lazy pour éviter une éventuelle dépendance circulaire avec SecurityConfig. */
    private final AppConfigService appConfigService;

    public JwtUtils(@Lazy AppConfigService appConfigService) {
        this.appConfigService = appConfigService;
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /** Durée d'expiration dynamique en ms (lue depuis AppConfig). */
    private long expirationMs() {
        try {
            var cfg = appConfigService.get();
            Integer hours = cfg.getJwtExpirationHours();
            if (hours != null && hours > 0) {
                return hours.longValue() * 3600_000L;
            }
        } catch (Exception ex) {
            logger.debug("AppConfig indisponible pour JWT TTL — fallback statique : {}", ex.getMessage());
        }
        return jwtExpirationFallback;
    }

    public String generateToken(Agent agent) {
        return Jwts.builder()
                .setSubject(agent.getEmail())
                .claim("role", agent.getRole().name())
                .claim("idAgent", agent.getIdAgent())
                .claim("nom", agent.getNom())
                .claim("prenom", agent.getPrenom())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Token JWT invalide : {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Token JWT expiré : {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Token JWT non supporté : {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Claims JWT vides : {}", e.getMessage());
        }
        return false;
    }
}
