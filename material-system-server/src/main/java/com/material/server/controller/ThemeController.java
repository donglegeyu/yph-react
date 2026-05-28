package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.entity.ThemeConfig;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/theme")
public class ThemeController {
    
    @Autowired
    private IService<ThemeConfig> themeConfigService;
    
    @GetMapping("/current")
    public Result<String> getCurrentTheme() {
        try {
            QueryWrapper<ThemeConfig> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("is_active", true);
            ThemeConfig activeTheme = themeConfigService.getOne(queryWrapper);
            
            if (activeTheme != null) {
                return Result.success(activeTheme.getThemeName());
            }
            
            return Result.success("light");
        } catch (Exception e) {
            return Result.error("获取当前主题失败: " + e.getMessage());
        }
    }
    
    @PostMapping("/switch")
    public Result<String> switchTheme(@RequestBody java.util.Map<String, String> request) {
        try {
            String themeName = request.get("theme");
            
            if (themeName == null || (!themeName.equals("light") && !themeName.equals("dark"))) {
                return Result.error("无效的主题名称");
            }
            
            QueryWrapper<ThemeConfig> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("theme_name", themeName);
            ThemeConfig targetTheme = themeConfigService.getOne(queryWrapper);
            
            if (targetTheme == null) {
                return Result.error("主题不存在");
            }
            
            queryWrapper.clear();
            queryWrapper.eq("is_active", true);
            ThemeConfig currentActive = themeConfigService.getOne(queryWrapper);
            
            if (currentActive != null) {
                currentActive.setIsActive(false);
                themeConfigService.updateById(currentActive);
            }
            
            targetTheme.setIsActive(true);
            themeConfigService.updateById(targetTheme);
            
            return Result.success("主题切换成功");
        } catch (Exception e) {
            return Result.error("切换主题失败: " + e.getMessage());
        }
    }
    
    @GetMapping("/list")
    public Result<java.util.List<ThemeConfig>> listThemes() {
        try {
            java.util.List<ThemeConfig> themes = themeConfigService.list();
            return Result.success(themes);
        } catch (Exception e) {
            return Result.error("获取主题列表失败: " + e.getMessage());
        }
    }
}
