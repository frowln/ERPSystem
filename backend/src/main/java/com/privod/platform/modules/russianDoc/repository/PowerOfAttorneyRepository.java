package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.PowerOfAttorney;
import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PowerOfAttorneyRepository extends JpaRepository<PowerOfAttorney, UUID> {

    Page<PowerOfAttorney> findByDeletedFalse(Pageable pageable);

    Page<PowerOfAttorney> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<PowerOfAttorney> findByIssuedToIdAndDeletedFalseOrderByDateDesc(UUID issuedToId);

    @Query("SELECT p FROM PowerOfAttorney p WHERE p.deleted = false AND p.status = :status " +
            "AND p.validUntil < :today")
    List<PowerOfAttorney> findExpiredByStatus(@Param("status") RussianDocStatus status,
                                              @Param("today") LocalDate today);
}
