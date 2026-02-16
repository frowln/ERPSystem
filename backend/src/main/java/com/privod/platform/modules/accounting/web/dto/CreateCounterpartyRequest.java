package com.privod.platform.modules.accounting.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCounterpartyRequest(
        @NotBlank(message = "Наименование контрагента обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @NotBlank(message = "ИНН обязателен")
        @Size(min = 10, max = 12, message = "ИНН должен содержать от 10 до 12 символов")
        String inn,

        @Size(max = 9, message = "КПП должен содержать не более 9 символов")
        String kpp,

        @Size(max = 15, message = "ОГРН должен содержать не более 15 символов")
        String ogrn,

        String legalAddress,
        String actualAddress,

        @Size(max = 20, message = "Расчётный счёт должен содержать не более 20 символов")
        String bankAccount,

        @Size(max = 9, message = "БИК должен содержать не более 9 символов")
        String bik,

        @Size(max = 20, message = "Корр. счёт должен содержать не более 20 символов")
        String correspondentAccount,

        boolean supplier,
        boolean customer
) {
}
