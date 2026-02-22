package com.privod.platform.modules.isup.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateProjectMappingRequest(
        @NotNull(message = "ID проекта ПРИВОД обязателен")
        UUID privodProjectId,

        @Size(max = 255, message = "ID проекта ИСУП не должен превышать 255 символов")
        String isupProjectId,

        @Size(max = 255, message = "ID объекта ИСУП не должен превышать 255 символов")
        String isupObjectId,

        @Size(max = 255, message = "Номер госконтракта не должен превышать 255 символов")
        String governmentContractNumber,

        @Size(max = 255, message = "Регистрационный номер не должен превышать 255 символов")
        String registrationNumber
) {
}
