package com.privod.platform.modules.safety.web.dto;

import java.util.List;
import java.util.UUID;

public record AccessComplianceResponse(
        UUID employeeId,
        String employeeName,
        boolean accessAllowed,
        List<String> blockReasons,
        List<String> expiredMandatoryCertificates
) {
}
