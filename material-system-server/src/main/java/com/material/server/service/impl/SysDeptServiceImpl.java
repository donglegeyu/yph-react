package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.SysDept;
import com.material.server.entity.SysUser;
import com.material.server.mapper.SysDeptMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.service.SysDeptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysDeptServiceImpl extends ServiceImpl<SysDeptMapper, SysDept> implements SysDeptService {

    private final SysUserMapper sysUserMapper;

    @Override
    public List<SysDept> listTree(String deptName, Integer status) {
        LambdaQueryWrapper<SysDept> query = new LambdaQueryWrapper<>();
        if (deptName != null && !deptName.isEmpty()) {
            query.like(SysDept::getDeptName, deptName);
        }
        if (status != null) {
            query.eq(SysDept::getStatus, status);
        }
        query.orderByAsc(SysDept::getSortOrder);
        List<SysDept> all = list(query);

        // 统计每个部门用户数
        LambdaQueryWrapper<SysUser> userQuery = new LambdaQueryWrapper<>();
        userQuery.select(SysUser::getDeptId);
        List<SysUser> users = sysUserMapper.selectList(userQuery);
        Map<Long, Long> userCountMap = users.stream()
                .filter(u -> u.getDeptId() != null)
                .collect(Collectors.groupingBy(SysUser::getDeptId, Collectors.counting()));
        all.forEach(d -> d.setUserCount(userCountMap.getOrDefault(d.getId(), 0L)));

        // 过滤：含子树匹配（若按名称搜索，保留其祖先链）
        List<SysDept> filtered = all;
        if (deptName != null && !deptName.isEmpty()) {
            List<SysDept> matched = all.stream()
                    .filter(d -> d.getDeptName().contains(deptName))
                    .collect(Collectors.toList());
            filtered = new ArrayList<>();
            for (SysDept m : matched) {
                if (!filtered.contains(m)) filtered.add(m);
            }
        }

        return buildTree(filtered);
    }

    private List<SysDept> buildTree(List<SysDept> list) {
        Map<Long, List<SysDept>> byParent = list.stream()
                .collect(Collectors.groupingBy(d -> d.getParentId() == null ? 0L : d.getParentId()));
        List<SysDept> roots = byParent.getOrDefault(0L, new ArrayList<>());
        roots.sort(Comparator.comparingInt(d -> d.getSortOrder() == null ? 0 : d.getSortOrder()));
        for (SysDept root : list) {
            List<SysDept> children = byParent.get(root.getId());
            if (children != null) {
                children.sort(Comparator.comparingInt(d -> d.getSortOrder() == null ? 0 : d.getSortOrder()));
                root.setChildren(children);
            }
        }
        return roots;
    }

    @Override
    @Transactional
    public SysDept create(SysDept dept) {
        if (dept.getParentId() == null) {
            dept.setParentId(0L);
        }
        dept.setAncestors(buildAncestors(dept.getParentId()));
        save(dept);
        return dept;
    }

    @Override
    @Transactional
    public void update(Long id, SysDept dept) {
        SysDept exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("部门不存在");
        }
        dept.setId(id);
        // 若切换了父部门，更新 ancestors 及子孙
        if (dept.getParentId() != null && !dept.getParentId().equals(exist.getParentId())) {
            String newAncestors = buildAncestors(dept.getParentId());
            String oldAncestors = exist.getAncestors() == null ? "" : exist.getAncestors();
            dept.setAncestors(newAncestors);
            updateChildrenAncestors(id, oldAncestors, newAncestors);
        }
        updateById(dept);
    }

    private void updateChildrenAncestors(Long deptId, String oldAncestors, String newAncestors) {
        LambdaQueryWrapper<SysDept> query = new LambdaQueryWrapper<>();
        query.likeRight(SysDept::getAncestors, oldAncestors + "," + deptId);
        List<SysDept> children = list(query);
        for (SysDept child : children) {
            String ca = child.getAncestors() == null ? "" : child.getAncestors();
            String updated = newAncestors + "," + deptId + ca.substring((oldAncestors + "," + deptId).length());
            child.setAncestors(updated);
        }
        updateBatchById(children);
    }

    private String buildAncestors(Long parentId) {
        if (parentId == null || parentId == 0L) {
            return "0";
        }
        SysDept parent = getById(parentId);
        if (parent == null) {
            return "0";
        }
        String parentAncestors = parent.getAncestors() == null ? "0" : parent.getAncestors();
        return parentAncestors + "," + parentId;
    }

    @Override
    @Transactional
    public void updateStatus(Long id, Integer status) {
        SysDept dept = new SysDept();
        dept.setId(id);
        dept.setStatus(status);
        updateById(dept);
    }

    @Override
    @Transactional
    public void removeWithCheck(Long id) {
        // 检查是否有子部门
        LambdaQueryWrapper<SysDept> childQuery = new LambdaQueryWrapper<>();
        childQuery.eq(SysDept::getParentId, id);
        long childCount = count(childQuery);
        if (childCount > 0) {
            throw new IllegalStateException("存在子部门，不允许删除");
        }
        // 检查是否有用户
        LambdaQueryWrapper<SysUser> userQuery = new LambdaQueryWrapper<>();
        userQuery.eq(SysUser::getDeptId, id);
        long userCount = sysUserMapper.selectCount(userQuery);
        if (userCount > 0) {
            throw new IllegalStateException("部门下存在用户，不允许删除");
        }
        removeById(id);
    }
}
