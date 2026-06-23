package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.dto.CraftsmanApplicationCreateDTO;
import com.material.server.entity.CraftsmanApplication;
import com.material.server.vo.CraftsmanApplicationVO;

public interface CraftsmanApplicationService extends IService<CraftsmanApplication> {

    CraftsmanApplicationVO createApplication(CraftsmanApplicationCreateDTO dto);

    CraftsmanApplicationVO updateApplication(Long id, CraftsmanApplicationCreateDTO dto);

    void submit(Long id);

    void revoke(Long id);

    void delete(Long id);

    Long approve(Long id);
}
