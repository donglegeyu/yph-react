package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.MaterialView;
import com.material.server.mapper.MaterialViewMapper;
import com.material.server.service.MaterialViewService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MaterialViewServiceImpl extends ServiceImpl<MaterialViewMapper, MaterialView> implements MaterialViewService {

    @Override
    public List<MaterialView> listByUserIdAndPageType(String userId, String pageType) {
        return list(new LambdaQueryWrapper<MaterialView>()
                .eq(MaterialView::getUserId, userId)
                .eq(MaterialView::getPageType, pageType)
                .orderByDesc(MaterialView::getCreateTime));
    }
}
