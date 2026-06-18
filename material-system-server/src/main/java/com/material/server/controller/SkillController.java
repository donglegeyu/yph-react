package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.Skill;
import com.material.server.service.CertificateImageService;
import com.material.server.entity.CertificateImage;
import com.material.server.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;
    private final CertificateImageService certificateImageService;

    @GetMapping
    public Result<PageResult<Skill>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String skillName,
            @RequestParam(required = false) String secondaryCategory,
            @RequestParam(required = false) String certificateType) {

        Page<Skill> page = new Page<>(current, size);
        LambdaQueryWrapper<Skill> query = new LambdaQueryWrapper<>();

        if (skillName != null && !skillName.isEmpty()) {
            query.like(Skill::getSkillName, skillName);
        }
        if (secondaryCategory != null && !secondaryCategory.isEmpty()) {
            query.eq(Skill::getSecondaryCategory, secondaryCategory);
        }
        if (certificateType != null && !certificateType.isEmpty()) {
            query.eq(Skill::getCertificateType, certificateType);
        }
        query.orderByAsc(Skill::getSortOrder);
        query.orderByDesc(Skill::getCreateTime);

        Page<Skill> result = skillService.page(page, query);
        long total = skillService.count(query);

        List<CertificateImage> certImages = certificateImageService.list();
        java.util.Map<String, String> certImageMap = new java.util.HashMap<>();
        for (CertificateImage ci : certImages) {
            certImageMap.put(ci.getCertificateType(), ci.getExampleImage());
        }
        for (Skill s : result.getRecords()) {
            String shared = certImageMap.get(s.getCertificateType());
            if (shared != null && !shared.isEmpty()) {
                s.setExampleImage(shared);
            }
        }

        PageResult<Skill> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<Skill> detail(@PathVariable Long id) {
        Skill skill = skillService.getById(id);
        return Result.success(skill);
    }

    @PostMapping
    public Result<Long> create(@RequestBody Skill skill) {
        LambdaQueryWrapper<Skill> check = new LambdaQueryWrapper<Skill>()
                .eq(Skill::getSkillName, skill.getSkillName())
                .eq(Skill::getSecondaryCategory, skill.getSecondaryCategory());
        if (skillService.count(check) > 0) {
            return Result.error("该服务技能与二级品类组合已存在");
        }
        skillService.save(skill);
        upsertCertificateImage(skill.getCertificateType(), skill.getExampleImage());
        return Result.success(skill.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Skill skill) {
        skill.setId(id);
        LambdaQueryWrapper<Skill> check = new LambdaQueryWrapper<Skill>()
                .eq(Skill::getSkillName, skill.getSkillName())
                .eq(Skill::getSecondaryCategory, skill.getSecondaryCategory())
                .ne(Skill::getId, id);
        if (skillService.count(check) > 0) {
            return Result.error("该服务技能与二级品类组合已存在");
        }
        skillService.updateById(skill);
        upsertCertificateImage(skill.getCertificateType(), skill.getExampleImage());
        return Result.success();
    }

    private void upsertCertificateImage(String certificateType, String exampleImage) {
        if (certificateType == null || certificateType.isEmpty() || exampleImage == null || exampleImage.isEmpty()) {
            return;
        }
        LambdaQueryWrapper<CertificateImage> query = new LambdaQueryWrapper<CertificateImage>()
                .eq(CertificateImage::getCertificateType, certificateType);
        CertificateImage existing = certificateImageService.getOne(query);
        if (existing != null) {
            existing.setExampleImage(exampleImage);
            certificateImageService.updateById(existing);
        } else {
            CertificateImage record = new CertificateImage();
            record.setCertificateType(certificateType);
            record.setExampleImage(exampleImage);
            certificateImageService.save(record);
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        skillService.removeById(id);
        return Result.success();
    }
}
