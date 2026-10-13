package com.billingsystem.auth;

import com.billingsystem.auth.dto.LoginRequest;
import com.billingsystem.auth.dto.LoginResponse;
import com.billingsystem.auth.dto.RefreshTokenRequest;
import com.billingsystem.auth.dto.TokenPair;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

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
}
