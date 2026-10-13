package com.billingsystem.auth;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

/** Shape carried in the JWT payload and exposed as the request principal. */
@Getter
@AllArgsConstructor
public class AuthenticatedUser {
  private UUID userId;
  private UUID businessId;
  private String email;
  private String name;
  private UUID roleId;
  private String roleName;
  private List<String> permissions;
}
