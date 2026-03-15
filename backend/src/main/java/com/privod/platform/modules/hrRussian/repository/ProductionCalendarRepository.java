package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.DayType;
import com.privod.platform.modules.hrRussian.domain.ProductionCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionCalendarRepository extends JpaRepository<ProductionCalendar, UUID> {

    Optional<ProductionCalendar> findByCalendarDateAndOrganizationIdAndDeletedFalse(
            LocalDate date, UUID orgId);

    /**
     * System-wide calendar lookup (organization_id IS NULL).
     */
    @Query("SELECT pc FROM ProductionCalendar pc " +
            "WHERE pc.calendarDate = :date AND pc.organizationId IS NULL AND pc.deleted = false")
    Optional<ProductionCalendar> findSystemByDate(@Param("date") LocalDate date);

    List<ProductionCalendar> findByYearAndOrganizationIdAndDeletedFalseOrderByCalendarDateAsc(
            int year, UUID orgId);

    /**
     * System-wide calendar for a year.
     */
    @Query("SELECT pc FROM ProductionCalendar pc " +
            "WHERE pc.year = :year AND pc.organizationId IS NULL AND pc.deleted = false " +
            "ORDER BY pc.calendarDate ASC")
    List<ProductionCalendar> findSystemByYear(@Param("year") int year);

    List<ProductionCalendar> findByCalendarDateBetweenAndOrganizationIdAndDeletedFalseOrderByCalendarDateAsc(
            LocalDate from, LocalDate to, UUID orgId);

    /**
     * System-wide date range lookup.
     */
    @Query("SELECT pc FROM ProductionCalendar pc " +
            "WHERE pc.calendarDate BETWEEN :fromDate AND :toDate " +
            "AND pc.organizationId IS NULL AND pc.deleted = false " +
            "ORDER BY pc.calendarDate ASC")
    List<ProductionCalendar> findSystemByDateRange(
            @Param("fromDate") LocalDate from, @Param("toDate") LocalDate to);

    long countByDayTypeAndYearAndOrganizationIdAndDeletedFalse(
            DayType dayType, int year, UUID orgId);

    /**
     * Count days of a given type in a year (system-wide calendar).
     */
    @Query("SELECT COUNT(pc) FROM ProductionCalendar pc " +
            "WHERE pc.dayType = :dayType AND pc.year = :year " +
            "AND pc.organizationId IS NULL AND pc.deleted = false")
    long countSystemByDayTypeAndYear(@Param("dayType") DayType dayType, @Param("year") int year);

    /**
     * Sum standard_hours for a given month/year (system-wide).
     * Used to calculate the norm of working hours for T-13 timesheet.
     */
    @Query("SELECT COALESCE(SUM(pc.standardHours), 0) FROM ProductionCalendar pc " +
            "WHERE pc.year = :year " +
            "AND EXTRACT(MONTH FROM pc.calendarDate) = :month " +
            "AND pc.organizationId IS NULL AND pc.deleted = false")
    BigDecimal sumSystemHoursByYearAndMonth(@Param("year") int year, @Param("month") int month);

    /**
     * Sum standard_hours for a given month/year with organization override.
     */
    @Query("SELECT COALESCE(SUM(pc.standardHours), 0) FROM ProductionCalendar pc " +
            "WHERE pc.year = :year " +
            "AND EXTRACT(MONTH FROM pc.calendarDate) = :month " +
            "AND pc.organizationId = :orgId AND pc.deleted = false")
    BigDecimal sumHoursByYearAndMonthAndOrg(
            @Param("year") int year, @Param("month") int month, @Param("orgId") UUID orgId);

    /**
     * Count working days in a date range (system-wide).
     * Working days are: WORKING, PRE_HOLIDAY, TRANSFERRED_WORKING.
     */
    @Query("SELECT COUNT(pc) FROM ProductionCalendar pc " +
            "WHERE pc.calendarDate BETWEEN :fromDate AND :toDate " +
            "AND pc.dayType IN :dayTypes " +
            "AND pc.organizationId IS NULL AND pc.deleted = false")
    long countSystemWorkingDays(
            @Param("fromDate") LocalDate from,
            @Param("toDate") LocalDate to,
            @Param("dayTypes") List<DayType> dayTypes);

    /**
     * Count working days in a date range (organization-specific).
     */
    @Query("SELECT COUNT(pc) FROM ProductionCalendar pc " +
            "WHERE pc.calendarDate BETWEEN :fromDate AND :toDate " +
            "AND pc.dayType IN :dayTypes " +
            "AND pc.organizationId = :orgId AND pc.deleted = false")
    long countWorkingDaysByOrg(
            @Param("fromDate") LocalDate from,
            @Param("toDate") LocalDate to,
            @Param("orgId") UUID orgId,
            @Param("dayTypes") List<DayType> dayTypes);
}
