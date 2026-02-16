package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.Torg12;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Torg12Repository extends JpaRepository<Torg12, UUID>, JpaSpecificationExecutor<Torg12> {

    Page<Torg12> findByDeletedFalse(Pageable pageable);

    Page<Torg12> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Torg12> findByStatusAndDeletedFalse(RussianDocStatus status);

    List<Torg12> findBySupplierIdAndDeletedFalseOrderByDateDesc(UUID supplierId);
}
