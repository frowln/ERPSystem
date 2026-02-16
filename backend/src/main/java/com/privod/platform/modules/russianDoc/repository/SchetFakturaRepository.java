package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.SchetFaktura;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SchetFakturaRepository extends JpaRepository<SchetFaktura, UUID>, JpaSpecificationExecutor<SchetFaktura> {

    Page<SchetFaktura> findByDeletedFalse(Pageable pageable);

    Page<SchetFaktura> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<SchetFaktura> findByStatusAndDeletedFalse(RussianDocStatus status);

    List<SchetFaktura> findBySellerIdAndDeletedFalseOrderByDateDesc(UUID sellerId);
}
