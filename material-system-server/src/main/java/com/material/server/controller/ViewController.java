package com.material.server.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.common.Result;
import com.material.server.entity.MenuView;
import com.material.server.mapper.MenuViewMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/views")
@CrossOrigin
@RequiredArgsConstructor
public class ViewController {

    @Autowired
    private MenuViewMapper menuViewMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public Result<List<Map<String, Object>>> list(
            @RequestParam(required = false, defaultValue = "default-user") String userId,
            @RequestParam(required = false, defaultValue = "default") String pageType) {
        List<MenuView> views = menuViewMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<MenuView>()
                        .eq(MenuView::getUserId, userId)
                        .eq(MenuView::getPageType, pageType)
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (MenuView view : views) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", String.valueOf(view.getId()));
            item.put("name", view.getName());
            item.put("userId", view.getUserId());
            item.put("pageType", view.getPageType());
            item.put("createdAt", view.getCreateTime() != null ? view.getCreateTime().toString() : "");

            try {
                if (view.getFilters() != null && !view.getFilters().isEmpty()) {
                    item.put("filters", objectMapper.readValue(view.getFilters(), new TypeReference<Map<String, Object>>() {}));
                } else {
                    item.put("filters", new HashMap<>());
                }
                if (view.getFilterOrder() != null && !view.getFilterOrder().isEmpty()) {
                    item.put("filterOrder", objectMapper.readValue(view.getFilterOrder(), new TypeReference<List<String>>() {}));
                } else {
                    item.put("filterOrder", new ArrayList<>());
                }
            } catch (Exception e) {
                item.put("filters", new HashMap<>());
                item.put("filterOrder", new ArrayList<>());
            }
            result.add(item);
        }

        return Result.success(result);
    }

    @PostMapping
    public Result<String> create(@RequestBody Map<String, Object> request) {
        String effectiveUserId = request.get("userId") != null ? request.get("userId").toString() : "default-user";
        String effectivePageType = request.get("pageType") != null ? request.get("pageType").toString() : "default";

        if (request.get("id") != null && !request.get("id").toString().isEmpty()) {
            try {
                String idStr = request.get("id").toString();
                Long id = Long.parseLong(idStr);
                MenuView existing = menuViewMapper.selectById(id);
                if (existing != null) {
                    existing.setName((String) request.get("name"));
                    existing.setUpdateTime(LocalDateTime.now());
                    try {
                        if (request.get("filters") != null) {
                            existing.setFilters(objectMapper.writeValueAsString(request.get("filters")));
                        }
                        if (request.get("filterOrder") != null) {
                            existing.setFilterOrder(objectMapper.writeValueAsString(request.get("filterOrder")));
                        }
                    } catch (Exception e) {
                    }
                    menuViewMapper.updateById(existing);
                    return Result.success(idStr);
                }
            } catch (Exception e) {
            }
        }

        MenuView view = new MenuView();
        view.setName((String) request.get("name"));
        view.setUserId(effectiveUserId);
        view.setPageType(effectivePageType);
        view.setCreateTime(LocalDateTime.now());
        view.setUpdateTime(LocalDateTime.now());

        try {
            if (request.get("filters") != null) {
                view.setFilters(objectMapper.writeValueAsString(request.get("filters")));
            }
            if (request.get("filterOrder") != null) {
                view.setFilterOrder(objectMapper.writeValueAsString(request.get("filterOrder")));
            }
        } catch (Exception e) {
            view.setFilters("{}");
            view.setFilterOrder("[]");
        }

        menuViewMapper.insert(view);
        return Result.success(String.valueOf(view.getId()));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        MenuView view = new MenuView();
        view.setId(id);
        view.setUpdateTime(LocalDateTime.now());

        if (request.get("name") != null) {
            view.setName((String) request.get("name"));
        }

        try {
            if (request.get("filters") != null) {
                view.setFilters(objectMapper.writeValueAsString(request.get("filters")));
            }
            if (request.get("filterOrder") != null) {
                view.setFilterOrder(objectMapper.writeValueAsString(request.get("filterOrder")));
            }
        } catch (Exception e) {
        }

        menuViewMapper.updateById(view);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        menuViewMapper.deleteById(id);
        return Result.success();
    }
}
