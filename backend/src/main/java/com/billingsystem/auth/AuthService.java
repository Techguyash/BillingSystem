package com.billingsystem.auth;

import com.billingsystem.auth.dto.TokenPair;
import com.billingsystem.user.User;
import com.billingsystem.user.UserService;
import io.jsonwebtoken.Claims;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserService userService;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;

  public AuthenticatedUser validateCredentials(String email, String password) {
    User user =
        userService
            .findByEmail(email)
            .filter(User::isActive)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid email or password");
    }

    return toAuthenticatedUser(user);
  }

  public TokenPair issueTokens(AuthenticatedUser user) {
    String accessToken = jwtService.generateAccessToken(user);
    String refreshToken = jwtService.generateRefreshToken(user.getUserId());
    return new TokenPair(accessToken, refreshToken);
  }

  public TokenPair refreshAccessToken(String refreshToken) {
    Claims claims;
    try {
      claims = jwtService.parseRefreshToken(refreshToken);
    } catch (Exception e) {
      throw new BadCredentialsException("Invalid or expired refresh token");
    }

    UUID userId = UUID.fromString(claims.getSubject());
    User user =
        userService
            .findById(userId)
            .filter(User::isActive)
            .orElseThrow(() -> new BadCredentialsException("User no longer active"));

    return issueTokens(toAuthenticatedUser(user));
  }

  private AuthenticatedUser toAuthenticatedUser(User user) {
    return new AuthenticatedUser(
        user.getId(),
        user.getBusinessId(),
        user.getEmail(),
        user.getName(),
        user.getRole().getId(),
        user.getRole().getName(),
        user.getRole().getPermissions());
  }
}
