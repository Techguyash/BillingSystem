package com.billingsystem.customfield;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.customfield.dto.FieldDefinitionRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/field-definitions")
@RequiredArgsConstructor
public class FieldDefinitionController {

  private final FieldDefinitionService fieldDefinitionService;

  // Readable by anyone who can view/manage the relevant records — forms
  // need these to render, not just the settings screen.
  @GetMapping
  public List<FieldDefinition> findAll(@RequestParam(required = false) String entityType) {
    return fieldDefinitionService.findAll(CurrentUser.get().getBusinessId(), entityType);
  }

  @PreAuthorize("hasAuthority('settings.manage')")
  @PostMapping
  public FieldDefinition create(@Valid @RequestBody FieldDefinitionRequest dto) {
    return fieldDefinitionService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PreAuthorize("hasAuthority('settings.manage')")
  @PatchMapping("/{id}")
  public FieldDefinition update(@PathVariable UUID id, @Valid @RequestBody FieldDefinitionRequest dto) {
    return fieldDefinitionService.update(CurrentUser.get().getBusinessId(), id, dto);
  }

  @PreAuthorize("hasAuthority('settings.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    fieldDefinitionService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
