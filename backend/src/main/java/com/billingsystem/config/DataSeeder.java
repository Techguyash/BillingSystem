package com.billingsystem.config;

import com.billingsystem.branch.Branch;
import com.billingsystem.branch.BranchService;
import com.billingsystem.business.Business;
import com.billingsystem.business.BusinessService;
import com.billingsystem.role.Role;
import com.billingsystem.role.RoleService;
import com.billingsystem.user.User;
import com.billingsystem.user.UserService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * First-run setup for a fresh local install. Creates the single Business
 * row, seeds the default Owner/Manager/Cashier roles, and creates an Owner
 * user to log in with — equivalent to the old Node backend's seed.ts script,
 * but runs automatically on startup so there's no extra manual step.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

  private final BusinessService businessService;
  private final BranchService branchService;
  private final RoleService roleService;
  private final UserService userService;
  private final PasswordEncoder passwordEncoder;
  private final SeedProperties seedProperties;

  @Override
  public void run(String... args) {
    if (businessService.findFirst() != null) {
      log.info("Business already exists. Seed skipped.");
      return;
    }

    Business business = new Business();
    business.setName(seedProperties.getBusinessName());
    business.setSettings(
        Map.of(
            "enabledModules",
            List.of(
                "billing",
                "inventory",
                "purchases",
                "customers",
                "suppliers",
                "invoices",
                "reports")));
    business = businessService.create(business);

    Branch branch = new Branch();
    branch.setBusinessId(business.getId());
    branch.setName("Main Branch");
    branch.setDefault(true);
    branchService.create(branch);

    List<Role> roles = roleService.seedDefaultRoles(business.getId());
    Role ownerRole = roles.stream().filter(r -> r.getName().equals("Owner")).findFirst().orElseThrow();

    User owner = new User();
    owner.setBusinessId(business.getId());
    owner.setName("Owner");
    owner.setEmail(seedProperties.getAdminUsername());
    owner.setPasswordHash(passwordEncoder.encode(seedProperties.getAdminPassword()));
    owner.setRole(ownerRole);
    userService.create(owner);

    log.info("Seed complete:");
    log.info("  Business: {} ({})", business.getName(), business.getId());
    log.info(
        "  Owner login: {} / {}",
        seedProperties.getAdminUsername(),
        seedProperties.getAdminPassword());
  }
}
