package com.material.server.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 审批中心（approval-server，独立服务）内部接口客户端。
 *
 * 接口：POST /internal/instances（代发起）、POST /internal/instances/{id}/withdraw（代撤回）。
 * 鉴权：请求头 X-Callback-Key，与审批侧 app.callback.key 配置一致。
 *
 * 代发起三态响应（data.result）：
 * - started：正常走审批，data.instanceId 为审批实例 ID；
 * - passedThrough：审批绑定未就绪且为免审模式，提交即通过，data.reason 为直通原因。
 */
@Component
public class ApprovalClient {

    private static final Logger log = LoggerFactory.getLogger(ApprovalClient.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.approval.base-url:http://localhost:8082}")
    private String baseUrl;

    @Value("${app.approval.callback-key:internal-callback-key}")
    private String callbackKey;

    /**
     * 代业务单据发起审批（三态）。
     *
     * @return data 原样 Map：result=started 时含 instanceId/businessNo/processKey；
     *         result=passedThrough 时含 reason。错误（必审未就绪等）直接抛 IllegalStateException。
     */
    public Map<String, String> startInstance(String businessType, Long businessId, String businessNo, String title,
                                             Object formData, Long applicantId, String applicantName) {
        Map<String, Object> body = new HashMap<>();
        body.put("businessType", businessType);
        body.put("businessId", businessId);
        body.put("businessNo", businessNo);
        body.put("title", title);
        body.put("formData", formData);
        body.put("applicantId", applicantId);
        body.put("applicantName", applicantName);

        Map<?, ?> result = postForMap("/internal/instances", body);
        Map<String, String> data = new HashMap<>();
        for (Map.Entry<?, ?> entry : result.entrySet()) {
            if (entry.getValue() != null) {
                data.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
            }
        }
        String state = data.getOrDefault("result", "started");
        if ("passedThrough".equals(state)) {
            log.info("审批中心返回免审直通 businessType={} reason={}", businessType, data.get("reason"));
        }
        return data;
    }

    /** 代业务单据撤回审批（审批人已处理时会失败）。 */
    public void withdrawInstance(String instanceId, String comment) {
        Map<String, Object> body = new HashMap<>();
        body.put("comment", comment);
        postForMap("/internal/instances/" + instanceId + "/withdraw", body);
    }

    private Map<?, ?> postForMap(String path, Object body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Callback-Key", callbackKey);
            ResponseEntity<String> resp = restTemplate.postForEntity(baseUrl + path,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers), String.class);
            String raw = resp.getBody();
            // 响应格式 {code, message, data}
            Map<?, ?> wrapper = objectMapper.readValue(raw, Map.class);
            if (wrapper != null && Integer.valueOf(200).equals(((Number) wrapper.get("code")).intValue())) {
                Object data = wrapper.get("data");
                return data instanceof Map ? (Map<?, ?>) data : Map.of();
            }
            throw new IllegalStateException(String.valueOf(wrapper.get("message")));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("审批中心响应解析失败", e);
        }
    }
}
