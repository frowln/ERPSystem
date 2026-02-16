package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.AnalogRequest;
import com.privod.platform.modules.specification.domain.AnalogRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalogRequestRepository extends JpaRepository<AnalogRequest, UUID> {

    Page<AnalogRequest> findByDeletedFalse(Pageable pageable);

    Page<AnalogRequest> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<AnalogRequest> findByStatusAndDeletedFalse(AnalogRequestStatus status);

    Page<AnalogRequest> findByStatusAndDeletedFalse(AnalogRequestStatus status, Pageable pageable);

    List<AnalogRequest> findByRequestedByIdAndDeletedFalse(UUID requestedById);

    List<AnalogRequest> findByOriginalMaterialIdAndDeletedFalse(UUID originalMaterialId);
}
