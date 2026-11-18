package com.material.server.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.common.Result;
import com.material.server.entity.MenuView;
import com.material.server.mapper.MenuViewMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 审批中心的筛选视图配置
 * 复用 menu_view 表，通过 pageType 区分业务页面，避免建重复表
 */
@RestController
@RequestMapping("/api/approval-views")
@CrossOrigin
@RequiredArgsConstructor
public class ApprovalViewController {

    private final MenuViewMapper menuViewMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String PAGE_TYPE = "approval-todo";

    @GetMapping
    public Result<List<Map<String, Object>>> list(
            @RequestParam(required = false, defaultValue = "default-user") String userId) {
        List<MenuView> views = menuViewMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<MenuView>()
                        .eq(MenuView::getUserId, userId)
                        .eq(MenuView::getPageType, PAGE_TYPE)
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (MenuView view : views) {
            result.add(toMap(view));
        }
        return Result.success(result);
    }

    @PostMapping
    public Result<String> save(@RequestBody Map<String, Object> request) {
        String userId = request.get("userId") != null ? request.get("userId").toString() : "default-user";

        // 带 id 视为更新（前端「另存为」会产生 Date.now 字符串 id，需走新增）
        if (request.get("id") != null && !request.get("id").toString().isEmpty()) {
            String idStr = request.get("id").toString();
            // 纯数字才尝试按库中主键更新，否则走新增
            if (idStr.chars().allMatch(Character::isDigit)) {
                try {
                    Long id = Long.parseLong(idStr);
                    MenuView existing = menuViewMapper.selectById(id);
                    if (existing != null) {
                        applyFields(existing, request);
                        existing.setUpdateTime(LocalDateTime.now());
                        menuViewMapper.updateById(existing);
                        return Result.success(idStr);
                    }
                } catch (Exception ignored) {
                    // 解析失败继续走新增
                }
            }
        }

        MenuView view = new MenuView();
        view.setName((String) request.get("name"));
        view.setUserId(userId);
        view.setPageType(PAGE_TYPE);
        applyFields(view, request);
        view.setCreateTime(LocalDateTime.now());
        view.setUpdateTime(LocalDateTime.now());
        menuViewMapper.insert(view);
        return Result.success(String.valueOf(view.getId()));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        menuViewMapper.deleteById(id);
        return Result.success();
    }

    private void applyFields(MenuView view, Map<String, Object> request) {
        try {
            if (request.get("filters") != null) {
                view.setFilters(objectMapper.writeValueAsString(request.get("filters")));
            }
            if (request.get("filterOrder") != null) {
                view.setFilterOrder(objectMapper.writeValueAsString(request.get("filterOrder")));
            }
        } catch (Exception ignored) {
            // 序列化失败保留原值
        }
    }

    private Map<String, Object> toMap(MenuView view) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", String.valueOf(view.getId()));
        item.put("name", view.getName());
        item.put("userId", view.getUserId());
        item.put("createdAt", view.getCreateTime() != null ? view.getCreateTime().toString() : "");
        try {
            item.put("filters", view.getFilters() != null && !view.getFilters().isEmpty()
                    ? objectMapper.readValue(view.getFilters(), new TypeReference<Map<String, Object>>() {})
                    : new HashMap<>());
            item.put("filterOrder", view.getFilterOrder() != null && !view.getFilterOrder().isEmpty()
                    ? objectMapper.readValue(view.getFilterOrder(), new TypeReference<List<String>>() {})
                    : new ArrayList<>());
        } catch (Exception e) {
            item.put("filters", new HashMap<>());
            item.put("filterOrder", new ArrayList<>());
        }
        return item;
    }
}
