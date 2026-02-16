package com.privod.platform.modules.selfEmployed.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateContractorRequest(
        @NotBlank(message = "ФИО обязательно")
        @Size(max = 500, message = "ФИО не должно превышать 500 символов")
        String fullName,

        @NotBlank(message = "ИНН обязателен")
        @Pattern(regexp = "\\d{12}", message = "ИНН должен содержать 12 цифр")
        String inn,

        @Size(max = 20)
        String phone,

        @Size(max = 255)
        String email,

        @Size(max = 20, message = "Расчётный счёт не должен превышать 20 символов")
        String bankAccount,

        @Size(max = 9, message = "БИК не должен превышать 9 символов")
        String bic,

        @NotNull(message = "Дата регистрации обязательна")
        LocalDate registrationDate,

        String projectIds
) {
}
