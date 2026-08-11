package com.shopsphere.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.shopsphere.auth.domain.PasswordResetToken;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByUserIdAndCodeAndUsedFalse(Long userId, String code);

    void deleteByUserId(Long userId);
}
