package com.billingsystem.auth;

import com.billingsystem.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

  private final JwtProperties jwtProperties;

  private SecretKey accessKey() {
    return Keys.hmacShaKeyFor(jwtProperties.getAccessSecret().getBytes(StandardCharsets.UTF_8));
  }

  private SecretKey refreshKey() {
    return Keys.hmacShaKeyFor(jwtProperties.getRefreshSecret().getBytes(StandardCharsets.UTF_8));
  }

  public String generateAccessToken(AuthenticatedUser user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getUserId().toString())
        .claim("businessId", user.getBusinessId().toString())
        .claim("email", user.getEmail())
        .claim("name", user.getName())
        .claim("roleId", user.getRoleId().toString())
        .claim("roleName", user.getRoleName())
        .claim("permissions", user.getPermissions())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(jwtProperties.getAccessExpiresMinutes(), ChronoUnit.MINUTES)))
        .signWith(accessKey())
        .compact();
  }

  public String generateRefreshToken(UUID userId) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(userId.toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(jwtProperties.getRefreshExpiresDays(), ChronoUnit.DAYS)))
        .signWith(refreshKey())
        .compact();
  }

  public Claims parseAccessToken(String token) {
    return Jwts.parser().verifyWith(accessKey()).build().parseSignedClaims(token).getPayload();
  }

  public Claims parseRefreshToken(String token) {
    return Jwts.parser().verifyWith(refreshKey()).build().parseSignedClaims(token).getPayload();
  }

  @SuppressWarnings("unchecked")
  public AuthenticatedUser toAuthenticatedUser(Claims claims) {
    return new AuthenticatedUser(
        UUID.fromString(claims.getSubject()),
        UUID.fromString(claims.get("businessId", String.class)),
        claims.get("email", String.class),
        claims.get("name", String.class),
        UUID.fromString(claims.get("roleId", String.class)),
        claims.get("roleName", String.class),
        (List<String>) claims.get("permissions", List.class));
  }
}
