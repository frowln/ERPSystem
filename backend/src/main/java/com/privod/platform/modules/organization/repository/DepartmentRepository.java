package com.privod.platform.modules.organization.repository;

import com.privod.platform.modules.organization.domain.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    Page<Department> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    List<Department> findByParentId(UUID parentId);

    List<Department> findByOrganizationIdAndDeletedFalse(UUID organizationId);

    List<Department> findByOrganizationIdOrderBySortOrderAsc(UUID organizationId);

    List<Department> findByOrganizationIdAndActiveTrueOrderBySortOrderAsc(UUID organizationId);
}
