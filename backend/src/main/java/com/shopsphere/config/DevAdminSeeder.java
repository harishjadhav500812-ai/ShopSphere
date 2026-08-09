package com.shopsphere.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.shopsphere.user.domain.Role;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;

/**
 * Creates an ADMIN account at startup only when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD
 * environment variables are set (registration endpoints reject the ADMIN role by design).
 * Idempotent: does nothing when the email already exists. No secrets are hardcoded.
 */
@Component
public class DevAdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevAdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DevAdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        String email = System.getenv("SEED_ADMIN_EMAIL");
        String password = System.getenv("SEED_ADMIN_PASSWORD");
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        var existing = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existing.isPresent()) {
            // Keep accounts seeded before email verification existed able to log in.
            User admin = existing.get();
            if (!admin.isEmailVerified()) {
                admin.markEmailVerified();
                userRepository.save(admin);
                log.info("Marked existing ADMIN account {} as email-verified", normalizedEmail);
            }
            return;
        }

        String fullName = System.getenv("SEED_ADMIN_NAME");
        if (fullName == null || fullName.isBlank()) {
            fullName = "ShopSphere Admin";
        }

        User admin = new User(normalizedEmail, passwordEncoder.encode(password), fullName.trim(), Role.ADMIN);
        admin.markEmailVerified(); // seeded accounts skip email verification
        userRepository.save(admin);
        log.info("Seeded ADMIN account {}", normalizedEmail);
    }
}
