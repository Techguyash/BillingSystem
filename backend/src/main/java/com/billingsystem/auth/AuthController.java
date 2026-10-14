package com.billingsystem.auth;

import com.billingsystem.auth.dto.LoginRequest;
import com.billingsystem.auth.dto.LoginResponse;
import com.billingsystem.auth.dto.RefreshTokenRequest;
import com.billingsystem.auth.dto.TokenPair;
import com.billingsystem.auth.dto.UpdateProfileRequest;
import com.billingsystem.user.User;
import com.billingsystem.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final UserService userService;

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    AuthenticatedUser user = authService.validateCredentials(request.getEmail(), request.getPassword());
    TokenPair tokens = authService.issueTokens(user);
    return new LoginResponse(tokens.accessToken(), tokens.refreshToken(), user);
  }

  @PostMapping("/refresh")
  public TokenPair refresh(@Valid @RequestBody RefreshTokenRequest request) {
    return authService.refreshAccessToken(request.getRefreshToken());
  }

  @GetMapping("/me")
  public AuthenticatedUser me() {
    return CurrentUser.get();
  }

  /**
   * Self-service profile update (name / password). Returns a fresh token
   * pair, same shape as login — the access token already in use has the old
   * name/permissions baked in from whenever it was issued, so the frontend
   * needs new ones to reflect the change immediately rather than waiting
   * for the next natural refresh cycle.
   */
  @PatchMapping("/me")
  public LoginResponse updateMe(@Valid @RequestBody UpdateProfileRequest request) {
    var current = CurrentUser.get();
    User updated = userService.updateProfile(current.getBusinessId(), current.getUserId(), request);
    AuthenticatedUser authenticatedUser = authService.toAuthenticatedUser(updated);
    TokenPair tokens = authService.issueTokens(authenticatedUser);
    return new LoginResponse(tokens.accessToken(), tokens.refreshToken(), authenticatedUser);
  }
}
