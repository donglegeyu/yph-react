package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.NavMenu;
import java.util.List;

public interface NavMenuService extends IService<NavMenu> {

    List<NavMenu> getTreeList();

    List<NavMenu> getTreeListByDomainId(Long domainId);

    List<NavMenu> getTreeListByParentId(Long parentId);

    void batchUpdateStatus(List<Long> ids, Integer status);

    void batchDelete(List<Long> ids);

    int calculateLevel(Long parentId);
}
