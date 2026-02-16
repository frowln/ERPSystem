package com.privod.platform.modules.monitoring.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.monitoring.domain.EventSeverity;
import com.privod.platform.modules.monitoring.domain.SystemEventType;
import com.privod.platform.modules.monitoring.service.SystemEventService;
import com.privod.platform.modules.monitoring.web.dto.LogEventRequest;
import com.privod.platform.modules.monitoring.web.dto.SystemEventResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Events", description = "System event logging and querying endpoints")
public class SystemEventController {

    private final SystemEventService eventService;

    @GetMapping
    @Operation(summary = "List system events with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<SystemEventResponse>>> list(
            @RequestParam(required = false) SystemEventType eventType,
            @RequestParam(required = false) EventSeverity severity,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @PageableDefault(size = 50, sort = "occurredAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<SystemEventResponse> page = eventService.getEvents(eventType, severity, source, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/recent-errors")
    @Operation(summary = "Get recent error and critical events")
    public ResponseEntity<ApiResponse<List<SystemEventResponse>>> getRecentErrors() {
        List<SystemEventResponse> errors = eventService.getRecentErrors();
        return ResponseEntity.ok(ApiResponse.ok(errors));
    }

    @PostMapping
    @Operation(summary = "Log a system event")
    public ResponseEntity<ApiResponse<SystemEventResponse>> logEvent(
            @Valid @RequestBody LogEventRequest request) {
        SystemEventResponse response = eventService.logEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
