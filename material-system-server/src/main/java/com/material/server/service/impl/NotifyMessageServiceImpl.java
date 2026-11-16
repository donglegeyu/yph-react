package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.NotifyMessage;
import com.material.server.entity.NotifyMessageTemplate;
import com.material.server.mapper.NotifyMessageMapper;
import com.material.server.service.NotifyMessageService;
import com.material.server.service.NotifyMessageTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotifyMessageServiceImpl extends ServiceImpl<NotifyMessageMapper, NotifyMessage>
        implements NotifyMessageService {

    private final NotifyMessageTemplateService templateService;

    @Override
    public int sendByTemplate(String templateCode, List<Long> userIds, Map<String, Object> params, Long domainId) {
        if (templateCode == null || templateCode.isEmpty()) {
            throw new IllegalArgumentException("模板编码不能为空");
        }
        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("收件人不能为空");
        }
        NotifyMessageTemplate template = templateService.lambdaQuery()
                .eq(NotifyMessageTemplate::getCode, templateCode)
                .eq(NotifyMessageTemplate::getStatus, 1)
                .one();
        if (template == null) {
            throw new IllegalArgumentException("模板不存在或已停用: " + templateCode);
        }

        Map<String, Object> safeParams = params == null ? Collections.emptyMap() : params;
        Object titleParam = safeParams.get("title");
        String title = titleParam != null ? String.valueOf(titleParam) : template.getName();
        String content = render(template.getContent(), safeParams);

        LocalDateTime now = LocalDateTime.now();
        List<NotifyMessage> messages = userIds.stream().distinct().map(uid -> {
            NotifyMessage m = new NotifyMessage();
            m.setUserId(uid);
            m.setDomainId(domainId);
            m.setTemplateId(template.getId());
            m.setTemplateCode(template.getCode());
            m.setTitle(title);
            m.setContent(content);
            m.setType(template.getType());
            m.setReadStatus(0);
            m.setCreateTime(now);
            m.setUpdateTime(now);
            return m;
        }).collect(Collectors.toList());
        saveBatch(messages);
        return messages.size();
    }

    /** 将模板中的 {paramName} 占位符替换为参数值 */
    private String render(String template, Map<String, Object> params) {
        if (template == null) {
            return "";
        }
        String result = template;
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            if (entry.getValue() != null) {
                result = result.replace("{" + entry.getKey() + "}", String.valueOf(entry.getValue()));
            }
        }
        return result;
    }
}
