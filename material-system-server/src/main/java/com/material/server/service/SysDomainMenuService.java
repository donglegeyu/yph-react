package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.SysDomainMenu;

import java.util.List;

public interface SysDomainMenuService extends IService<SysDomainMenu> {

    List<SysDomainMenu> getByDomainId(Long domainId);

    void saveBatch(Long domainId, List<SysDomainMenu> menus);

    void deleteByDomainId(Long domainId);
}
