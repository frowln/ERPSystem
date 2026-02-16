package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.WorkBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkBookRepository extends JpaRepository<WorkBook, UUID> {

    Optional<WorkBook> findByEmployeeIdAndDeletedFalse(UUID employeeId);
}
