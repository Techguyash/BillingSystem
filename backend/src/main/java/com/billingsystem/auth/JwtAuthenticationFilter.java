package com.billingsystem.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads the Bearer access token, verifies it, and — on success — puts an
 * AuthenticatedUser principal into the SecurityContext with each permission
 * string as a granted authority. This lets controller methods declare
 * @PreAuthorize("hasAuthority('invoice.create')") directly, mirroring the
 * Node backend's RequirePermissions decorator + PermissionsGuard.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");

    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      try {
        var claims = jwtService.parseAccessToken(token);
        AuthenticatedUser user = jwtService.toAuthenticatedUser(claims);
        Collection<? extends GrantedAuthority> authorities =
            user.getPermissions().stream().map(SimpleGrantedAuthority::new).toList();
        var authentication =
            new UsernamePasswordAuthenticationToken(user, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
      } catch (Exception ignored) {
        // Invalid/expired token: leave the context unauthenticated so the
        // request falls through to a 401/403 from the security chain.
      }
    }

    filterChain.doFilter(request, response);
  }
}
