package com.privod.platform.modules.selfEmployed.repository;

import com.privod.platform.modules.selfEmployed.domain.ContractorStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedContractor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SelfEmployedContractorRepository extends JpaRepository<SelfEmployedContractor, UUID> {

    Page<SelfEmployedContractor> findByDeletedFalse(Pageable pageable);

    Page<SelfEmployedContractor> findByStatusAndDeletedFalse(ContractorStatus status, Pageable pageable);

    Optional<SelfEmployedContractor> findByInnAndDeletedFalse(String inn);

    boolean existsByInnAndDeletedFalse(String inn);

    @Query("SELECT c FROM SelfEmployedContractor c WHERE c.deleted = false AND " +
            "(LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "c.inn LIKE CONCAT('%', :search, '%'))")
    Page<SelfEmployedContractor> searchByNameOrInn(@Param("search") String search, Pageable pageable);

    long countByStatusAndDeletedFalse(ContractorStatus status);
}
