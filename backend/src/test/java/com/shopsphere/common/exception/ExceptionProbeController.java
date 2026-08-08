package com.shopsphere.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/**
 * Test-only controller used to exercise {@link GlobalExceptionHandler}.
 * Not part of the application runtime classpath under {@code src/main}.
 */
@RestController
@RequestMapping("/__test__")
@Validated
class ExceptionProbeController {

    @PostMapping("/validate")
    void validate(@Valid @RequestBody ProbeRequest request) {
        // Intentionally empty: validation failures are the test subject.
    }

    @GetMapping("/not-found")
    void notFound() {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Probe resource not found");
    }

    @GetMapping("/boom")
    void boom() {
        throw new IllegalStateException("boom");
    }

    record ProbeRequest(@NotBlank(message = "name is required") String name) {
    }
}
