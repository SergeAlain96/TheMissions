package com.carfo.gestion_missions.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Outils de calcul des jours ouvrables (lundi → vendredi).
 * Les jours fériés ne sont pas pris en compte pour l'instant : seuls les week-ends sont exclus.
 */
public final class WorkingDaysUtil {

    private WorkingDaysUtil() {}

    /**
     * Nombre de jours ouvrables strictement entre deux dates (exclusif sur les deux bornes ?
     * Non : inclusif sur la borne basse, exclusif sur la borne haute — comme ChronoUnit.DAYS.between).
     *
     * Exemple : du vendredi au lundi suivant = 1 jour ouvrable (le vendredi seul est compté ;
     * samedi et dimanche sont exclus ; lundi est la borne haute exclue).
     */
    public static long workingDaysBetween(LocalDate from, LocalDate to) {
        if (from == null || to == null || !from.isBefore(to)) {
            return 0;
        }
        long totalDays = ChronoUnit.DAYS.between(from, to);
        long fullWeeks = totalDays / 7;
        long weekDays = fullWeeks * 5;

        // Compte les jours du reste de la semaine partielle
        LocalDate cursor = from.plusDays(fullWeeks * 7);
        while (cursor.isBefore(to)) {
            DayOfWeek dow = cursor.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                weekDays++;
            }
            cursor = cursor.plusDays(1);
        }
        return weekDays;
    }
}
