package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.MaterialView;

import java.util.List;

public interface MaterialViewService extends IService<MaterialView> {
    List<MaterialView> listByUserIdAndPageType(String userId, String pageType);
}
