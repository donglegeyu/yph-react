package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.Craftsman;

public interface CraftsmanService extends IService<Craftsman> {

    Long createCraftsman(CraftsmanCreateDTO dto);
}
