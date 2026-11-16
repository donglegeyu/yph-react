package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.client.ApprovalClient;
import com.material.server.common.BusinessException;
import com.material.server.dto.CraftsmanApplicationCreateDTO;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.CraftsmanApplication;
import com.material.server.mapper.CraftsmanApplicationMapper;
import com.material.server.service.CraftsmanApplicationService;
import com.material.server.service.CraftsmanService;
import com.material.server.vo.CraftsmanApplicationVO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CraftsmanApplicationServiceImpl
        extends ServiceImpl<CraftsmanApplicationMapper, CraftsmanApplication>
        implements CraftsmanApplicationService {

    private static final Logger log = LoggerFactory.getLogger(CraftsmanApplicationServiceImpl.class);

    /** 业务场景类型（与审批中心 business_type 约定，流程路由 key = craftsmanApplication） */
    public static final String BUSINESS_TYPE = "craftsman_application";

    private final CraftsmanApplicationMapper craftsmanApplicationMapper;
    private final CraftsmanService craftsmanService;
    private final ApprovalClient approvalClient;
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
        // 先置 pending，再调审批中心代发起；发起失败则整体回滚回原状态
        exist.setStatus("pending");
        exist.setRejectReason(null);
        updateById(exist);

        Long applicantId = exist.getId();
        String applicantName = exist.getApplicant();
        try {
            // form_data 存的是 JSON 字符串，审批中心 formData 期望对象，先反序列化
            Object formData;
            try {
                formData = objectMapper.readValue(exist.getFormData(), Map.class);
            } catch (Exception e) {
                formData = exist.getFormData();
            }
            Map<String, String> startResult = approvalClient.startInstance(BUSINESS_TYPE, exist.getId(),
                    exist.getApplicationNo(), "工匠申请-" + exist.getName() + "-" + exist.getApplicationNo(),
                    formData, applicantId, applicantName);
            if ("passedThrough".equals(startResult.get("result"))) {
                // 免审直通：审批绑定未就绪且为 optional 模式，直接按审批通过落终态
                log.info("工匠申请免审直通 applicationNo={} reason={}", exist.getApplicationNo(), startResult.get("reason"));
                onApprovalFinished(exist.getId(), null, "approved", "免审直通：" + startResult.getOrDefault("reason", ""));
                return;
            }
            exist.setApprovalInstanceId(startResult.get("instanceId"));
            updateById(exist);
        } catch (Exception e) {
            log.error("发起审批失败，回滚申请单状态 applicationNo={}", exist.getApplicationNo(), e);
            // 文案透传：审批侧错误信息已明确到具体层（绑定停用/流程未发布/流程停用）
            throw new BusinessException(e.getMessage());
        }
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
        // 联动审批中心撤回；审批人已处理时会失败并整体回滚
        approvalClient.withdrawInstance(exist.getApprovalInstanceId(), null);
        exist.setStatus("draft");
        exist.setApprovalInstanceId(null);
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
    public void onApprovalFinished(Long id, String instanceId, String status, String comment) {
        CraftsmanApplication exist = getById(id);
        if (exist == null) {
            log.warn("审批回调找不到申请单，忽略 businessId={} instanceId={}", id, instanceId);
            return;
        }
        // 幂等：实例 ID 不匹配或状态已终态时跳过
        if (exist.getApprovalInstanceId() != null && !exist.getApprovalInstanceId().equals(instanceId)) {
            log.warn("审批回调实例 ID 不匹配，忽略 applicationNo={} expected={} actual={}",
                    exist.getApplicationNo(), exist.getApprovalInstanceId(), instanceId);
            return;
        }
        if ("approved".equals(exist.getStatus()) || "rejected".equals(exist.getStatus())) {
            log.info("申请单已终态，跳过重复回调 applicationNo={} status={}", exist.getApplicationNo(), exist.getStatus());
            return;
        }

        switch (status) {
            case "approved" -> {
                CraftsmanCreateDTO form = fromJsonSafe(exist.getFormData());
                if (form == null) {
                    throw new IllegalStateException("表单数据缺失，无法落工匠主表");
                }
                craftsmanService.createCraftsman(form);
                exist.setStatus("approved");
                exist.setRejectReason(null);
            }
            case "rejected" -> {
                exist.setStatus("rejected");
                exist.setRejectReason(comment);
            }
            case "withdrawn" -> {
                exist.setStatus("draft");
                exist.setApprovalInstanceId(null);
            }
            default -> log.warn("未知审批终态，忽略 status={} applicationNo={}", status, exist.getApplicationNo());
        }
        updateById(exist);
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
        vo.setApprovalInstanceId(entity.getApprovalInstanceId());
        vo.setFormData(entity.getFormData());
        vo.setCreateTime(entity.getCreateTime());
        vo.setUpdateTime(entity.getUpdateTime());
        return vo;
    }
}
