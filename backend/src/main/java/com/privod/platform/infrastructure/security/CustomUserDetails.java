package com.privod.platform.infrastructure.security;

import com.privod.platform.modules.auth.domain.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
public class CustomUserDetails implements UserDetails {

    /**
     * Role code aliases to keep backward compatibility between:
     * - roles seeded in older migrations
     * - roles referenced by `@PreAuthorize` in code
     *
     * This prevents "invisible 403" when the DB contains the legacy code but
     * controllers check the newer code (or vice versa).
     */
    private static final Map<String, Set<String>> ROLE_ALIASES = buildRoleAliases();

    private final UUID id;
    private final String email;
    private final String password;
    private final String firstName;
    private final String lastName;
    private final boolean enabled;
    private final UUID organizationId;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.enabled = user.isEnabled();
        this.organizationId = user.getOrganizationId();
        Set<String> expandedRoleCodes = user.getRoles().stream()
                .flatMap(role -> expandRoleCodes(role.getCode()).stream())
                .collect(Collectors.toSet());

        this.authorities = expandedRoleCodes.stream()
                .map(code -> new SimpleGrantedAuthority("ROLE_" + code))
                .collect(Collectors.toSet());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    private static Set<String> expandRoleCodes(String roleCode) {
        Set<String> expanded = new HashSet<>();
        expanded.add(roleCode);
        Set<String> aliases = ROLE_ALIASES.get(roleCode);
        if (aliases != null) {
            expanded.addAll(aliases);
        }
        return expanded;
    }

    private static Map<String, Set<String>> buildRoleAliases() {
        Map<String, Set<String>> m = new HashMap<>();

        // Seeded legacy names -> role codes used in controllers (`@PreAuthorize`).
        m.put("QUALITY_INSPECTOR", Set.of("QUALITY_MANAGER"));
        m.put("DOCUMENT_CONTROLLER", Set.of("DOCUMENT_MANAGER"));
        m.put("FINANCIAL_CONTROLLER", Set.of("FINANCE_MANAGER"));
        m.put("SCHEDULER", Set.of("PLANNER"));
        m.put("SYSTEM_INTEGRATOR", Set.of("SYSTEM"));

        // Safety is split across modules; keep both codes compatible.
        m.put("SAFETY_OFFICER", Set.of("SAFETY_MANAGER"));
        m.put("SAFETY_MANAGER", Set.of("SAFETY_OFFICER"));

        // Frontend historically used MANAGER while backend uses PROJECT_MANAGER widely.
        m.put("PROJECT_MANAGER", Set.of("MANAGER"));
        m.put("MANAGER", Set.of("PROJECT_MANAGER"));

        return m;
    }
}
