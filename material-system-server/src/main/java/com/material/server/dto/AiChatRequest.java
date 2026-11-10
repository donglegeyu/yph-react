package com.material.server.dto;

import lombok.Data;

import java.util.Map;

/**
 * AI 对话流式请求体（前端 AiTransport 契约）
 */
@Data
public class AiChatRequest {

    /** 用户消息 */
    private String message;

    /**
     * 场景标识：page-generator 启用页面补丁协议（标记内 JSON → action 帧），
     * 其它值走通用问答（上下文整段注入 system 消息）。
     */
    private String scene;

    /** 页面上下文（page-generator 场景下压缩为键名/类型摘要，其它场景整段注入） */
    private Map<String, Object> context;

    /**
     * 会话 ID（多轮对话）：前端按页签维护，首轮可不传，后端生成后经 done 帧回传。
     * 仅通用问答场景消费；page-generator 补丁分支不读写历史。
     */
    private String conversationId;
}
