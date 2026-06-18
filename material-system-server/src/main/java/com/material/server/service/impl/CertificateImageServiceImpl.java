package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.CertificateImage;
import com.material.server.mapper.CertificateImageMapper;
import com.material.server.service.CertificateImageService;
import org.springframework.stereotype.Service;

@Service
public class CertificateImageServiceImpl extends ServiceImpl<CertificateImageMapper, CertificateImage>
        implements CertificateImageService {
}
