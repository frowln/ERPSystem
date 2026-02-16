package com.privod.platform.infrastructure.config;

import com.privod.platform.modules.auth.domain.Role;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.RoleRepository;
import com.privod.platform.modules.auth.repository.UserRepository;
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
@Profile("dev")
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureAdminRole();
        ensureAdminUser();
    }

    private void ensureAdminRole() {
        if (!roleRepository.existsByCode("ADMIN")) {
            Role adminRole = Role.builder()
                    .code("ADMIN")
                    .name("Администратор")
                    .description("Full system access")
                    .systemRole(true)
                    .build();
            roleRepository.save(adminRole);
            log.info("Created ADMIN role");
        }

        if (!roleRepository.existsByCode("VIEWER")) {
            Role viewerRole = Role.builder()
                    .code("VIEWER")
                    .name("Наблюдатель")
                    .description("Read-only access")
                    .systemRole(true)
                    .build();
            roleRepository.save(viewerRole);
            log.info("Created VIEWER role");
        }
    }

    private void ensureAdminUser() {
        // Ensure both admin emails work (legacy + new)
        ensureAdmin("admin@privod.com", "Admin", "Admin");
        ensureAdmin("admin@privod.ru", "System", "Administrator");
    }

    private void ensureAdmin(String email, String firstName, String lastName) {
        if (userRepository.existsByEmail(email)) {
            User admin = userRepository.findByEmail(email).orElseThrow();
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            log.info("Reset admin password for {}", email);
        } else {
            Role adminRole = roleRepository.findByCode("ADMIN").orElseThrow();
            User admin = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .firstName(firstName)
                    .lastName(lastName)
                    .enabled(true)
                    .build();
            admin.addRole(adminRole);
            userRepository.save(admin);
            log.info("Created admin user: {}", email);
        }
    }
}
