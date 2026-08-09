package com.shopsphere.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;
import com.shopsphere.verification.repository.VerificationCodeRepository;

/**
 * One-time migration for accounts created before email verification existed.
 *
 * Accounts registered after the feature shipped always have a row in verification_codes
 * until they verify, so an unverified user WITHOUT a pending code is necessarily a
 * legacy account and is marked verified. Idempotent: becomes a no-op once backfilled.
 */
@Component
public class EmailVerifiedBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailVerifiedBackfill.class);

    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;

    public EmailVerifiedBackfill(UserRepository userRepository, VerificationCodeRepository codeRepository) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> legacyUsers = userRepository.findAll().stream()
                .filter(user -> !user.isEmailVerified())
                .filter(user -> codeRepository.findByUserId(user.getId()).isEmpty())
                .toList();

        for (User user : legacyUsers) {
            user.markEmailVerified();
            userRepository.save(user);
            log.info("Backfilled email_verified=true for legacy account {}", user.getEmail());
        }
    }
}
