package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdatePurchaseRequestRequest(
        LocalDate requestDate,

        UUID projectId,

        UUID contractId,

        UUID specificationId,

        PurchaseRequestPriority priority,

        @Size(max = 255, message = "Имя запросившего не должно превышать 255 символов")
        String requestedByName,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes
) {
}
