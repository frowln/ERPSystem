package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.SafetyCertificate;
import com.privod.platform.modules.safety.repository.SafetyCertificateRepository;
import com.privod.platform.modules.safety.web.dto.CreateSafetyCertificateRequest;
import com.privod.platform.modules.safety.web.dto.SafetyCertificateResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyCertificateService {

    private final SafetyCertificateRepository certificateRepository;

    @Transactional(readOnly = true)
    public Page<SafetyCertificateResponse> listAll(Pageable pageable) {
        return certificateRepository.findByDeletedFalse(pageable)
                .map(SafetyCertificateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SafetyCertificateResponse> getWorkerCerts(UUID employeeId) {
        return certificateRepository.findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employeeId)
                .stream()
                .map(SafetyCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SafetyCertificateResponse> getExpiringCerts(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(daysAhead);
        // Include expired certs too (expiryDate < today) and expiring soon (< threshold)
        List<SafetyCertificate> expired = certificateRepository.findExpiredBefore(today);
        List<SafetyCertificate> expiring = certificateRepository.findExpiringSoon(today, threshold);

        // Merge both lists, deduplicate by id
        java.util.Map<UUID, SafetyCertificate> map = new java.util.LinkedHashMap<>();
        expired.forEach(c -> map.put(c.getId(), c));
        expiring.forEach(c -> map.put(c.getId(), c));

        return map.values().stream()
                .sorted((a, b) -> {
                    if (a.getExpiryDate() == null) return 1;
                    if (b.getExpiryDate() == null) return -1;
                    return a.getExpiryDate().compareTo(b.getExpiryDate());
                })
                .map(SafetyCertificateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public SafetyCertificateResponse createCertificate(CreateSafetyCertificateRequest request) {
        SafetyCertificate cert = SafetyCertificate.builder()
                .employeeId(request.employeeId())
                .type(request.type())
                .number(request.number())
                .issueDate(request.issueDate())
                .expiryDate(request.expiryDate())
                .issuingAuthority(request.issuingAuthority())
                .notes(request.notes())
                .build();

        cert = certificateRepository.save(cert);
        return SafetyCertificateResponse.fromEntity(cert);
    }

    @Transactional
    public SafetyCertificateResponse updateCertificate(UUID id, CreateSafetyCertificateRequest request) {
        SafetyCertificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Удостоверение не найдено: " + id));

        if (request.type() != null) cert.setType(request.type());
        if (request.number() != null) cert.setNumber(request.number());
        if (request.issueDate() != null) cert.setIssueDate(request.issueDate());
        cert.setExpiryDate(request.expiryDate());
        if (request.issuingAuthority() != null) cert.setIssuingAuthority(request.issuingAuthority());
        if (request.notes() != null) cert.setNotes(request.notes());

        cert = certificateRepository.save(cert);
        return SafetyCertificateResponse.fromEntity(cert);
    }
}
