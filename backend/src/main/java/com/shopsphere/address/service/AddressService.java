package com.shopsphere.address.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.address.domain.Address;
import com.shopsphere.address.dto.AddressResponse;
import com.shopsphere.address.dto.CreateAddressRequest;
import com.shopsphere.address.dto.UpdateAddressRequest;
import com.shopsphere.address.repository.AddressRepository;

@Service
public class AddressService {

    private final AddressRepository addressRepository;

    public AddressService(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> listForUser(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(userId)
                .stream()
                .map(AddressService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AddressResponse getForUser(Long id, Long userId) {
        Address address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        return toResponse(address);
    }

    @Transactional
    public AddressResponse create(Long userId, CreateAddressRequest request) {
        boolean isFirstAddress = addressRepository.countByUserId(userId) == 0;
        boolean makeDefault = isFirstAddress || Boolean.TRUE.equals(request.isDefault());

        if (makeDefault) {
            clearExistingDefault(userId);
        }

        Address address = new Address(
                userId,
                normalizeOptional(request.label()),
                request.recipientName().trim(),
                request.phone().trim(),
                request.addressLine1().trim(),
                normalizeOptional(request.addressLine2()),
                request.city().trim(),
                request.state().trim(),
                request.postalCode().trim(),
                request.country().trim(),
                makeDefault
        );
        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse update(Long userId, Long id, UpdateAddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

        address.setLabel(normalizeOptional(request.label()));
        address.setRecipientName(request.recipientName().trim());
        address.setPhone(request.phone().trim());
        address.setAddressLine1(request.addressLine1().trim());
        address.setAddressLine2(normalizeOptional(request.addressLine2()));
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPostalCode(request.postalCode().trim());
        address.setCountry(request.country().trim());

        if (Boolean.TRUE.equals(request.isDefault()) && !address.isDefault()) {
            clearExistingDefault(userId);
            address.setDefault(true);
        }

        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Address address = addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        boolean wasDefault = address.isDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(userId)
                    .stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setDefault(true);
                        addressRepository.save(next);
                    });
        }
    }

    private void clearExistingDefault(Long userId) {
        addressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(userId).stream()
                .filter(Address::isDefault)
                .forEach(existing -> {
                    existing.setDefault(false);
                    addressRepository.save(existing);
                });
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static AddressResponse toResponse(Address a) {
        return new AddressResponse(
                a.getId(),
                a.getLabel(),
                a.getRecipientName(),
                a.getPhone(),
                a.getAddressLine1(),
                a.getAddressLine2(),
                a.getCity(),
                a.getState(),
                a.getPostalCode(),
                a.getCountry(),
                a.isDefault(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
