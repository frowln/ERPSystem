package com.privod.platform.modules.calendar.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.calendar.service.CalendarEventService;
import com.privod.platform.modules.calendar.web.dto.AddAttendeeRequest;
import com.privod.platform.modules.calendar.web.dto.AttendeeResponse;
import com.privod.platform.modules.calendar.web.dto.CalendarEventResponse;
import com.privod.platform.modules.calendar.web.dto.CreateCalendarEventRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateAttendeeResponseRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateCalendarEventRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar/events")
@RequiredArgsConstructor
@Tag(name = "Calendar Events", description = "Calendar event management endpoints")
public class CalendarEventController {

    private final CalendarEventService eventService;

    @GetMapping
    @Operation(summary = "List calendar events")
    public ResponseEntity<ApiResponse<PageResponse<CalendarEventResponse>>> list(
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CalendarEventResponse> page = eventService.listEvents(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get calendar event by ID")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> getById(@PathVariable UUID id) {
        CalendarEventResponse response = eventService.getEvent(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Create a new calendar event")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> create(
            @Valid @RequestBody CreateCalendarEventRequest request) {
        CalendarEventResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Update a calendar event")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCalendarEventRequest request) {
        CalendarEventResponse response = eventService.updateEvent(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a calendar event")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get events by date range")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CalendarEventResponse> events = eventService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get events for a specific project")
    public ResponseEntity<ApiResponse<PageResponse<CalendarEventResponse>>> getByProject(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CalendarEventResponse> page = eventService.getByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/project/{projectId}/date-range")
    @Operation(summary = "Get events for a project within a date range")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getProjectEvents(
            @PathVariable UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CalendarEventResponse> events = eventService.getProjectEvents(projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @GetMapping("/my-events")
    @Operation(summary = "Get events organized by a specific user")
    public ResponseEntity<ApiResponse<PageResponse<CalendarEventResponse>>> getMyEvents(
            @RequestParam(required = false) UUID userId,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access events for another user");
        }
        Page<CalendarEventResponse> page = eventService.getMyEvents(currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming events")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getUpcoming(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access upcoming events for another user");
        }
        List<CalendarEventResponse> events = eventService.getUpcomingEvents(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @GetMapping("/{id}/recurrences")
    @Operation(summary = "Generate recurrence instances for an event")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getRecurrences(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CalendarEventResponse> recurrences = eventService.generateRecurrences(id, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(recurrences));
    }

    // --- Attendees ---

    @GetMapping("/{eventId}/attendees")
    @Operation(summary = "Get attendees for an event")
    public ResponseEntity<ApiResponse<List<AttendeeResponse>>> getAttendees(@PathVariable UUID eventId) {
        List<AttendeeResponse> attendees = eventService.getEventAttendees(eventId);
        return ResponseEntity.ok(ApiResponse.ok(attendees));
    }

    @PostMapping("/{eventId}/attendees")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Add an attendee to an event")
    public ResponseEntity<ApiResponse<AttendeeResponse>> addAttendee(
            @PathVariable UUID eventId,
            @Valid @RequestBody AddAttendeeRequest request) {
        AttendeeResponse response = eventService.addAttendee(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{eventId}/attendees/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Remove an attendee from an event")
    public ResponseEntity<ApiResponse<Void>> removeAttendee(
            @PathVariable UUID eventId,
            @PathVariable UUID userId) {
        eventService.removeAttendee(eventId, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PatchMapping("/{eventId}/attendees/{userId}/response")
    @Operation(summary = "Update attendee response status")
    public ResponseEntity<ApiResponse<AttendeeResponse>> updateAttendeeResponse(
            @PathVariable UUID eventId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateAttendeeResponseRequest request) {
        AttendeeResponse response = eventService.updateAttendeeResponse(eventId, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
