package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.dto.DesignTokenDTO;
import com.material.server.entity.DesignToken;
import com.material.server.entity.DesignTokenCategory;
import com.material.server.service.DesignTokenService;
import com.material.server.service.DesignTokenCategoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/design-tokens")
public class DesignTokenController {
    
    @Autowired
    private DesignTokenService designTokenService;
    
    @Autowired
    private DesignTokenCategoryService designTokenCategoryService;
    
    @GetMapping
    public Result<Map<String, Object>> getAllTokens() {
        try {
            List<DesignToken> tokens = designTokenService.getTokensWithCategory();
            List<DesignTokenCategory> categories = designTokenCategoryService.list();
            
            Map<Long, String> categoryCodeMap = categories.stream()
                .collect(Collectors.toMap(
                    DesignTokenCategory::getId,
                    DesignTokenCategory::getCode
                ));
            
            List<DesignTokenDTO> tokenDTOs = new ArrayList<>();
            for (DesignToken token : tokens) {
                DesignTokenDTO dto = new DesignTokenDTO();
                BeanUtils.copyProperties(token, dto);
                if (token.getCategoryId() != null) {
                    dto.setCategoryCode(categoryCodeMap.get(token.getCategoryId()));
                }
                tokenDTOs.add(dto);
            }
            
            categories.sort((a, b) -> a.getSortOrder().compareTo(b.getSortOrder()));
            
            Map<String, Object> data = new HashMap<>();
            data.put("tokens", tokenDTOs);
            data.put("categories", categories);
            
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取 Token 列表失败: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public Result<DesignToken> getToken(@PathVariable Long id) {
        try {
            DesignToken token = designTokenService.getById(id);
            if (token == null) {
                return Result.error("Token 不存在");
            }
            return Result.success(token);
        } catch (Exception e) {
            return Result.error("获取 Token 失败: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public Result<String> updateToken(@PathVariable Long id, @RequestBody DesignToken token) {
        try {
            DesignToken existingToken = designTokenService.getById(id);
            if (existingToken == null) {
                return Result.error("Token 不存在");
            }
            
            existingToken.setCurrentValue(token.getCurrentValue());
            designTokenService.updateById(existingToken);
            
            return Result.success("Token 更新成功");
        } catch (Exception e) {
            return Result.error("更新 Token 失败: " + e.getMessage());
        }
    }
    
    @PostMapping("/batch")
    public Result<String> batchUpdateTokens(@RequestBody List<DesignToken> tokens) {
        try {
            for (DesignToken token : tokens) {
                if (token.getId() != null) {
                    DesignToken existing = designTokenService.getById(token.getId());
                    if (existing != null) {
                        existing.setCurrentValue(token.getCurrentValue());
                        designTokenService.updateById(existing);
                    }
                }
            }
            return Result.success("批量更新成功");
        } catch (Exception e) {
            return Result.error("批量更新失败: " + e.getMessage());
        }
    }
    
    @PostMapping("/reset")
    public Result<String> resetToDefault() {
        try {
            List<DesignToken> tokens = designTokenService.list();
            for (DesignToken token : tokens) {
                token.setCurrentValue(token.getDefaultValue());
            }
            designTokenService.updateBatchById(tokens);
            return Result.success("重置成功");
        } catch (Exception e) {
            return Result.error("重置失败: " + e.getMessage());
        }
    }
}
