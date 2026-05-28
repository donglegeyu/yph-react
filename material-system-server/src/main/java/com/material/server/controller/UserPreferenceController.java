package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-preferences")
@RequiredArgsConstructor
public class UserPreferenceController {

    private final UserPreferenceService userPreferenceService;

    private static final Long DEFAULT_USER_ID = 1L;

    @GetMapping
    public Result<String> getPreference(@RequestParam String key) {
        String value = userPreferenceService.getPreference(DEFAULT_USER_ID, key);
        return Result.success(value);
    }

    @PutMapping
    public Result<Void> savePreference(@RequestBody PreferenceRequest request) {
        userPreferenceService.savePreference(DEFAULT_USER_ID, request.getKey(), request.getValue());
        return Result.success();
    }

    public static class PreferenceRequest {
        private String key;
        private String value;

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }
}
