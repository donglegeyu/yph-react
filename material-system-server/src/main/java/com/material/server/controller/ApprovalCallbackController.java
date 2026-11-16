package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.service.CraftsmanApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 审批中心联动入口（服务间调用 + 审批绑定管理页数据源）。
 *
 * 1. 终态回调：审批实例到达终态（approved/rejected/withdrawn）时由 approval-server 回调，
 *    按 businessType 分发给对应业务处理器；当前仅处理工匠申请（craftsman_application）。
 * 2. 业务类型白名单：审批绑定管理页新增绑定时，下拉展示本服务已注册回调处理器的业务类型。
 */
@RestController
@RequestMapping("/api/internal")
public class ApprovalCallbackController {

    private static final Logger log = LoggerFactory.getLogger(ApprovalCallbackController.class);

    public static final String BUSINESS_TYPE_CRAFTSMAN = "craftsman_application";
    private static final String KEY_HEADER = "X-Callback-Key";

    /** 已注册回调处理器的业务类型清单（新增处理器时同步维护：type → 中文名） */
    private static final Map<String, String> REGISTERED_BUSINESS_TYPES = Map.of(
            BUSINESS_TYPE_CRAFTSMAN, "工匠申请");

    private final CraftsmanApplicationService craftsmanApplicationService;

    @Value("${app.approval.callback-key:internal-callback-key}")
    private String callbackKey;

    public ApprovalCallbackController(CraftsmanApplicationService craftsmanApplicationService) {
        this.craftsmanApplicationService = craftsmanApplicationService;
    }

    /** 已注册业务类型白名单（业务流程配置页新增绑定下拉用）：[{value, label}] */
    @GetMapping("/approval-business-types")
    public Result<List<Map<String, String>>> registeredBusinessTypes() {
        List<Map<String, String>> options = REGISTERED_BUSINESS_TYPES.entrySet().stream()
                .map(entry -> Map.of("value", entry.getKey(), "label", entry.getValue()))
                .toList();
        return Result.success(options);
    }

    @PostMapping("/approval-callback")
    public Result<Void> onApprovalFinished(@RequestHeader(value = KEY_HEADER, required = false) String key,
                                           @RequestBody Map<String, Object> body) {
        if (!callbackKey.equals(key)) {
            return Result.error(401, "无效的回调密钥");
        }
        String businessType = (String) body.get("businessType");
        Long businessId = body.get("businessId") == null ? null : ((Number) body.get("businessId")).longValue();
        String instanceId = (String) body.get("instanceId");
        String status = (String) body.get("status");
        String comment = (String) body.get("comment");

        log.info("收到审批终态回调 businessType={} businessId={} instanceId={} status={}",
                businessType, businessId, instanceId, status);
        if (BUSINESS_TYPE_CRAFTSMAN.equals(businessType)) {
            craftsmanApplicationService.onApprovalFinished(businessId, instanceId, status, comment);
        } else {
            log.warn("未知业务类型的审批回调，忽略 businessType={} instanceId={}", businessType, instanceId);
        }
        return Result.success();
    }
}
