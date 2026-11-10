package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.material.server.dto.AiChatRequest;
import com.material.server.entity.AiModelConfig;
import com.material.server.entity.PageDefinition;
import com.material.server.service.AiModelConfigService;
import com.material.server.service.PageDefinitionService;
import com.material.server.service.ai.AiContextPromptBuilder;
import com.material.server.service.ai.PageGeneratorPatchProtocol;
import com.material.server.service.ai.PagePatchStreamFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

/**
 * AI 智能助手对话代理（SSE 流式）：
 * 前端 AiTransport → 本接口 → 默认模型配置对应的 OpenAI 兼容网关 → 逐帧转发。
 * API Key 只存在于后端数据库，不进入前端。
 *
 * 出帧结构与 company-ui AiStreamEvent 对齐：delta / done / error。
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiModelConfigService aiModelConfigService;
    private final PageDefinitionService pageDefinitionService;
    private final ObjectMapper objectMapper;

    private static final String DEFAULT_SYSTEM_PROMPT = "你是逸品汇中台系统的 AI 智能助手，回答保持简洁、专业，使用中文。";

    private static final ExecutorService EXECUTOR = Executors.newCachedThreadPool(new ThreadFactoryImpl());

    /**
     * 多轮对话历史（仅通用问答场景）：conversationId → 消息列表（user/assistant 交替）。
     * LRU 上限防内存泄漏；page-generator 补丁分支不读写，保持无状态不变。
     */
    private static final Map<String, List<HistoryMsg>> CONVERSATIONS =
            java.util.Collections.synchronizedMap(new LinkedHashMap<>(64, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, List<HistoryMsg>> eldest) {
                    return size() > 300;
                }
            });

    /** 单会话保留的最大消息条数（user/assistant 合计，约 8 轮） */
    private static final int HISTORY_MAX_MESSAGES = 16;
    /** 单条历史消息长度上限（超出截断，防 token 爆炸） */
    private static final int HISTORY_MSG_MAX_CHARS = 2000;

    /** 后台流式转发线程工厂：守护线程，不阻塞 JVM 退出 */
    private static class ThreadFactoryImpl implements java.util.concurrent.ThreadFactory {
        private static final AtomicInteger SEQ = new AtomicInteger(1);

        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "ai-chat-sse-" + SEQ.getAndIncrement());
            t.setDaemon(true);
            return t;
        }
    }

    @PostMapping(value = "/chat/stream")
    public SseEmitter chatStream(@RequestBody AiChatRequest request) {
        // 0 = 不超时（流式对话时长不可预估）
        SseEmitter emitter = new SseEmitter(0L);
        EXECUTOR.execute(() -> doChat(emitter, request));
        return emitter;
    }

    private void doChat(SseEmitter emitter, AiChatRequest request) {
        try {
            AiModelConfig config = aiModelConfigService.getDefaultConfig();
            if (config == null) {
                sendFrame(emitter, errorFrame("NO_CONFIG", "尚未配置 AI 模型，请先在「系统设置 → 模型管理」中添加并设为默认"));
                emitter.complete();
                return;
            }
            if (!StringUtils.hasText(request.getMessage())) {
                sendFrame(emitter, errorFrame("BAD_REQUEST", "消息不能为空"));
                emitter.complete();
                return;
            }

            boolean patchMode = PageGeneratorPatchProtocol.SCENE.equals(request.getScene());
            // 多轮会话：仅通用问答场景启用；补丁分支 conversationId 置空，保持无状态不变
            request.setConversationId(resolveConversationId(request, patchMode));
            StreamState state = new StreamState(patchMode);
            HttpRequest gatewayRequest = buildGatewayRequest(config, request);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();
            // ofLines：逐行读取网关 SSE 流（阻塞消费，随转发线程）
            HttpResponse<Stream<String>> response =
                    client.send(gatewayRequest, HttpResponse.BodyHandlers.ofLines());
            if (response.statusCode() != 200) {
                String detail;
                try (Stream<String> errorBody = response.body()) {
                    detail = errorBody.reduce("", (a, b) -> a + b);
                }
                sendFrame(emitter, errorFrame("GATEWAY_ERROR",
                        "网关返回 " + response.statusCode() + (detail.isEmpty() ? "" : "：" + abbreviate(detail, 300))));
                emitter.complete();
                return;
            }

            // 先发空 delta 保持前端 assistant 消息 content 为空：
            // 引擎 send() 追加空 assistant + streaming=true，需等待网关首 token 到达才填充 content；
            // 空 delta 让 content 仍为 ""，三点动画持续显示直到思考帧/正文首 token 到达
            sendDelta(emitter, state, "");

            try (Stream<String> lines = response.body()) {
                lines.forEach(line -> {
                    try {
                        forwardLine(emitter, line, state, request);
                    } catch (IOException e) {
                        // 客户端断开等 IO 失败：终止整条流（外层统一收尾）
                        throw new java.io.UncheckedIOException(e);
                    }
                });
            }
            // 网关流自然结束但未下发 done（部分兼容实现或 [DONE] 缺失），统一收尾
            if (!state.doneSent) {
                if (state.filter != null) {
                    finishPatch(emitter, state, request);
                } else {
                    rememberTurn(state, request);
                    sendFrame(emitter, doneFrame(request.getConversationId()));
                }
                state.doneSent = true;
            }
            emitter.complete();
        } catch (Exception e) {
            // 连接类异常 message 常为 null，退化为异常类型名，便于排查网关连通性
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            String detail = root.getClass().getSimpleName()
                    + (root.getMessage() == null ? "" : "：" + root.getMessage());
            try {
                sendFrame(emitter, errorFrame("UPSTREAM_ERROR", "AI 服务调用失败" + "（" + detail + "）"));
                emitter.complete();
            } catch (Exception ignore) {
                emitter.completeWithError(e);
            }
        }
    }

    /** 构造 OpenAI 兼容网关请求：POST {base_url}/chat/completions，stream=true */
    private HttpRequest buildGatewayRequest(AiModelConfig config, AiChatRequest request) throws IOException {
        String base = config.getBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String url = base + "/chat/completions";

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", config.getModelName());
        body.put("stream", true);
        if (config.getTemperature() != null) {
            body.put("temperature", config.getTemperature().doubleValue());
        }
        if (config.getMaxTokens() != null) {
            body.put("max_tokens", config.getMaxTokens());
        }

        ArrayNode messages = body.putArray("messages");
        ObjectNode system = messages.addObject();
        system.put("role", "system");
        String basePrompt = StringUtils.hasText(config.getSystemPrompt())
                ? config.getSystemPrompt() : DEFAULT_SYSTEM_PROMPT;
        boolean patchMode = PageGeneratorPatchProtocol.SCENE.equals(request.getScene());
        if (patchMode) {
            JsonNode contextNode = request.getContext() == null
                    ? null : objectMapper.valueToTree(request.getContext());
            system.put("content", basePrompt + "\n\n" + PageGeneratorPatchProtocol.buildSystemPrompt(contextNode));
        } else {
            // 通用问答：无论模型配置的 systemPrompt 是什么都追加语言约束——
            // 思维链语言由模型内部行为决定，只能靠提示词引导（补丁分支保持原样不受影响）
            system.put("content", basePrompt
                    + "\n\n【语言要求】全程使用简体中文：思考过程（思维链）与最终回复都必须使用简体中文，即使上下文中出现英文内容，思考也必须用中文进行。");
        }

        // 通用问答：上下文经压缩为紧凑文本块（硬上限 1600 字），不再整段灌 JSON；
        // page-generator 已在系统提示词内压缩为键名/类型摘要，不重复注入
        if (!patchMode) {
            String contextBlock = AiContextPromptBuilder.build(request.getScene(), request.getContext());
            if (StringUtils.hasText(contextBlock)) {
                ObjectNode ctx = messages.addObject();
                ctx.put("role", "system");
                ctx.put("content", contextBlock);
            }
            // 多轮历史：紧邻当前 user 消息按序插入（user/assistant 交替），超限保留最近轮次
            for (HistoryMsg msg : historyOf(request.getConversationId())) {
                ObjectNode history = messages.addObject();
                history.put("role", msg.role());
                history.put("content", msg.content());
            }
        }

        ObjectNode user = messages.addObject();
        user.put("role", "user");
        user.put("content", request.getMessage());

        return HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(120))
                .header("Authorization", "Bearer " + config.getApiKey())
                .header("Content-Type", "application/json")
                .header("Accept", "text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
    }

    /**
     * 解析网关 SSE 行（data: {...} / data: [DONE]），转发为 AiStreamEvent 帧。
     * 页面生成器场景下，delta 文本会先经过标记过滤器：补丁区间只缓冲不下发。
     * 单帧 JSON 解析失败跳过不中断；客户端断开（sendFrame IOException）向上传播终止整条流。
     */
    private void forwardLine(SseEmitter emitter, String line, StreamState state,
                             AiChatRequest request) throws IOException {
        if (line == null || !line.startsWith("data:")) {
            return;
        }
        String payload = line.substring(5).trim();
        if (payload.isEmpty()) {
            return;
        }
        if ("[DONE]".equals(payload)) {
            if (!state.doneSent) {
                if (state.filter != null) {
                    finishPatch(emitter, state, request);
                } else {
                    rememberTurn(state, request);
                    sendFrame(emitter, doneFrame(request.getConversationId()));
                }
                state.doneSent = true;
            }
            return;
        }
        JsonNode root;
        try {
            root = objectMapper.readTree(payload);
        } catch (IOException e) {
            // 单帧解析失败跳过，不中断整条流
            return;
        }
        // 推理模型思维链：逐段透传为 thinking 帧（前端引擎累积到 message.reasoning，
        // 面板以 CompanyThink 渲染「思考中（实时展开）→ 已完成思考」，与组件库 demo 一致）
        JsonNode reasoning = root.path("choices").path(0).path("delta").path("reasoning_content");
        if (state.filter == null && reasoning.isTextual() && !reasoning.asText().isEmpty()) {
            sendThinking(emitter, reasoning.asText());
        }
        JsonNode content = root.path("choices").path(0).path("delta").path("content");
        if (content.isTextual() && !content.asText().isEmpty()) {
            String text = content.asText();
            if (state.filter != null) {
                text = state.filter.accept(text);
            }
            if (!text.isEmpty()) {
                sendDelta(emitter, state, text);
            }
        }
    }

    /**
     * 页面生成器流结束处理：解析标记内的补丁 → 白名单校验 → 已发布检查 → action 帧 + done。
     * 任何失败都只下发一条可读文本，不推 action 帧。
     */
    private void finishPatch(SseEmitter emitter, StreamState state, AiChatRequest request) throws IOException {
        PagePatchStreamFilter filter = state.filter;
        String tail = filter.finish();
        if (!tail.isEmpty()) {
            sendDelta(emitter, state, tail);
        }
        if (!filter.hasPatch()) {
            if (filter.unclosed() || filter.sawStart()) {
                sendDelta(emitter, state, "补丁内容不完整（标记未闭合），本次未应用。请要求 AI 重新生成。");
            }
            sendFrame(emitter, doneFrame(request.getConversationId()));
            return;
        }

        JsonNode raw;
        try {
            raw = objectMapper.readTree(filter.patchJson());
        } catch (IOException e) {
            sendDelta(emitter, state, "补丁解析失败，本次未应用。请让 AI 以标准 JSON 重新输出。");
            sendFrame(emitter, doneFrame(request.getConversationId()));
            return;
        }

        PageGeneratorPatchProtocol.PatchValidation validation = PageGeneratorPatchProtocol.validate(raw);
        if (!validation.ok()) {
            sendDelta(emitter, state, PageGeneratorPatchProtocol.errorText(validation.errors()));
            sendFrame(emitter, doneFrame(request.getConversationId()));
            return;
        }

        String publishedKey = findPublishedPageKey(request, validation.patch());
        if (publishedKey != null) {
            sendDelta(emitter, state, "页面「" + publishedKey + "」已发布，已发布页面不能由 AI 修改。"
                    + "请先取消发布，或新建草稿后再调整。");
            sendFrame(emitter, doneFrame(request.getConversationId()));
            return;
        }

        sendDelta(emitter, state, "已生成页面草稿补丁，确认后将回填到当前草稿。");
        ObjectNode action = objectMapper.createObjectNode();
        action.put("type", "action");
        action.put("actionType", "backfill");
        action.set("patch", validation.patch());
        action.put("title", PageGeneratorPatchProtocol.buildActionTitle(validation.patch()));
        ArrayNode items = action.putArray("items");
        PageGeneratorPatchProtocol.buildActionItems(validation.patch()).forEach(items::add);
        sendFrame(emitter, action);
        sendFrame(emitter, doneFrame(request.getConversationId()));
    }

    /**
     * 已发布页面拒绝回填：同时检查草稿上下文里的 pageKey 与补丁拟写入的 pageKey。
     */
    private String findPublishedPageKey(AiChatRequest request, JsonNode patch) {
        String contextKey = contextPageKey(request);
        String patchKey = patch == null ? "" : patch.path("pageKey").asText("").trim();
        java.util.Set<String> keys = new java.util.LinkedHashSet<>();
        keys.add(contextKey);
        keys.add(patchKey);
        for (String key : keys) {
            if (key == null || key.isBlank()) {
                continue;
            }
            try {
                PageDefinition existing = pageDefinitionService.getOne(
                        new LambdaQueryWrapper<PageDefinition>()
                                .eq(PageDefinition::getPageKey, key)
                                .last("LIMIT 1"), false);
                if (existing != null && "published".equalsIgnoreCase(existing.getStatus())) {
                    return key;
                }
            } catch (Exception ignored) {
                // 查询异常不阻断对话，仅跳过已发布检查
            }
        }
        return null;
    }

    /** 从 context.values.pageKey 取当前草稿的页面 key */
    private String contextPageKey(AiChatRequest request) {
        if (request.getContext() == null) {
            return "";
        }
        Object values = request.getContext().get("values");
        if (values instanceof java.util.Map<?, ?> map) {
            Object key = map.get("pageKey");
            return key == null ? "" : String.valueOf(key).trim();
        }
        return "";
    }

    /**
     * 解析会话 ID：仅通用问答场景启用；传入 ID 不合法（长度/字符白名单）时生成新 UUID。
     * page-generator 场景返回 null，表示无会话记忆，补丁分支保持无状态不变。
     */
    private String resolveConversationId(AiChatRequest request, boolean patchMode) {
        if (patchMode) {
            return null;
        }
        String id = request.getConversationId();
        if (id != null && id.length() <= 64 && id.matches("[A-Za-z0-9_-]+")) {
            return id;
        }
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** 读取会话历史（最近 HISTORY_MAX_MESSAGES 条的不可变快照），无会话/无记录返回空 */
    private List<HistoryMsg> historyOf(String conversationId) {
        if (conversationId == null) {
            return List.of();
        }
        List<HistoryMsg> all = CONVERSATIONS.get(conversationId);
        if (all == null || all.isEmpty()) {
            return List.of();
        }
        return List.copyOf(all.subList(Math.max(0, all.size() - HISTORY_MAX_MESSAGES), all.size()));
    }

    /**
     * 完整轮次写回会话历史：user 消息 + 助手回复。
     * 仅 done 收尾调用一次（state.remembered 防重）；error/中断不写，保证历史轮次完整。
     */
    private void rememberTurn(StreamState state, AiChatRequest request) {
        String conversationId = request.getConversationId();
        if (conversationId == null || state.remembered) {
            return;
        }
        state.remembered = true;
        String reply = state.reply.toString().trim();
        if (reply.isEmpty()) {
            return; // 无有效回复不落历史，避免出现空 assistant 消息
        }
        List<HistoryMsg> turn = List.of(
                new HistoryMsg("user", abbreviate(request.getMessage(), HISTORY_MSG_MAX_CHARS)),
                new HistoryMsg("assistant", abbreviate(reply, HISTORY_MSG_MAX_CHARS)));
        CONVERSATIONS.compute(conversationId, (k, list) -> {
            List<HistoryMsg> next = list == null ? new ArrayList<>() : list;
            next.addAll(turn);
            int overflow = next.size() - HISTORY_MAX_MESSAGES;
            if (overflow > 0) {
                next.subList(0, overflow).clear();
            }
            return next;
        });
    }

    /** 会话历史单条消息（不可变小记录） */
    private record HistoryMsg(String role, String content) {
    }

    private void sendDelta(SseEmitter emitter, StreamState state, String text) throws IOException {
        state.reply.append(text);
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", "delta");
        frame.put("text", text);
        sendFrame(emitter, frame);
    }

    /** 发送一帧 thinking 事件（推理模型思维链透传；前端引擎累积到 message.reasoning） */
    private void sendThinking(SseEmitter emitter, String text) throws IOException {
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", "thinking");
        frame.put("text", text);
        sendFrame(emitter, frame);
    }

    /** 单轮流状态：过滤器 + done 是否已下发 + 助手回复累积 + 历史是否已写回（防重复收尾） */
    private static final class StreamState {
        private final PagePatchStreamFilter filter;
        private boolean doneSent;
        /** 助手回复累积（delta 文本拼接，done 收尾后写入会话历史） */
        private final StringBuilder reply = new StringBuilder();
        private boolean remembered;

        private StreamState(boolean patchMode) {
            this.filter = patchMode ? new PagePatchStreamFilter() : null;
        }
    }

    private ObjectNode doneFrame(String conversationId) {
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", "done");
        // 会话 ID 随 done 帧回传（page-generator 场景为 null，不携带，行为与旧版一致）
        if (conversationId != null) {
            frame.put("conversationId", conversationId);
        }
        return frame;
    }

    private ObjectNode errorFrame(String code, String message) {
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", "error");
        frame.put("code", code);
        frame.put("message", message);
        return frame;
    }

    /** 发送一帧 AiStreamEvent JSON（SSE data 行） */
    private void sendFrame(SseEmitter emitter, ObjectNode frame) throws IOException {
        emitter.send(SseEmitter.event()
                .data(objectMapper.writeValueAsString(frame), MediaType.APPLICATION_JSON));
    }

    private String abbreviate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
