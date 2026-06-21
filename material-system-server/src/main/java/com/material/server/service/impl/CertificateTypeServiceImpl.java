package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.CertificateType;
import com.material.server.mapper.CertificateTypeMapper;
import com.material.server.service.CertificateTypeService;
import org.springframework.stereotype.Service;

@Service
public class CertificateTypeServiceImpl extends ServiceImpl<CertificateTypeMapper, CertificateType> implements CertificateTypeService {
}
