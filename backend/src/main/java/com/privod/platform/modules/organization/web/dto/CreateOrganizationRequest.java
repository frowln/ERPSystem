package com.privod.platform.modules.organization.web.dto;

import com.privod.platform.modules.organization.domain.OrganizationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateOrganizationRequest(
        @NotBlank(message = "Organization name is required")
        @Size(max = 500, message = "Name must not exceed 500 characters")
        String name,

        @Pattern(regexp = "^(\\d{10}|\\d{12})$", message = "INN must be 10 or 12 digits")
        String inn,

        @Pattern(regexp = "^\\d{9}$", message = "KPP must be 9 digits")
        String kpp,

        @Pattern(regexp = "^\\d{13,15}$", message = "OGRN must be 13-15 digits")
        String ogrn,

        @Size(max = 1000)
        String legalAddress,

        @Size(max = 1000)
        String actualAddress,

        @Size(max = 20)
        String phone,

        @Email(message = "Invalid email format")
        String email,

        OrganizationType type,

        UUID parentId
) {
}
