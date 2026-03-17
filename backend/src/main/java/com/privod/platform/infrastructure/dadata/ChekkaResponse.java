package com.privod.platform.infrastructure.dadata;

import java.time.LocalDateTime;
import java.util.List;

public record ChekkaResponse(
    String inn,
    String riskLevel,              // LOW / MEDIUM / HIGH / UNKNOWN
    Integer riskScore,             // 0-100
    Boolean isActive,
    Boolean hasBankruptcy,
    Boolean hasDebts,
    Integer arbitrationCount,
    Integer arbitrationAsPlaintiff,
    Integer arbitrationAsDefendant,
    List<String> relatedCompanies,
    String legalAddress,
    LocalDateTime lastUpdated,
    String error,                  // null if success

    // === Extended Checko data ===
    String ogrn,
    String kpp,
    String okpo,
    String fullName,
    String shortName,
    String statusName,             // "Действует", "Ликвидировано", etc.
    String registrationDate,
    String region,
    String mainOkved,              // e.g. "41.20 — Строительство жилых и нежилых зданий"

    // Directors
    List<Director> directors,
    // Founders
    List<Founder> founders,
    // Capital
    String capitalType,
    Long capitalAmount,
    // Employee count
    Integer employeeCount,
    Integer employeeCountYear,
    // Contacts from Checko
    String checkoPhone,
    String checkoEmail,
    // Tax info
    String taxAuthorityName,
    String taxAuthorityCode,
    // Licenses
    List<LicenseInfo> licenses,
    // Additional OKVED codes
    List<OkvedEntry> additionalOkveds,
    // Risk flags
    Boolean unfairSupplier,
    Boolean disqualifiedPersons,
    Boolean massDirector,
    Boolean massFounder,
    Boolean illegalFinancing,
    Boolean hasSanctions,
    Boolean sanctionsFounders,
    // SME info
    String smeCategory,            // "micro", "small", "medium"
    // Financial data (latest year)
    FinancialSummary financials
) {
    public static ChekkaResponse ofError(String inn, String error) {
        return new ChekkaResponse(
                inn, "UNKNOWN", null, null, null, null,         // 1-6
                null, null, null, null, null,                   // 7-11
                LocalDateTime.now(), error,                     // 12-13
                null, null, null, null, null, null, null,       // 14-20: ogrn..registrationDate
                null, null,                                     // 21-22: region, mainOkved
                null, null, null, null,                         // 23-26: directors..capitalAmount
                null, null, null, null,                         // 27-30: employeeCount..checkoEmail
                null, null, null, null,                         // 31-34: taxAuth..additionalOkveds
                null, null, null, null, null, null, null,       // 35-41: risk flags
                null, null                                      // 42-43: smeCategory, financials
        );
    }

    public record Director(String fullName, String position, String inn, boolean massDirector, boolean disqualified) {}
    public record Founder(String name, String inn, String share) {}
    public record LicenseInfo(String number, String type, String issuedBy, String dateStart, String dateEnd) {}
    public record OkvedEntry(String code, String name) {}
    public record FinancialSummary(
        Integer year,
        Long revenue,            // 2110
        Long costOfSales,        // 2120
        Long grossProfit,        // 2100
        Long netProfit,          // 2400
        Long totalAssets,        // 1600
        Long totalLiabilities,   // 1700
        Long equity,             // 1300
        Long currentAssets,      // 1200
        Long fixedAssets         // 1150
    ) {}
}
