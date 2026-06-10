package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.Tag;
import com.material.server.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public Result<PageResult<Tag>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String tagName,
            @RequestParam(required = false) String tagCode,
            @RequestParam(required = false) String tagType,
            @RequestParam(required = false) String status) {

        Page<Tag> page = new Page<>(current, size);
        LambdaQueryWrapper<Tag> query = new LambdaQueryWrapper<>();

        if (tagName != null && !tagName.isEmpty()) {
            query.like(Tag::getTagName, tagName);
        }
        if (tagCode != null && !tagCode.isEmpty()) {
            query.like(Tag::getTagCode, tagCode);
        }
        if (tagType != null && !tagType.isEmpty()) {
            query.eq(Tag::getTagType, tagType);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(Tag::getStatus, status);
        }
        query.orderByAsc(Tag::getSortOrder);
        query.orderByDesc(Tag::getCreateTime);

        Page<Tag> result = tagService.page(page, query);
        long total = tagService.count(query);

        PageResult<Tag> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<Tag> detail(@PathVariable Long id) {
        Tag tag = tagService.getById(id);
        return Result.success(tag);
    }

    @PostMapping
    public Result<Long> create(@RequestBody Tag tag) {
        tagService.save(tag);
        return Result.success(tag.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Tag tag) {
        tag.setId(id);
        tagService.updateById(tag);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tagService.removeById(id);
        return Result.success();
    }
}
