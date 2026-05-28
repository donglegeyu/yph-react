package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.entity.ComponentToken;
import com.material.server.service.ComponentTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/component-tokens")
public class ComponentTokenController {
    
    @Autowired
    private ComponentTokenService componentTokenService;
    
    @GetMapping
    public Result<Map<String, Object>> getAllComponentTokens() {
        try {
            List<ComponentToken> tokens = componentTokenService.list();
            
            Map<String, List<ComponentToken>> groupedTokens = new HashMap<>();
            for (ComponentToken token : tokens) {
                String componentName = token.getComponentName();
                groupedTokens.computeIfAbsent(componentName, k -> new java.util.ArrayList<>()).add(token);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("tokens", tokens);
            data.put("groupedTokens", groupedTokens);
            data.put("components", groupedTokens.keySet());
            
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取组件 Token 列表失败: " + e.getMessage());
        }
    }
    
    @GetMapping("/{componentName}")
    public Result<List<ComponentToken>> getTokensByComponent(@PathVariable String componentName) {
        try {
            List<ComponentToken> tokens = componentTokenService.getTokensByComponent(componentName);
            return Result.success(tokens);
        } catch (Exception e) {
            return Result.error("获取组件 Token 失败: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public Result<String> updateToken(@PathVariable Long id, @RequestBody ComponentToken token) {
        try {
            ComponentToken existingToken = componentTokenService.getById(id);
            if (existingToken == null) {
                return Result.error("Token 不存在");
            }
            
            existingToken.setCurrentLightValue(token.getCurrentLightValue());
            existingToken.setCurrentDarkValue(token.getCurrentDarkValue());
            componentTokenService.updateById(existingToken);
            
            return Result.success("Token 更新成功");
        } catch (Exception e) {
            return Result.error("更新 Token 失败: " + e.getMessage());
        }
    }
    
    @PostMapping("/batch")
    public Result<String> batchUpdateTokens(@RequestBody List<ComponentToken> tokens) {
        try {
            for (ComponentToken token : tokens) {
                if (token.getId() != null) {
                    ComponentToken existing = componentTokenService.getById(token.getId());
                    if (existing != null) {
                        existing.setCurrentLightValue(token.getCurrentLightValue());
                        existing.setCurrentDarkValue(token.getCurrentDarkValue());
                        componentTokenService.updateById(existing);
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
            List<ComponentToken> tokens = componentTokenService.list();
            for (ComponentToken token : tokens) {
                token.setCurrentLightValue(token.getDefaultLightValue());
                token.setCurrentDarkValue(token.getDefaultDarkValue());
            }
            componentTokenService.updateBatchById(tokens);
            return Result.success("重置成功");
        } catch (Exception e) {
            return Result.error("重置失败: " + e.getMessage());
        }
    }
}
