package com.privod.platform.modules.monitoring.service;

import com.privod.platform.modules.monitoring.domain.EventSeverity;
import com.privod.platform.modules.monitoring.domain.SystemEvent;
import com.privod.platform.modules.monitoring.domain.SystemEventType;
import com.privod.platform.modules.monitoring.repository.SystemEventRepository;
import com.privod.platform.modules.monitoring.web.dto.LogEventRequest;
import com.privod.platform.modules.monitoring.web.dto.SystemEventResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemEventService {

    private final SystemEventRepository eventRepository;

    @Transactional
    public SystemEventResponse logEvent(LogEventRequest request) {
        SystemEvent event = SystemEvent.builder()
                .eventType(request.eventType())
                .severity(request.severity())
                .message(request.message())
                .details(request.details())
                .source(request.source())
                .userId(request.userId())
                .occurredAt(Instant.now())
                .build();

        event = eventRepository.save(event);
        log.info("System event logged: [{}] {} - {}", request.severity(), request.eventType(), request.message());
        return SystemEventResponse.fromEntity(event);
    }

    @Transactional(readOnly = true)
    public Page<SystemEventResponse> getEvents(SystemEventType eventType, EventSeverity severity,
                                                 String source, Instant from, Instant to,
                                                 Pageable pageable) {
        return eventRepository.findByFilters(eventType, severity, source, from, to, pageable)
                .map(SystemEventResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SystemEventResponse> getRecentErrors() {
        return eventRepository.findRecentErrors(PageRequest.of(0, 50))
                .stream()
                .map(SystemEventResponse::fromEntity)
                .toList();
    }
}
