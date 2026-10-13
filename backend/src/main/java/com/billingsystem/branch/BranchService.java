package com.billingsystem.branch;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BranchService {

  private final BranchRepository branchRepository;

  public List<Branch> findByBusiness(UUID businessId) {
    return branchRepository.findByBusinessId(businessId);
  }

  public Branch create(Branch branch) {
    return branchRepository.save(branch);
  }

  /** Returns the default branch for a business, falling back to the first one found. */
  public Branch resolveDefault(UUID businessId) {
    List<Branch> branches = findByBusiness(businessId);
    return branches.stream()
        .filter(Branch::isDefault)
        .findFirst()
        .orElseGet(
            () ->
                branches.stream()
                    .findFirst()
                    .orElseThrow(
                        () ->
                            new IllegalStateException(
                                "No branch configured for this business")));
  }
}
