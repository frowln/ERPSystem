package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.Counterparty;

import java.time.Instant;
import java.util.UUID;

public record CounterpartyResponse(
        UUID id,
        String name,
        String inn,
        String kpp,
        String ogrn,
        String legalAddress,
        String actualAddress,
        String bankAccount,
        String bik,
        String correspondentAccount,
        boolean supplier,
        boolean customer,
        boolean active,
        Instant createdAt
) {
    public static CounterpartyResponse fromEntity(Counterparty entity) {
        return new CounterpartyResponse(
                entity.getId(),
                entity.getName(),
                entity.getInn(),
                entity.getKpp(),
                entity.getOgrn(),
                entity.getLegalAddress(),
                entity.getActualAddress(),
                entity.getBankAccount(),
                entity.getBik(),
                entity.getCorrespondentAccount(),
                entity.isSupplier(),
                entity.isCustomer(),
                entity.isActive(),
                entity.getCreatedAt()
        );
    }
}
