package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.RateResourceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RateResourceItemRepository extends JpaRepository<RateResourceItem, UUID> {

    List<RateResourceItem> findByRateIdAndDeletedFalse(UUID rateId);
}
