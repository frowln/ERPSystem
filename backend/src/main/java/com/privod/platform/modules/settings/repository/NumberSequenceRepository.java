package com.privod.platform.modules.settings.repository;

import com.privod.platform.modules.settings.domain.NumberSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NumberSequenceRepository extends JpaRepository<NumberSequence, UUID> {

    Optional<NumberSequence> findByCodeAndDeletedFalse(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT n FROM NumberSequence n WHERE n.code = :code AND n.deleted = false")
    Optional<NumberSequence> findByCodeForUpdate(@Param("code") String code);

    List<NumberSequence> findByDeletedFalseOrderByCodeAsc();

    boolean existsByCodeAndDeletedFalse(String code);
}
