package com.billingsystem.search;

import com.billingsystem.auth.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

  private final SearchService searchService;

  @GetMapping
  public SearchService.SearchResults search(@RequestParam("q") String query) {
    return searchService.search(CurrentUser.get().getBusinessId(), query);
  }
}
