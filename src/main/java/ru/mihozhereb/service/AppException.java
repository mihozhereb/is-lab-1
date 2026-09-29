package ru.mihozhereb.service;

import java.util.Map;

public class AppException extends RuntimeException {
    private final int status;
    private final Map<String, String> fieldErrors;

    private AppException(int status, String message, Map<String, String> fieldErrors) {
        super(message);
        this.status = status;
        this.fieldErrors = fieldErrors;
    }

    public static AppException badRequest(String message, Map<String, String> fieldErrors) {
        return new AppException(400, message, fieldErrors);
    }

    public static AppException badRequest(String message) {
        return badRequest(message, Map.of());
    }

    public static AppException unauthorized(String message) {
        return new AppException(401, message, Map.of());
    }

    public static AppException notFound(String message) {
        return new AppException(404, message, Map.of());
    }

    public static AppException conflict(String message) {
        return new AppException(409, message, Map.of());
    }

    public int status() {
        return status;
    }

    public Map<String, String> fieldErrors() {
        return fieldErrors;
    }
}
