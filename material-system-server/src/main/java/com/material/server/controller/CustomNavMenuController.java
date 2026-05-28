package com.material.server.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.common.Result;
import com.material.server.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/custom-nav-menus")
@RequiredArgsConstructor
public class CustomNavMenuController {

    private final UserPreferenceService userPreferenceService;
    private final ObjectMapper objectMapper;

    private static final Long DEFAULT_USER_ID = 1L;
    private static final String CUSTOM_NAV_MENUS_KEY = "customNavMenus";

    @GetMapping
    public Result<List<Object>> getCustomNavMenus() {
        String data = userPreferenceService.getPreference(DEFAULT_USER_ID, CUSTOM_NAV_MENUS_KEY);
        try {
            if (data == null || data.isEmpty()) {
                return Result.success(new ArrayList<>());
            } else {
                List<Object> parsedData = objectMapper.readValue(data, new TypeReference<List<Object>>() {});
                return Result.success(parsedData);
            }
        } catch (Exception e) {
            return Result.success(new ArrayList<>());
        }
    }

    @PutMapping
    public Result<Void> saveCustomNavMenus(@RequestBody CustomNavMenuRequest request) {
        String value = request.getMenus() != null ? request.getMenus().toString() : "[]";
        userPreferenceService.savePreference(DEFAULT_USER_ID, CUSTOM_NAV_MENUS_KEY, value);
        return Result.success();
    }

    public static class CustomNavMenuRequest {
        private Object menus;

        public Object getMenus() {
            return menus;
        }

        public void setMenus(Object menus) {
            this.menus = menus;
        }
    }
}
