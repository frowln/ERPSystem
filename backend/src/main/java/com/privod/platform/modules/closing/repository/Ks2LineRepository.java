package com.privod.platform.modules.closing.repository;

import com.privod.platform.modules.closing.domain.Ks2Line;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface Ks2LineRepository extends JpaRepository<Ks2Line, UUID> {

    List<Ks2Line> findByKs2IdAndDeletedFalseOrderBySequenceAsc(UUID ks2Id);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM Ks2Line l WHERE l.ks2Id = :ks2Id AND l.deleted = false")
    BigDecimal sumAmountByKs2Id(@Param("ks2Id") UUID ks2Id);

    @Query("SELECT COALESCE(SUM(l.quantity), 0) FROM Ks2Line l WHERE l.ks2Id = :ks2Id AND l.deleted = false")
    BigDecimal sumQuantityByKs2Id(@Param("ks2Id") UUID ks2Id);
}
