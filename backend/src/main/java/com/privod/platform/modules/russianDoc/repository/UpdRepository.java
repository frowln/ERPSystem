package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.Upd;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UpdRepository extends JpaRepository<Upd, UUID>, JpaSpecificationExecutor<Upd> {

    Page<Upd> findByDeletedFalse(Pageable pageable);

    Page<Upd> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Upd> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<Upd> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    Optional<Upd> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<Upd> findByStatusAndDeletedFalse(RussianDocStatus status);

    List<Upd> findBySellerIdAndDeletedFalseOrderByDateDesc(UUID sellerId);

    List<Upd> findByBuyerIdAndDeletedFalseOrderByDateDesc(UUID buyerId);
}
