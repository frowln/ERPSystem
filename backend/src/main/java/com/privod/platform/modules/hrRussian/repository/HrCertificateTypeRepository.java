package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.HrCertificateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HrCertificateTypeRepository extends JpaRepository<HrCertificateType, UUID> {

    Optional<HrCertificateType> findByCodeAndDeletedFalse(String code);

    List<HrCertificateType> findByDeletedFalse();

    List<HrCertificateType> findByRequiredTrueAndDeletedFalse();
}
