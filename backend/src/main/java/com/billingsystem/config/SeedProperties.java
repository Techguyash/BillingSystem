package com.billingsystem.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.seed")
@Data
public class SeedProperties {
  private String businessName;
  private String adminUsername;
  private String adminPassword;
}
