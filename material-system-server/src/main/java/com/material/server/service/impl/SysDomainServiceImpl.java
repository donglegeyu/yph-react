package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysUserDomain;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.mapper.SysUserDomainMapper;
import com.material.server.service.SysDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysDomainServiceImpl extends ServiceImpl<SysDomainMapper, SysDomain> implements SysDomainService {

    private final SysUserDomainMapper sysUserDomainMapper;

    @Override
    public IPage<SysDomain> page(Page<SysDomain> page, String domainName, Integer status) {
        LambdaQueryWrapper<SysDomain> query = new LambdaQueryWrapper<>();
        if (domainName != null && !domainName.isEmpty()) {
            query.like(SysDomain::getDomainName, domainName);
        }
        if (status != null) {
            query.eq(SysDomain::getStatus, status);
        }
        query.orderByDesc(SysDomain::getCreateTime);
        return page(page, query);
    }

    @Override
    public SysDomain create(SysDomain domain) {
        save(domain);
        return domain;
    }

    @Override
    public void update(Long id, SysDomain domain) {
        domain.setId(id);
        updateById(domain);
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        SysDomain domain = new SysDomain();
        domain.setId(id);
        domain.setStatus(status);
        updateById(domain);
    }

    @Override
    public List<SysDomain> getByUserId(Long userId) {
        LambdaQueryWrapper<SysUserDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysUserDomain::getUserId, userId);
        List<SysUserDomain> userDomains = sysUserDomainMapper.selectList(query);

        if (userDomains.isEmpty()) {
            return List.of();
        }

        List<Long> domainIds = userDomains.stream()
                .map(SysUserDomain::getDomainId)
                .collect(Collectors.toList());

        return listByIds(domainIds);
    }

    @Override
    public List<SysDomain> getAllEnabled() {
        LambdaQueryWrapper<SysDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysDomain::getStatus, 1);
        return list(query);
    }

    @Override
    public boolean deleteDomain(Long id) {
        SysDomain domain = getById(id);
        if (domain != null && domain.getIsDefault() != null && domain.getIsDefault() == 1) {
            return false;
        }
        return removeById(id);
    }
}
