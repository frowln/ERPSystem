package com.privod.platform.modules.kep.repository;

import com.privod.platform.modules.kep.domain.KepSigningRequest;
import com.privod.platform.modules.kep.domain.KepSigningStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface KepSigningRequestRepository extends JpaRepository<KepSigningRequest, UUID>,
        JpaSpecificationExecutor<KepSigningRequest> {

    Page<KepSigningRequest> findBySignerIdAndDeletedFalse(UUID signerId, Pageable pageable);

    Page<KepSigningRequest> findByRequesterIdAndDeletedFalse(UUID requesterId, Pageable pageable);

    Page<KepSigningRequest> findBySignerIdAndStatusAndDeletedFalse(UUID signerId, KepSigningStatus status,
                                                                     Pageable pageable);

    List<KepSigningRequest> findByDocumentModelAndDocumentIdAndDeletedFalse(String documentModel, UUID documentId);

    long countBySignerIdAndStatusAndDeletedFalse(UUID signerId, KepSigningStatus status);

    @Query("SELECT r FROM KepSigningRequest r WHERE r.deleted = false AND r.status = 'PENDING' " +
            "AND r.dueDate < :today")
    List<KepSigningRequest> findOverdueRequests(@Param("today") LocalDate today);
}
