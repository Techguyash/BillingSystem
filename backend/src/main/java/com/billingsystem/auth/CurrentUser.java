package com.billingsystem.auth;

import org.springframework.security.core.context.SecurityContextHolder;

/** Small helper to pull the AuthenticatedUser principal out of the security context in controllers. */
public final class CurrentUser {

  private CurrentUser() {}

  public static AuthenticatedUser get() {
    return (AuthenticatedUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
  }
}
