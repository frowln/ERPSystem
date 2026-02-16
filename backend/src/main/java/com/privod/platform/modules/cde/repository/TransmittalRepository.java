package com.privod.platform.modules.cde.repository;

import com.privod.platform.modules.cde.domain.Transmittal;
import com.privod.platform.modules.cde.domain.TransmittalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransmittalRepository extends JpaRepository<Transmittal, UUID> {

    Optional<Transmittal> findByProjectIdAndTransmittalNumberAndDeletedFalse(UUID projectId, String transmittalNumber);

    Page<Transmittal> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Transmittal> findByDeletedFalse(Pageable pageable);

    Page<Transmittal> findByStatusAndDeletedFalse(TransmittalStatus status, Pageable pageable);

    Page<Transmittal> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, TransmittalStatus status, Pageable pageable);
}
