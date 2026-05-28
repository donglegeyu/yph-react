package com.material.server.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.SysDomain;

import java.util.List;

public interface SysDomainService extends IService<SysDomain> {

    IPage<SysDomain> page(Page<SysDomain> page, String domainName, Integer status);

    SysDomain create(SysDomain domain);

    void update(Long id, SysDomain domain);

    void updateStatus(Long id, Integer status);

    List<SysDomain> getByUserId(Long userId);

    List<SysDomain> getAllEnabled();

    boolean deleteDomain(Long id);
}
