package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.CertificateStatus;
import com.privod.platform.modules.hr.domain.CertificateType;
import com.privod.platform.modules.hr.domain.EmployeeCertificate;
import com.privod.platform.modules.hr.repository.EmployeeCertificateRepository;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.hr.web.dto.CertificateResponse;
import com.privod.platform.modules.hr.web.dto.CertificationDashboardResponse;
import com.privod.platform.modules.hr.web.dto.CertificationDashboardResponse.TypeBreakdown;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificationDashboardService {

    private final EmployeeCertificateRepository certificateRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public CertificationDashboardResponse getDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Counts by status
        Map<CertificateStatus, Long> statusCounts = new EnumMap<>(CertificateStatus.class);
        for (CertificateStatus s : CertificateStatus.values()) {
            statusCounts.put(s, 0L);
        }
        for (Object[] row : certificateRepository.countByStatusForOrg(orgId)) {
            CertificateStatus status = (CertificateStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status, count);
        }

        long total = statusCounts.values().stream().mapToLong(Long::longValue).sum();
        long valid = statusCounts.getOrDefault(CertificateStatus.VALID, 0L);
        long expiring = statusCounts.getOrDefault(CertificateStatus.EXPIRING, 0L);
        long expired = statusCounts.getOrDefault(CertificateStatus.EXPIRED, 0L);
        double compliance = total > 0 ? ((double) valid / total) * 100.0 : 100.0;

        // Counts by type and status
        Map<String, TypeBreakdown> byType = new LinkedHashMap<>();
        for (Object[] row : certificateRepository.countByTypeAndStatusForOrg(orgId)) {
            CertificateType type = (CertificateType) row[0];
            CertificateStatus status = (CertificateStatus) row[1];
            Long count = (Long) row[2];

            byType.compute(type.name(), (k, existing) -> {
                long v = existing != null ? existing.valid() : 0;
                long ex = existing != null ? existing.expiring() : 0;
                long exp = existing != null ? existing.expired() : 0;
                long t = existing != null ? existing.total() : 0;

                switch (status) {
                    case VALID -> v += count;
                    case EXPIRING -> ex += count;
                    case EXPIRED -> exp += count;
                }
                return new TypeBreakdown(type.getDisplayName(), v, ex, exp, t + count);
            });
        }

        // Employee name cache
        Map<UUID, String> nameCache = employeeRepository.findAllByOrganizationId(orgId)
                .stream()
                .collect(Collectors.toMap(
                        e -> e.getId(),
                        e -> e.getLastName() + " " + e.getFirstName(),
                        (a, b) -> a
                ));

        // Expiring certificates (within 90 days)
        List<CertificateResponse> expiringCerts = certificateRepository
                .findExpiringByOrg(orgId, LocalDate.now().plusDays(90))
                .stream()
                .map(c -> CertificateResponse.fromEntity(c, nameCache.getOrDefault(c.getEmployeeId(), "")))
                .toList();

        // Expired certificates
        List<CertificateResponse> expiredCerts = certificateRepository
                .findExpiredByOrg(orgId)
                .stream()
                .map(c -> CertificateResponse.fromEntity(c, nameCache.getOrDefault(c.getEmployeeId(), "")))
                .toList();

        return new CertificationDashboardResponse(
                total, valid, expiring, expired,
                Math.round(compliance * 10.0) / 10.0,
                byType,
                expiringCerts,
                expiredCerts
        );
    }

    /**
     * Recalculate status for all certificates in the organization.
     * Called by scheduler daily.
     */
    @Transactional
    public int recalculateStatuses() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<EmployeeCertificate> all = certificateRepository.findAllByOrgOrderByExpiry(orgId);
        int updated = 0;
        for (EmployeeCertificate cert : all) {
            CertificateStatus before = cert.getStatus();
            cert.recalculateStatus();
            if (before != cert.getStatus()) {
                certificateRepository.save(cert);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Recalculated {} certificate statuses", updated);
        }
        return updated;
    }
}
