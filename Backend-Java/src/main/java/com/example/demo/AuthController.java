package com.example.demo;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
public class AuthController {

    private static final String SESSION_ACCOUNT_ID = "accountId";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int PBKDF2_ITERATIONS = 210_000;
    private static final int SALT_LENGTH = 16;
    private static final int HASH_LENGTH_BITS = 256;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;

    public AuthController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody(required = false) Credentials credentials,
            HttpServletRequest request) {
        if (!isValidCredentials(credentials, true)) {
            return error(HttpStatus.BAD_REQUEST, "Enter your name, a valid email address, and a password of at least 8 characters.");
        }

        String email = normalizeEmail(credentials.email());
        String displayName = credentials.name().trim();
        if (accountRepository.findByEmail(email).isPresent()) {
            return error(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        AccountEntity account = new AccountEntity(email, displayName, hashPassword(credentials.password()));
        try {
            accountRepository.saveAndFlush(account);
        } catch (DataIntegrityViolationException exception) {
            return error(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        establishSession(request, account);
        return ResponseEntity.status(HttpStatus.CREATED).body(accountResponse(account));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody(required = false) Credentials credentials,
            HttpServletRequest request) {
        if (!isValidCredentials(credentials, false)) {
            return error(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }

        AccountEntity account = accountRepository.findByEmail(normalizeEmail(credentials.email()))
                .orElse(null);
        if (account == null || !passwordMatches(credentials.password(), account.getPasswordHash())) {
            return error(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        establishSession(request, account);
        return ResponseEntity.ok(accountResponse(account));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<Map<String, Object>> currentAccount(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return error(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }

        Object accountId = session.getAttribute(SESSION_ACCOUNT_ID);
        if (!(accountId instanceof Long id)) {
            return error(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }

        return accountRepository.findById(id)
                .map(account -> ResponseEntity.ok(accountResponse(account)))
                .orElseGet(() -> error(HttpStatus.UNAUTHORIZED, "Not authenticated."));
    }

    private static void establishSession(HttpServletRequest request, AccountEntity account) {
        HttpSession existingSession = request.getSession(false);
        if (existingSession != null) {
            existingSession.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(SESSION_ACCOUNT_ID, account.getId());
    }

    private static boolean isValidCredentials(Credentials credentials, boolean requireStrongPassword) {
        if (credentials == null || credentials.email() == null || credentials.password() == null) {
            return false;
        }

        if (requireStrongPassword && (credentials.name() == null
                || credentials.name().isBlank() || credentials.name().trim().length() > 120)) {
            return false;
        }

        String email = credentials.email().trim();
        if (email.length() > 320 || !EMAIL_PATTERN.matcher(email).matches()) {
            return false;
        }

        return requireStrongPassword ? credentials.password().length() >= 8 : !credentials.password().isBlank();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String hashPassword(String password) {
        byte[] salt = new byte[SALT_LENGTH];
        SECURE_RANDOM.nextBytes(salt);
        byte[] hash = derivePasswordHash(password, salt, PBKDF2_ITERATIONS);
        return "pbkdf2$" + PBKDF2_ITERATIONS + "$"

        + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(hash);
    }

    private static boolean passwordMatches(String password, String storedHash) {
        try {
            String[] parts = storedHash.split("\\$", -1);
            if (parts.length != 4 || !"pbkdf2".equals(parts[0])) {
                return false;
            }

            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[3]);
            byte[] actualHash = derivePasswordHash(password, salt, iterations);
            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static byte[] derivePasswordHash(String password, byte[] salt, int iterations) {
        char[] passwordChars = password.toCharArray();
        PBEKeySpec spec = new PBEKeySpec(passwordChars, salt, iterations, HASH_LENGTH_BITS);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to securely process the password.", exception);
        } finally {
            spec.clearPassword();
            Arrays.fill(passwordChars, '\0');
        }
    }

    private static Map<String, Object> accountResponse(AccountEntity account) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", account.getId());
        response.put("email", account.getEmail());
        response.put("name", account.getDisplayName());
        return response;
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    public record Credentials(String name, String email, String password) {}
}
