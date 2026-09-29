package ru.mihozhereb.api;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import ru.mihozhereb.service.AppException;

import java.sql.SQLException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Provider
public class ErrorMapper implements ExceptionMapper<Throwable> {
    private static final Logger LOG = Logger.getLogger(ErrorMapper.class.getName());
    private static final Pattern CONSTRAINT = Pattern.compile("constraint \"([^\"]+)\"");
    private static final Map<String, String> UNIQUE_FIELDS = Map.of(
            "product_part_number_unique", "partNumber",
            "app_user_username_unique", "username");

    @Override
    public Response toResponse(Throwable exception) {
        for (Throwable t = exception; t != null; t = t.getCause()) {
            if (t instanceof AppException e) {
                return respond(e.status(), e.getMessage(), e.fieldErrors());
            }
            if (t instanceof ConstraintViolationException e) {
                Map<String, String> fields = new LinkedHashMap<>();
                for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
                    fields.putIfAbsent(violation.getPropertyPath().toString(), violation.getMessage());
                }
                return respond(400, "Проверьте введённые значения", fields);
            }
            if (t instanceof JsonMappingException e && !e.getPath().isEmpty()) {
                return respond(400, "Проверьте введённые значения", Map.of(jsonPath(e), jsonMessage(e)));
            }
            if (t instanceof SQLException e) {
                return fromSql(e);
            }
            if (t instanceof WebApplicationException e) {
                return respond(e.getResponse().getStatus(), e.getMessage(), Map.of());
            }
            if (t.getClass().getName().startsWith("com.fasterxml.jackson")) {
                return respond(400, "Некорректный формат данных запроса", Map.of());
            }
        }
        LOG.log(Level.SEVERE, "Необработанная ошибка", exception);
        return respond(500, "Внутренняя ошибка сервера", Map.of());
    }

    static Response toResponse(AppException e) {
        return respond(e.status(), e.getMessage(), e.fieldErrors());
    }

    @Provider
    public static class JsonErrors implements ExceptionMapper<JsonMappingException> {
        @Override
        public Response toResponse(JsonMappingException exception) {
            return new ErrorMapper().toResponse(exception);
        }
    }

    private static String jsonPath(JsonMappingException e) {
        return e.getPath().stream()
                .map(ref -> ref.getFieldName() != null ? ref.getFieldName() : String.valueOf(ref.getIndex()))
                .collect(Collectors.joining("."));
    }

    private static String jsonMessage(JsonMappingException e) {
        if (e instanceof UnrecognizedPropertyException) {
            return "неизвестное поле";
        }
        if (e instanceof InvalidFormatException f && f.getTargetType() != null && f.getTargetType().isEnum()) {
            return "допустимые значения: " + Arrays.stream(f.getTargetType().getEnumConstants())
                    .map(String::valueOf).collect(Collectors.joining(", "));
        }
        return "неверный формат значения";
    }

    private static Response fromSql(SQLException e) {
        String state = String.valueOf(e.getSQLState());
        Matcher matcher = CONSTRAINT.matcher(String.valueOf(e.getMessage()));
        String constraint = matcher.find() ? matcher.group(1) : "";
        String serverMessage = String.valueOf(e.getMessage()).lines().findFirst().orElse("").replaceFirst("^(ERROR|ОШИБКА):\\s*", "");
        return switch (state) {
            case "23505" -> respond(409, "Значение должно быть уникальным (" + constraint + ")",
                    UNIQUE_FIELDS.containsKey(constraint)
                            ? Map.of(UNIQUE_FIELDS.get(constraint), "значение должно быть уникальным") : Map.of());
            case "23503" -> respond(409, "Операция отменена: объект связан с другими объектами (" + constraint + ")", Map.of());
            case "23514", "23502" -> respond(400, "Значение нарушает ограничение базы данных (" + constraint + ")", Map.of());
            case "22003" -> respond(400, "Число выходит за допустимый диапазон", Map.of());
            case "P0002" -> respond(404, serverMessage, Map.of());
            case "22023", "P0001" -> respond(400, serverMessage, Map.of());
            default -> {
                LOG.log(Level.SEVERE, "Ошибка базы данных", e);
                yield respond(500, "Ошибка базы данных", Map.of());
            }
        };
    }

    private static Response respond(int status, String message, Map<String, String> fieldErrors) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(Map.of("message", message == null ? "Ошибка" : message, "fieldErrors", fieldErrors))
                .build();
    }
}
