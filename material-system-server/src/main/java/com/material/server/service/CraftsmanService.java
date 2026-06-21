package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.Craftsman;
import com.material.server.vo.CraftsmanEditVO;
import com.material.server.vo.CraftsmanListVO;

import java.util.List;

public interface CraftsmanService extends IService<Craftsman> {

    Long createCraftsman(CraftsmanCreateDTO dto);

    void updateCraftsman(Long id, CraftsmanCreateDTO dto);

    CraftsmanEditVO getEditDetail(Long id);

    /**
     * 将主表工匠记录批量装配为列表 VO，补齐技能名和证书示例图。
     *
     * @param craftsmen 当前页的工匠记录
     * @return 列表 VO（顺序与入参一致）
     */
    List<CraftsmanListVO> toListVO(List<Craftsman> craftsmen);
}
