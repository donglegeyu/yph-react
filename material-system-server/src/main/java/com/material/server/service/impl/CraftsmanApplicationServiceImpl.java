package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.dto.CraftsmanApplicationCreateDTO;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.CraftsmanApplication;
import com.material.server.mapper.CraftsmanApplicationMapper;
import com.material.server.service.CraftsmanApplicationService;
import com.material.server.service.CraftsmanService;
import com.material.server.vo.CraftsmanApplicationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class CraftsmanApplicationServiceImpl
        extends ServiceImpl<CraftsmanApplicationMapper, CraftsmanApplication>
        implements CraftsmanApplicationService {

    private final CraftsmanApplicationMapper craftsmanApplicationMapper;
    private final CraftsmanService craftsmanService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CraftsmanApplicationVO createApplication(CraftsmanApplicationCreateDTO dto) {
        CraftsmanApplication entity = new CraftsmanApplication();
        entity.setApplicationNo(generateApplicationNo());
        entity.setApplicationType(dto.getApplicationType() == null ? "add" : dto.getApplicationType());
        entity.setStatus("draft");
        entity.setApplicant(dto.getApplicant());

        CraftsmanCreateDTO form = dto.getFormData();
        if (form != null) {
            entity.setName(form.getName());
            entity.setPhone(form.getPhone());
            entity.setUserAccount(form.getUserAccount());
            entity.setServiceProviderName(form.getServiceProviderName());
        }
        entity.setApplyTime(LocalDate.now());
        entity.setFormData(toJsonSafe(form));

        save(entity);
        return toVO(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CraftsmanApplicationVO updateApplication(Long id, CraftsmanApplicationCreateDTO dto) {
        CraftsmanApplication exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("申请单不存在: " + id);
        }
        if (!"draft".equals(exist.getStatus())) {
            throw new IllegalStateException("只有草稿状态的申请单可编辑");
        }

        exist.setApplicationType(dto.getApplicationType() == null ? exist.getApplicationType() : dto.getApplicationType());
        if (dto.getApplicant() != null) exist.setApplicant(dto.getApplicant());

        CraftsmanCreateDTO form = dto.getFormData();
        if (form != null) {
            exist.setName(form.getName());
            exist.setPhone(form.getPhone());
            exist.setUserAccount(form.getUserAccount());
            exist.setServiceProviderName(form.getServiceProviderName());
            exist.setFormData(toJsonSafe(form));
        }
        updateById(exist);
        return toVO(exist);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submit(Long id) {
        CraftsmanApplication exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("申请单不存在: " + id);
        }
        if (!"draft".equals(exist.getStatus()) && !"rejected".equals(exist.getStatus())) {
            throw new IllegalStateException("当前状态不允许提交审批");
        }
        exist.setStatus("pending");
        exist.setRejectReason(null);
        updateById(exist);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revoke(Long id) {
        CraftsmanApplication exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("申请单不存在: " + id);
        }
        if (!"pending".equals(exist.getStatus())) {
            throw new IllegalStateException("只有审批中状态可撤回");
        }
        exist.setStatus("draft");
        updateById(exist);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        CraftsmanApplication exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("申请单不存在: " + id);
        }
        if (!"draft".equals(exist.getStatus())) {
            throw new IllegalStateException("只有草稿状态的申请单可删除");
        }
        removeById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long approve(Long id) {
        CraftsmanApplication exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("申请单不存在: " + id);
        }
        if (!"pending".equals(exist.getStatus())) {
            throw new IllegalStateException("只有审批中状态可通过");
        }

        CraftsmanCreateDTO form = fromJsonSafe(exist.getFormData());
        if (form == null) {
            throw new IllegalStateException("表单数据缺失");
        }

        Long craftsmanId = craftsmanService.createCraftsman(form);

        exist.setStatus("approved");
        updateById(exist);

        return craftsmanId;
    }

    private String generateApplicationNo() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        LambdaQueryWrapper<CraftsmanApplication> query = new LambdaQueryWrapper<>();
        query.likeRight(CraftsmanApplication::getApplicationNo, "WA" + date)
             .orderByDesc(CraftsmanApplication::getApplicationNo)
             .last("LIMIT 1");
        CraftsmanApplication latest = getOne(query);
        long num = 1;
        if (latest != null && latest.getApplicationNo() != null) {
            try {
                String tail = latest.getApplicationNo().substring("WA".length() + date.length());
                num = Long.parseLong(tail) + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        return String.format("WA%s%04d", date, num);
    }

    private String toJsonSafe(CraftsmanCreateDTO dto) {
        if (dto == null) return null;
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception e) {
            return null;
        }
    }

    private CraftsmanCreateDTO fromJsonSafe(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            return objectMapper.readValue(json, CraftsmanCreateDTO.class);
        } catch (Exception e) {
            return null;
        }
    }

    private CraftsmanApplicationVO toVO(CraftsmanApplication entity) {
        CraftsmanApplicationVO vo = new CraftsmanApplicationVO();
        vo.setId(entity.getId());
        vo.setApplicationNo(entity.getApplicationNo());
        vo.setApplicationType(entity.getApplicationType());
        vo.setStatus(entity.getStatus());
        vo.setName(entity.getName());
        vo.setPhone(entity.getPhone());
        vo.setUserAccount(entity.getUserAccount());
        vo.setServiceProviderName(entity.getServiceProviderName());
        vo.setApplicant(entity.getApplicant());
        vo.setApplyTime(entity.getApplyTime());
        vo.setRejectReason(entity.getRejectReason());
        vo.setFormData(entity.getFormData());
        vo.setCreateTime(entity.getCreateTime());
        vo.setUpdateTime(entity.getUpdateTime());
        return vo;
    }
}
