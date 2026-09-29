package ru.mihozhereb.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {
    @Test
    void hashMatchesOnlyTheOriginalPassword() {
        String hash = AuthService.hash("secret1");
        assertTrue(AuthService.matches("secret1", hash));
        assertFalse(AuthService.matches("secret2", hash));
    }

    @Test
    void samePasswordGetsDifferentSalt() {
        assertNotEquals(AuthService.hash("secret1"), AuthService.hash("secret1"));
    }
}
