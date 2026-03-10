package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.BriefingType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateSafetyBriefingRequest(
        UUID projectId,
        BriefingType briefingType,
        LocalDate briefingDate,
        UUID instructorId,
        String instructorName,
        String topic,
        String notes,
        List<CreateSafetyBriefingRequest.AttendeeRequest> attendees
) {}
