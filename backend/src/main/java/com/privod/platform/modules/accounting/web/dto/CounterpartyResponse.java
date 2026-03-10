package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.Counterparty;

import java.time.Instant;
import java.util.UUID;

public record CounterpartyResponse(
        UUID id,
        String name,
        String shortName,
        String inn,
        String kpp,
        String ogrn,
        String legalAddress,
        String actualAddress,
        String bankAccount,
        String bik,
        String correspondentAccount,
        String bankName,
        String contactPerson,
        String phone,
        String email,
        String website,
        boolean supplier,
        boolean customer,
        boolean contractor,
        boolean subcontractor,
        boolean designer,
        boolean active,
        String notes,
        Instant createdAt
) {
    public static CounterpartyResponse fromEntity(Counterparty entity) {
        return new CounterpartyResponse(
                entity.getId(),
                entity.getName(),
                entity.getShortName(),
                entity.getInn(),
                entity.getKpp(),
                entity.getOgrn(),
                entity.getLegalAddress(),
                entity.getActualAddress(),
                entity.getBankAccount(),
                entity.getBik(),
                entity.getCorrespondentAccount(),
                entity.getBankName(),
                entity.getContactPerson(),
                entity.getPhone(),
                entity.getEmail(),
                entity.getWebsite(),
                entity.isSupplier(),
                entity.isCustomer(),
                entity.isContractor(),
                entity.isSubcontractor(),
                entity.isDesigner(),
                entity.isActive(),
                entity.getNotes(),
                entity.getCreatedAt()
        );
    }
}
