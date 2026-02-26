package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetSnapshot;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSnapshotRequest(
        @NotBlank(message = "Название снимка обязательно")
        @Size(max = 200, message = "Название снимка не должно превышать 200 символов")
        String name,

        BudgetSnapshot.SnapshotType snapshotType,

        java.util.UUID sourceSnapshotId,

        String notes
) {
}
