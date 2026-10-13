package com.billingsystem.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.jwt")
@Data
public class JwtProperties {
  private String accessSecret;
  private int accessExpiresMinutes;
  private String refreshSecret;
  private int refreshExpiresDays;
}
