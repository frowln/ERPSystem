package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.CertificateLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CertificateLineRepository extends JpaRepository<CertificateLine, UUID> {

    List<CertificateLine> findByCertificateIdAndDeletedFalse(UUID certificateId);

    List<CertificateLine> findByCertificateIdAndIsCompliantFalseAndDeletedFalse(UUID certificateId);

    long countByCertificateIdAndDeletedFalse(UUID certificateId);
}
