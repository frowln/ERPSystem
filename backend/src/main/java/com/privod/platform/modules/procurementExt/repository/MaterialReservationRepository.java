package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.MaterialReservation;
import com.privod.platform.modules.procurementExt.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MaterialReservationRepository extends JpaRepository<MaterialReservation, UUID>, JpaSpecificationExecutor<MaterialReservation> {

    List<MaterialReservation> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, ReservationStatus status);

    List<MaterialReservation> findByMaterialIdAndStatusAndDeletedFalse(UUID materialId, ReservationStatus status);

    List<MaterialReservation> findByStatusAndExpiresAtBeforeAndDeletedFalse(ReservationStatus status, Instant now);
}
