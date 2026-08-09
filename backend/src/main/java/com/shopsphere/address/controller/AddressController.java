package com.shopsphere.address.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.address.dto.AddressResponse;
import com.shopsphere.address.dto.CreateAddressRequest;
import com.shopsphere.address.dto.UpdateAddressRequest;
import com.shopsphere.address.service.AddressService;

import jakarta.validation.Valid;

/**
 * Saved delivery addresses for the authenticated customer ("address book").
 * New module — does not modify any existing endpoint or entity.
 */
@RestController
@RequestMapping(path = "/api/addresses", produces = MediaType.APPLICATION_JSON_VALUE)
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    private Long currentUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        return uid == null ? null : uid.longValue();
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<AddressResponse> list(Authentication authentication) {
        return addressService.listForUser(currentUserId(authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public AddressResponse getById(@PathVariable Long id, Authentication authentication) {
        return addressService.getForUser(id, currentUserId(authentication));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AddressResponse> create(@Valid @RequestBody CreateAddressRequest request, Authentication authentication) {
        AddressResponse response = addressService.create(currentUserId(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).location(URI.create("/api/addresses/" + response.id())).body(response);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    public AddressResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAddressRequest request, Authentication authentication) {
        return addressService.update(currentUserId(authentication), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        addressService.delete(currentUserId(authentication), id);
        return ResponseEntity.noContent().build();
    }
}
