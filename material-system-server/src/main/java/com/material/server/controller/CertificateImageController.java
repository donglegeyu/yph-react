package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.Result;
import com.material.server.entity.CertificateImage;
import com.material.server.service.CertificateImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificate-images")
@RequiredArgsConstructor
public class CertificateImageController {

    private final CertificateImageService certificateImageService;

    @GetMapping
    public Result<List<CertificateImage>> list(
            @RequestParam(required = false) String certificateType) {
        LambdaQueryWrapper<CertificateImage> query = new LambdaQueryWrapper<>();
        if (certificateType != null && !certificateType.isEmpty()) {
            query.eq(CertificateImage::getCertificateType, certificateType);
        }
        query.orderByAsc(CertificateImage::getSortOrder);
        return Result.success(certificateImageService.list(query));
    }

    @GetMapping("/by-type")
    public Result<CertificateImage> getByType(@RequestParam String certificateType) {
        LambdaQueryWrapper<CertificateImage> query = new LambdaQueryWrapper<CertificateImage>()
                .eq(CertificateImage::getCertificateType, certificateType)
                .last("LIMIT 1");
        CertificateImage record = certificateImageService.getOne(query);
        return Result.success(record);
    }

    @PostMapping
    public Result<Void> save(@RequestBody CertificateImage body) {
        LambdaQueryWrapper<CertificateImage> check = new LambdaQueryWrapper<CertificateImage>()
                .eq(CertificateImage::getCertificateType, body.getCertificateType());
        CertificateImage existing = certificateImageService.getOne(check);
        if (existing != null) {
            existing.setExampleImage(body.getExampleImage());
            certificateImageService.updateById(existing);
        } else {
            certificateImageService.save(body);
        }
        return Result.success();
    }
}
