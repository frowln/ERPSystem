package com.privod.platform.modules.procurement.web.dto;

import com.privod.platform.modules.accounting.domain.Counterparty;

import java.util.List;
import java.util.UUID;

public record ProcurementSupplierOptionResponse(
        UUID id,
        String name,
        String email,
        List<String> categories
) {
    public static ProcurementSupplierOptionResponse fromCounterparty(Counterparty counterparty) {
        return new ProcurementSupplierOptionResponse(
                counterparty.getId(),
                counterparty.getName(),
                "",
                List.of()
        );
    }
}
