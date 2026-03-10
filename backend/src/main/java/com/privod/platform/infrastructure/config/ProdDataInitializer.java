package com.privod.platform.infrastructure.config;

import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.organization.domain.Organization;
import com.privod.platform.modules.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("prod")
public class ProdDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureRoles();
        var org = ensureOrganization();
        var orgId = org.getId();

        // Admin: Касимов Дамир Айратович
        ensureUser("d.kasimov@privod.ru", "Дамир", "Касимов",
                "Генеральный директор", "Privod2025!", orgId, "ADMIN");

        // Руководитель проектного отдела: Дмитрий К.
        ensureUser("d.k@privod.ru", "Дмитрий", "К.",
                "Руководитель проектного отдела", "Privod2025!", orgId, "ADMIN");
    }

    private void ensureRoles() {
        if (!roleRepository.existsByCode("ADMIN")) {
            roleRepository.save(Role.builder()
                    .code("ADMIN").name("Администратор")
                    .description("Full system access").systemRole(true).build());
            log.info("Created ADMIN role");
        }
        for (var entry : new String[][]{
                {"MANAGER", "Менеджер", "Project management access"},
                {"ENGINEER", "Инженер", "Engineering access"},
                {"ACCOUNTANT", "Бухгалтер", "Finance access"},
                {"VIEWER", "Наблюдатель", "Read-only access"}
        }) {
            if (!roleRepository.existsByCode(entry[0])) {
                roleRepository.save(Role.builder()
                        .code(entry[0]).name(entry[1])
                        .description(entry[2]).systemRole(true).build());
                log.info("Created {} role", entry[0]);
            }
        }
    }

    private Organization ensureOrganization() {
        return organizationRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Organization org = Organization.builder()
                            .name("Привод")
                            .inn("7841000001")
                            .build();
                    org = organizationRepository.save(org);
                    log.info("Created organization: {}", org.getName());
                    return org;
                });
    }

    private void ensureUser(String email, String firstName, String lastName,
                            String position, String password, java.util.UUID orgId, String roleCode) {
        if (userRepository.existsByEmail(email)) {
            log.info("User {} already exists, skipping", email);
            return;
        }
        Role role = roleRepository.findByCode(roleCode).orElseThrow();
        User user = User.builder()
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .position(position)
                .passwordHash(passwordEncoder.encode(password))
                .organizationId(orgId)
                .enabled(true)
                .build();
        user.addRole(role);
        userRepository.save(user);
        log.info("Created user: {} ({} {})", email, firstName, lastName);
    }
}
