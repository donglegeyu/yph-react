package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.Result;
import com.material.server.entity.CraftsmanView;
import com.material.server.service.CraftsmanViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 工匠申请的列设置视图
 * 复用 craftsman_view 表，通过独立端点区分业务，避免建重复表
 */
@RestController
@RequestMapping("/api/craftsman-application-views")
@RequiredArgsConstructor
public class CraftsmanApplicationViewController {

    private final CraftsmanViewService craftsmanViewService;

    @GetMapping
    public Result<List<CraftsmanView>> list() {
        LambdaQueryWrapper<CraftsmanView> query = new LambdaQueryWrapper<>();
        query.orderByDesc(CraftsmanView::getCreateTime);
        List<CraftsmanView> views = craftsmanViewService.list(query);
        return Result.success(views);
    }

    @PostMapping
    public Result<Long> save(@RequestBody CraftsmanView view) {
        craftsmanViewService.save(view);
        return Result.success(view.getId());
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        craftsmanViewService.removeById(id);
        return Result.success();
    }
}
