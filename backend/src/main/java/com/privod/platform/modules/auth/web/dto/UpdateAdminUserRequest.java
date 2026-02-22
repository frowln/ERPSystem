package com.privod.platform.modules.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateAdminUserRequest(
        @Email(message = "Invalid email format")
        String email,

        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        String role,

        Boolean enabled
) {
}
