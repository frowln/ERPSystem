package com.privod.platform.modules.accounting.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCounterpartyRequest(
        @NotBlank(message = "Наименование контрагента обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 200, message = "Краткое наименование не должно превышать 200 символов")
        String shortName,

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

        @Size(max = 300, message = "Наименование банка не должно превышать 300 символов")
        String bankName,

        @Size(max = 300, message = "Контактное лицо не должно превышать 300 символов")
        String contactPerson,

        @Size(max = 50, message = "Телефон не должен превышать 50 символов")
        String phone,

        @Size(max = 200, message = "Email не должен превышать 200 символов")
        String email,

        @Size(max = 300, message = "Сайт не должен превышать 300 символов")
        String website,

        boolean supplier,
        boolean customer,
        boolean contractor,
        boolean subcontractor,
        boolean designer,

        String notes
) {
}
