package com.material.server.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.common.Result;
import com.material.server.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-nav-menus")
@RequiredArgsConstructor
public class CustomNavMenuController {

    private final UserPreferenceService userPreferenceService;
    private final ObjectMapper objectMapper;

    private static final Long DEFAULT_USER_ID = 1L;
    private static final Long DEFAULT_DOMAIN_ID = 1L;
    private static final String CUSTOM_NAV_MENUS_PREFIX = "customNavMenus";

    private Long resolveUserId(Long userId) {
        return userId != null ? userId : DEFAULT_USER_ID;
    }

    private Long resolveDomainId(Long domainId) {
        return domainId != null ? domainId : DEFAULT_DOMAIN_ID;
    }

    private String buildKey(Long domainId) {
        return CUSTOM_NAV_MENUS_PREFIX + ":" + domainId;
    }

    @GetMapping
    public Result<List<Object>> getCustomNavMenus(@RequestParam(required = false) Long userId,
                                                  @RequestParam(required = false) Long domainId) {
        Long uid = resolveUserId(userId);
        Long did = resolveDomainId(domainId);
        String data = userPreferenceService.getPreference(uid, buildKey(did));
        try {
            if (data == null || data.isEmpty()) {
                return Result.success(new ArrayList<>());
            } else {
                List<Object> parsedData = objectMapper.readValue(data, new com.fasterxml.jackson.core.type.TypeReference<List<Object>>() {});
                return Result.success(parsedData);
            }
        } catch (Exception e) {
            return Result.success(new ArrayList<>());
        }
    }

    @PutMapping
    public Result<Void> saveCustomNavMenus(@RequestParam(required = false) Long userId,
                                           @RequestParam(required = false) Long domainId,
                                           @RequestBody Map<String, Object> body) {
        Long uid = resolveUserId(userId);
        Long did = resolveDomainId(domainId);
        try {
            Object menus = body.get("menus");
            String json = menus != null ? objectMapper.writeValueAsString(menus) : "[]";
            userPreferenceService.savePreference(uid, buildKey(did), json);
        } catch (Exception e) {
            userPreferenceService.savePreference(uid, buildKey(did), "[]");
        }
        return Result.success();
    }
}
