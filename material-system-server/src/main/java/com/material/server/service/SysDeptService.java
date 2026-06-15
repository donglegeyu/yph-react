package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.SysDept;

import java.util.List;

public interface SysDeptService extends IService<SysDept> {

    List<SysDept> listTree(String deptName, Integer status);

    SysDept create(SysDept dept);

    void update(Long id, SysDept dept);

    void updateStatus(Long id, Integer status);

    void removeWithCheck(Long id);
}
