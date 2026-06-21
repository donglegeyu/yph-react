package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.material.server.common.Result;
import com.material.server.entity.CertificateImage;
import com.material.server.entity.CertificateType;
import com.material.server.entity.Skill;
import com.material.server.service.CertificateImageService;
import com.material.server.service.CertificateTypeService;
import com.material.server.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificate-types")
@RequiredArgsConstructor
public class CertificateTypeController {

    private final CertificateTypeService certificateTypeService;
    private final CertificateImageService certificateImageService;
    private final SkillService skillService;

    @GetMapping
    public Result<List<CertificateType>> list() {
        LambdaQueryWrapper<CertificateType> query = new LambdaQueryWrapper<>();
        query.orderByAsc(CertificateType::getSortOrder);
        return Result.success(certificateTypeService.list(query));
    }

    @PostMapping
    public Result<Void> save(@RequestBody CertificateType body) {
        if (body.getName() == null || body.getName().trim().isEmpty()) {
            return Result.error("证件类型名称不能为空");
        }
        LambdaQueryWrapper<CertificateType> check = new LambdaQueryWrapper<CertificateType>()
                .eq(CertificateType::getName, body.getName().trim());
        if (body.getId() != null) {
            check.ne(CertificateType::getId, body.getId());
        }
        if (certificateTypeService.count(check) > 0) {
            return Result.error("该证件类型已存在");
        }

        if (body.getId() != null) {
            CertificateType existing = certificateTypeService.getById(body.getId());
            if (existing == null) {
                return Result.error("证件类型不存在");
            }
            String oldName = existing.getName();
            String newName = body.getName().trim();
            existing.setName(newName);
            if (body.getSortOrder() != null) {
                existing.setSortOrder(body.getSortOrder());
            }
            certificateTypeService.updateById(existing);

            if (!oldName.equals(newName)) {
                LambdaQueryWrapper<CertificateImage> imgQuery = new LambdaQueryWrapper<CertificateImage>()
                        .eq(CertificateImage::getCertificateType, oldName);
                CertificateImage img = certificateImageService.getOne(imgQuery);
                if (img != null) {
                    img.setCertificateType(newName);
                    certificateImageService.updateById(img);
                }
                LambdaUpdateWrapper<Skill> skillUpdate = new LambdaUpdateWrapper<Skill>()
                        .eq(Skill::getCertificateType, oldName)
                        .set(Skill::getCertificateType, newName);
                skillService.update(skillUpdate);
            }
        } else {
            if (body.getSortOrder() == null) {
                body.setSortOrder(0);
            }
            certificateTypeService.save(body);
        }
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        CertificateType existing = certificateTypeService.getById(id);
        if (existing == null) {
            return Result.error("证件类型不存在");
        }
        certificateTypeService.removeById(id);

        LambdaQueryWrapper<CertificateImage> imgQuery = new LambdaQueryWrapper<CertificateImage>()
                .eq(CertificateImage::getCertificateType, existing.getName());
        certificateImageService.remove(imgQuery);
        return Result.success();
    }
}
