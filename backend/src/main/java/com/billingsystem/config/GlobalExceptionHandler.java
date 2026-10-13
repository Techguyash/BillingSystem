package com.billingsystem.config;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    List<String> messages =
        ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + " " + e.getDefaultMessage())
            .toList();
    return ResponseEntity.badRequest()
        .body(Map.of("statusCode", 400, "message", messages, "error", "Bad Request"));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("statusCode", 400, "message", ex.getMessage(), "error", "Bad Request"));
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("statusCode", 400, "message", ex.getMessage(), "error", "Bad Request"));
  }

  /** Malformed JSON, wrong types, or a missing request body entirely. */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("statusCode", 400, "message", "Malformed request body", "error", "Bad Request"));
  }

  /** Missing/wrong Content-Type header (e.g. no `application/json`). */
  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<Map<String, Object>> handleUnsupportedMediaType(
      HttpMediaTypeNotSupportedException ex) {
    return ResponseEntity.badRequest()
        .body(
            Map.of(
                "statusCode",
                400,
                "message",
                "Request must be sent as application/json",
                "error",
                "Bad Request"));
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<Map<String, Object>> handleMissingParam(
      MissingServletRequestParameterException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("statusCode", 400, "message", ex.getMessage(), "error", "Bad Request"));
  }

  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(Map.of("statusCode", 404, "message", "Not found", "error", "Not Found"));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("statusCode", 401, "message", ex.getMessage(), "error", "Unauthorized"));
  }

  /**
   * Spring Security throws this from every failed @PreAuthorize check. It
   * MUST be handled explicitly and ahead of the generic Exception catch-all
   * below — @ExceptionHandler resolution picks the most specific matching
   * type regardless of declaration order, but without this handler at all,
   * AccessDeniedException would fall through to the generic one and every
   * permission-denied request would incorrectly become a 500 instead of 403.
   */
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(
            Map.of(
                "statusCode",
                403,
                "message",
                "You do not have permission to perform this action.",
                "error",
                "Forbidden"));
  }

  /**
   * Covers DB-level unique constraint violations that slip past application
   * validation (e.g. two concurrent requests creating the same custom field
   * key, or a role/customer/user name collision under a race). Without this,
   * it was an unhandled 500 that — due to how it interacts with the security
   * filter chain here — surfaced to the client as a confusing 403.
   */
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
      DataIntegrityViolationException ex) {
    log.warn("Data integrity violation: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            Map.of(
                "statusCode",
                409,
                "message",
                "This conflicts with an existing record (e.g. a duplicate name or key).",
                "error",
                "Conflict"));
  }

  /**
   * Last-resort catch-all so an unexpected bug never leaks a stack trace to
   * the client or surfaces as a misleading status code — always a clean 500
   * with the real detail only in the server log.
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            Map.of(
                "statusCode",
                500,
                "message",
                "Something went wrong on our end. Please try again.",
                "error",
                "Internal Server Error"));
  }
}
