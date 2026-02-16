package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.LeadPriority;
import com.privod.platform.modules.crm.domain.LeadStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateCrmLeadRequest(
        @Size(max = 300)
        String name,

        @Size(max = 300)
        String partnerName,

        @Size(max = 255)
        String email,

        @Size(max = 50)
        String phone,

        @Size(max = 500)
        String companyName,

        @Size(max = 100)
        String source,

        @Size(max = 100)
        String medium,

        UUID stageId,

        UUID assignedToId,

        @DecimalMin(value = "0", message = "Ожидаемая выручка не может быть отрицательной")
        BigDecimal expectedRevenue,

        @Min(value = 0, message = "Вероятность не может быть меньше 0")
        @Max(value = 100, message = "Вероятность не может быть больше 100")
        Integer probability,

        LeadPriority priority,

        String description,

        LeadStatus status,

        String lostReason,

        LocalDate nextActivityDate
) {
}
