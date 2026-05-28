package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.Result;
import com.material.server.entity.ConstructionView;
import com.material.server.service.ConstructionViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/construction-views")
@RequiredArgsConstructor
public class ConstructionViewController {

    private final ConstructionViewService constructionViewService;

    @GetMapping
    public Result<List<ConstructionView>> list() {
        LambdaQueryWrapper<ConstructionView> query = new LambdaQueryWrapper<>();
        query.orderByDesc(ConstructionView::getCreateTime);
        List<ConstructionView> views = constructionViewService.list(query);
        return Result.success(views);
    }

    @PostMapping
    public Result<Long> save(@RequestBody ConstructionView view) {
        constructionViewService.save(view);
        return Result.success(view.getId());
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        constructionViewService.removeById(id);
        return Result.success();
    }
}
