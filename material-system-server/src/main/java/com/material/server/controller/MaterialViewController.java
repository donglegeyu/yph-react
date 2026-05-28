package com.material.server.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.common.Result;
import com.material.server.entity.MaterialView;
import com.material.server.mapper.MaterialViewMapper;
import com.material.server.service.MaterialViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/material-views")
@CrossOrigin
@RequiredArgsConstructor
public class MaterialViewController {

    @Autowired
    private MaterialViewMapper materialViewMapper;

    private final MaterialViewService materialViewService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String DEFAULT_USER_ID = "user-001";

    @GetMapping
    public Result<List<Map<String, Object>>> list(
            @RequestParam(required = false, defaultValue = DEFAULT_USER_ID) String userId,
            @RequestParam(required = false, defaultValue = "material-list") String pageType) {
        List<MaterialView> views = materialViewService.listByUserIdAndPageType(userId, pageType);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (MaterialView view : views) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", String.valueOf(view.getId()));
            item.put("name", view.getName());
            item.put("userId", view.getUserId());
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
        if (request.get("id") != null && !request.get("id").toString().isEmpty()) {
            try {
                String idStr = request.get("id").toString();
                Long id = Long.parseLong(idStr);
                MaterialView existing = materialViewMapper.selectById(id);
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
                        // ignore
                    }
                    materialViewMapper.updateById(existing);
                    return Result.success(idStr);
                }
            } catch (Exception e) {
                // id格式错误或解析失败，继续执行新增
            }
        }
        
        MaterialView view = new MaterialView();
        view.setName((String) request.get("name"));
        view.setUserId(DEFAULT_USER_ID);
        view.setPageType("material-list");
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
        
        materialViewMapper.insert(view);
        return Result.success(String.valueOf(view.getId()));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        MaterialView view = new MaterialView();
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
            // ignore
        }
        
        materialViewMapper.updateById(view);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        materialViewMapper.deleteById(id);
        return Result.success();
    }
}
