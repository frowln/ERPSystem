package com.privod.platform.modules.support.repository;

import com.privod.platform.modules.support.domain.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketCategoryRepository extends JpaRepository<TicketCategory, UUID> {

    List<TicketCategory> findByIsActiveTrueAndDeletedFalse();

    Optional<TicketCategory> findByCodeAndDeletedFalse(String code);
}
