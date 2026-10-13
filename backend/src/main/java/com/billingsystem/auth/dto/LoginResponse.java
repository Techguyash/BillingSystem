package com.billingsystem.auth.dto;

import com.billingsystem.auth.AuthenticatedUser;

public record LoginResponse(String accessToken, String refreshToken, AuthenticatedUser user) {}
