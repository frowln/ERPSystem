package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.organization.domain.Department;
import com.privod.platform.modules.organization.repository.DepartmentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public record CreateDepartmentRequest(
            @NotBlank String name,
            String code,
            UUID parentId,
            UUID headId,
            String description,
            Integer sortOrder
    ) {}

    public record UpdateDepartmentRequest(
            String name,
            String code,
            UUID parentId,
            UUID headId,
            String description,
            Integer sortOrder,
            Boolean isActive
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR_MANAGER', 'PROJECT_MANAGER', 'ENGINEER', 'ACCOUNTANT', 'VIEWER')")
    public ResponseEntity<ApiResponse<List<Department>>> list() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<Department> departments = departmentRepository.findByOrganizationIdAndActiveTrueOrderBySortOrderAsc(orgId);
        return ResponseEntity.ok(ApiResponse.ok(departments));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Department>> create(@Valid @RequestBody CreateDepartmentRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Department dept = Department.builder()
                .organizationId(orgId)
                .name(request.name())
                .code(request.code())
                .parentId(request.parentId())
                .headId(request.headId())
                .description(request.description())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .build();
        dept = departmentRepository.save(dept);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dept));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> update(@PathVariable UUID id,
                                                          @Valid @RequestBody UpdateDepartmentRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Подразделение не найдено: " + id));

        if (!orgId.equals(dept.getOrganizationId())) {
            throw new EntityNotFoundException("Подразделение не найдено: " + id);
        }

        if (request.name() != null) dept.setName(request.name());
        if (request.code() != null) dept.setCode(request.code());
        // parentId and headId are always set (null = clear / move to root)
        dept.setParentId(request.parentId());
        dept.setHeadId(request.headId());
        if (request.description() != null) dept.setDescription(request.description());
        if (request.sortOrder() != null) dept.setSortOrder(request.sortOrder());
        if (request.isActive() != null) dept.setActive(request.isActive());

        dept = departmentRepository.save(dept);
        return ResponseEntity.ok(ApiResponse.ok(dept));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Подразделение не найдено: " + id));

        if (!orgId.equals(dept.getOrganizationId())) {
            throw new EntityNotFoundException("Подразделение не найдено: " + id);
        }

        List<Department> children = departmentRepository.findByParentId(id);
        if (!children.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(HttpStatus.CONFLICT.value(), "Сначала удалите дочерние подразделения"));
        }

        dept.setActive(false);
        departmentRepository.save(dept);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
