package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.quality.domain.MaterialCertificate;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.quality.domain.MaterialCertificateType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PtoMaterialCertificateRepository extends JpaRepository<MaterialCertificate, UUID>,
        JpaSpecificationExecutor<MaterialCertificate> {

    Page<MaterialCertificate> findByMaterialIdAndDeletedFalse(UUID materialId, Pageable pageable);

    List<MaterialCertificate> findByMaterialIdAndStatusAndDeletedFalse(UUID materialId, MaterialCertificateStatus status);

    List<MaterialCertificate> findByCertificateTypeAndDeletedFalse(MaterialCertificateType certificateType);

    long countByDeletedFalse();

    long countByStatusAndDeletedFalse(MaterialCertificateStatus status);
}
