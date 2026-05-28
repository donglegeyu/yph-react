package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.entity.IconConfigRequest;
import com.material.server.service.IconConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/icons")
public class IconConfigController {

    @Autowired
    private IconConfigService iconConfigService;

    @GetMapping
    public Result<Map<String, Object>> getIconConfig() {
        try {
            Map<String, Object> data = iconConfigService.getIconConfig();
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取图标配置失败: " + e.getMessage());
        }
    }

    @PutMapping
    public Result<Void> saveIconConfig(@RequestBody IconConfigRequest request) {
        try {
            iconConfigService.saveIconConfig(request);
            return Result.success(null);
        } catch (Exception e) {
            return Result.error("保存图标配置失败: " + e.getMessage());
        }
    }
}
