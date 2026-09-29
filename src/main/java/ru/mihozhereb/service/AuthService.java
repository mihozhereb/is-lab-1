package ru.mihozhereb.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import ru.mihozhereb.domain.AppUser;
import ru.mihozhereb.repository.Repository;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/** Регистрация и вход. Пароли хранятся как PBKDF2-HMAC-SHA256 с солью: итерации:соль:хэш (Base64). */
@ApplicationScoped
@Transactional
public class AuthService {
    public static final String SESSION_USER = "islab.user";

    private static final Pattern USERNAME = Pattern.compile("[A-Za-z0-9_.-]{3,64}");
    private static final int ITERATIONS = 120_000;

    @Inject
    Repository repository;

    public String register(String username, String password) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (username == null || !USERNAME.matcher(username).matches()) {
            errors.put("username", "от 3 до 64 символов: латинские буквы, цифры, «_», «.», «-»");
        }
        if (password == null || password.length() < 6 || password.length() > 128) {
            errors.put("password", "от 6 до 128 символов");
        }
        if (!errors.isEmpty()) {
            throw AppException.badRequest("Проверьте введённые значения", errors);
        }
        if (repository.findBy(AppUser.class, "username", username).isPresent()) {
            throw AppException.conflict("Пользователь " + username + " уже существует");
        }
        repository.persist(new AppUser(username, hash(password)));
        return username;
    }

    public String login(String username, String password) {
        return repository.findBy(AppUser.class, "username", String.valueOf(username))
                .filter(user -> password != null && matches(password, user.getPasswordHash()))
                .map(AppUser::getUsername)
                .orElseThrow(() -> AppException.unauthorized("Неверный логин или пароль"));
    }

    static String hash(String password) {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        return ITERATIONS + ":" + Base64.getEncoder().encodeToString(salt) + ":"
                + Base64.getEncoder().encodeToString(pbkdf2(password, salt, ITERATIONS));
    }

    static boolean matches(String password, String stored) {
        String[] parts = stored.split(":");
        return MessageDigest.isEqual(Base64.getDecoder().decode(parts[2]),
                pbkdf2(password, Base64.getDecoder().decode(parts[1]), Integer.parseInt(parts[0])));
    }

    private static byte[] pbkdf2(String password, byte[] salt, int iterations) {
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(new PBEKeySpec(password.toCharArray(), salt, iterations, 256))
                    .getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
