package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.Craftsman;
import com.material.server.service.CraftsmanService;
import com.material.server.vo.CraftsmanEditVO;
import com.material.server.vo.CraftsmanListVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/craftsmen")
@RequiredArgsConstructor
public class CraftsmanController {

    private final CraftsmanService craftsmanService;

    @PostMapping
    public Result<Long> create(@RequestBody CraftsmanCreateDTO dto) {
        Long id = craftsmanService.createCraftsman(dto);
        return Result.success(id);
    }

    @GetMapping
    public Result<PageResult<CraftsmanListVO>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String craftsmanCode,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String userAccount,
            @RequestParam(required = false) String serviceProviderName,
            @RequestParam(required = false) String craftsmanCategory,
            @RequestParam(required = false) Integer craftsmanType,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Integer status) {

        Page<Craftsman> page = new Page<>(current, size);
        LambdaQueryWrapper<Craftsman> query = new LambdaQueryWrapper<>();
        if (craftsmanCode != null && !craftsmanCode.isEmpty()) {
            query.like(Craftsman::getCraftsmanCode, craftsmanCode);
        }
        if (name != null && !name.isEmpty()) {
            query.like(Craftsman::getName, name);
        }
        if (phone != null && !phone.isEmpty()) {
            query.like(Craftsman::getPhone, phone);
        }
        if (userAccount != null && !userAccount.isEmpty()) {
            query.like(Craftsman::getUserAccount, userAccount);
        }
        if (serviceProviderName != null && !serviceProviderName.isEmpty()) {
            query.like(Craftsman::getServiceProviderName, serviceProviderName);
        }
        if (craftsmanCategory != null && !craftsmanCategory.isEmpty()) {
            query.eq(Craftsman::getCraftsmanCategory, craftsmanCategory);
        }
        if (craftsmanType != null) {
            query.eq(Craftsman::getCraftsmanType, craftsmanType);
        }
        if (region != null && !region.isEmpty()) {
            query.like(Craftsman::getRegion, region);
        }
        if (status != null) {
            query.eq(Craftsman::getStatus, status);
        }
        query.orderByDesc(Craftsman::getCreateTime);

        Page<Craftsman> result = craftsmanService.page(page, query);
        long total = craftsmanService.count(query);

        // 批量补齐技能名和证书示例图（来自 craftsman_skill 中间表 + skill 表）
        List<CraftsmanListVO> records = craftsmanService.toListVO(result.getRecords());

        PageResult<CraftsmanListVO> pageResult = PageResult.of(
                records, total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<CraftsmanListVO> detail(@PathVariable Long id) {
        Craftsman craftsman = craftsmanService.getById(id);
        if (craftsman == null) {
            return Result.success(null);
        }
        List<CraftsmanListVO> list = craftsmanService.toListVO(Collections.singletonList(craftsman));
        return Result.success(list.isEmpty() ? null : list.get(0));
    }

    @GetMapping("/{id}/edit")
    public Result<CraftsmanEditVO> editDetail(@PathVariable Long id) {
        CraftsmanEditVO vo = craftsmanService.getEditDetail(id);
        return Result.success(vo);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody CraftsmanCreateDTO dto) {
        craftsmanService.updateCraftsman(id, dto);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Craftsman request) {
        Craftsman craftsman = new Craftsman();
        craftsman.setId(id);
        craftsman.setStatus(request.getStatus());
        craftsmanService.updateById(craftsman);
        return Result.success();
    }
}
