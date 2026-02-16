package com.privod.platform.modules.calendar.repository;

import com.privod.platform.modules.calendar.domain.CalendarEventAttendee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarEventAttendeeRepository extends JpaRepository<CalendarEventAttendee, UUID> {

    List<CalendarEventAttendee> findByEventIdAndDeletedFalse(UUID eventId);

    Optional<CalendarEventAttendee> findByEventIdAndUserIdAndDeletedFalse(UUID eventId, UUID userId);

    @Query("SELECT a.eventId FROM CalendarEventAttendee a WHERE a.userId = :userId AND a.deleted = false")
    List<UUID> findEventIdsByUserId(@Param("userId") UUID userId);

    void deleteByEventIdAndUserId(UUID eventId, UUID userId);

    long countByEventIdAndDeletedFalse(UUID eventId);
}
