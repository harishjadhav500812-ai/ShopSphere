package com.shopsphere.verification.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shopsphere.verification.domain.VerificationCode;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    Optional<VerificationCode> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM VerificationCode v WHERE v.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}