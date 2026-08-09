package com.shopsphere.verification.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.shopsphere.verification.domain.VerificationToken;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByUserId(Long userId);

    Optional<VerificationToken> findByTokenHash(String tokenHash);

    void deleteByUserId(Long userId);
}
