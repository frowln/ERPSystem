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

/**
 * Demo environment data initializer.
 * Creates roles, organization, and demo user accounts
 * for all five system roles (ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER).
 *
 * Activated by: SPRING_PROFILES_ACTIVE=demo
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("demo")
public class DemoDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrganizationRepository organizationRepository;

    private static final String DEMO_PASSWORD = "Demo123!";

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("=== Demo Data Initializer: starting ===");
        ensureRoles();
        var org = ensureOrganization();
        var orgId = org.getId();
        ensureDemoUsers(orgId);
        log.info("=== Demo Data Initializer: complete ===");
    }

    private void ensureRoles() {
        for (var entry : new String[][]{
                {"ADMIN", "Администратор", "Full system access"},
                {"MANAGER", "Менеджер", "Project management access"},
                {"ENGINEER", "Инженер", "Engineering access"},
                {"ACCOUNTANT", "Бухгалтер", "Finance access"},
                {"VIEWER", "Наблюдатель", "Read-only access"}
        }) {
            if (!roleRepository.existsByCode(entry[0])) {
                roleRepository.save(Role.builder()
                        .code(entry[0]).name(entry[1])
                        .description(entry[2]).systemRole(true).build());
                log.info("Created role: {}", entry[0]);
            }
        }
    }

    private Organization ensureOrganization() {
        return organizationRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Organization org = Organization.builder()
                            .name("Привод (демо)")
                            .inn("7700000001")
                            .build();
                    org = organizationRepository.save(org);
                    log.info("Created demo organization: {}", org.getName());
                    return org;
                });
    }

    private void ensureDemoUsers(java.util.UUID orgId) {
        ensureUser("admin@demo.privod.ru", "Алексей", "Иванов",
                "Генеральный директор", orgId, "ADMIN");

        ensureUser("manager@demo.privod.ru", "Мария", "Петрова",
                "Руководитель проекта", orgId, "MANAGER");

        ensureUser("engineer@demo.privod.ru", "Дмитрий", "Сидоров",
                "Ведущий инженер", orgId, "ENGINEER");

        ensureUser("accountant@demo.privod.ru", "Елена", "Козлова",
                "Главный бухгалтер", orgId, "ACCOUNTANT");

        ensureUser("viewer@demo.privod.ru", "Игорь", "Новиков",
                "Наблюдатель", orgId, "VIEWER");
    }

    private void ensureUser(String email, String firstName, String lastName,
                            String position, java.util.UUID orgId, String roleCode) {
        if (userRepository.existsByEmail(email)) {
            // Reset password on every startup so demo always works
            User user = userRepository.findByEmail(email).orElseThrow();
            user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            userRepository.save(user);
            log.info("Demo user {} — password reset", email);
            return;
        }
        Role role = roleRepository.findByCode(roleCode).orElseThrow();
        User user = User.builder()
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .position(position)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .organizationId(orgId)
                .enabled(true)
                .build();
        user.addRole(role);
        userRepository.save(user);
        log.info("Created demo user: {} ({} {}, {})", email, firstName, lastName, roleCode);
    }
}
