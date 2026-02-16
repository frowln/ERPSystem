package com.privod.platform.modules.kep.repository;

import com.privod.platform.modules.kep.domain.KepCertificate;
import com.privod.platform.modules.kep.domain.KepCertificateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KepCertificateRepository extends JpaRepository<KepCertificate, UUID>,
        JpaSpecificationExecutor<KepCertificate> {

    Page<KepCertificate> findByOwnerIdAndDeletedFalse(UUID ownerId, Pageable pageable);

    List<KepCertificate> findByOwnerIdAndStatusAndDeletedFalse(UUID ownerId, KepCertificateStatus status);

    Optional<KepCertificate> findByThumbprintAndDeletedFalse(String thumbprint);

    Optional<KepCertificate> findBySerialNumberAndDeletedFalse(String serialNumber);

    @Query("SELECT c FROM KepCertificate c WHERE c.deleted = false AND c.status = 'ACTIVE' " +
            "AND c.validTo < :threshold")
    List<KepCertificate> findExpiringCertificates(@Param("threshold") LocalDateTime threshold);

    long countByOwnerIdAndStatusAndDeletedFalse(UUID ownerId, KepCertificateStatus status);

    @Query("SELECT c FROM KepCertificate c WHERE c.deleted = false AND " +
            "(LOWER(c.ownerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.subjectOrg) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "c.subjectInn LIKE CONCAT('%', :search, '%'))")
    Page<KepCertificate> search(@Param("search") String search, Pageable pageable);
}
