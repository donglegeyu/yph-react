package com.material.approval.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 审批终态回调业务服务。
 *
 * 回调地址：{业务服务}/api/internal/approval-callback，密钥头 X-Callback-Key 双方约定。
 * 回调失败仅记录日志，不阻断审批主流程（业务侧可通过 link 表状态对账补偿）。
 */
@Component
public class BusinessCallbackClient {

    private static final Logger log = LoggerFactory.getLogger(BusinessCallbackClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.callback.url:http://localhost:8081}")
    private String baseUrl;

    @Value("${app.callback.key:internal-callback-key}")
    private String callbackKey;

    /**
     * @param status 终态：approved / rejected / withdrawn
     */
    public void onFinished(String instanceId, String businessType, Long businessId, String businessNo,
                           String status, String comment, String operatorName) {
        if (businessType == null || businessId == null) {
            log.warn("审批回调缺少业务标识，跳过回调 instanceId={} businessType={} businessId={}",
                    instanceId, businessType, businessId);
            return;
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("instanceId", instanceId);
            body.put("businessType", businessType);
            body.put("businessId", businessId);
            body.put("businessNo", businessNo);
            body.put("status", status);
            body.put("comment", comment);
            body.put("operatorName", operatorName);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Callback-Key", callbackKey);
            restTemplate.postForObject(baseUrl + "/api/internal/approval-callback",
                    new HttpEntity<>(body, headers), String.class);
            log.info("审批终态回调成功 instanceId={} businessType={} businessId={} status={}",
                    instanceId, businessType, businessId, status);
        } catch (Exception e) {
            log.error("审批终态回调失败 instanceId={} businessType={} businessId={} status={}",
                    instanceId, businessType, businessId, status, e);
        }
    }
}
