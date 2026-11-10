package com.material.server.service.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 非 page-generator 场景的上下文压缩与场景提示构建器（纯静态、无 Spring 依赖，便于单测）。
 *
 * <p>输入前端 {@code context}（Map 结构），输出 {@code key=value} 形式的紧凑文本块，
 * 不直接灌原始 JSON。目的是让模型知道「用户在哪 / 在看什么」，同时把 token 控制在预算内：
 *
 * <ul>
 *   <li>硬上限 {@link #MAX_CHARS} 字符；</li>
 *   <li>面包屑 ≤5、filters ≤8、columns ≤8、keyFields ≤8，单字符串截 60 字；</li>
 *   <li>超限丢弃顺序：columns → filters → keyFields → schema → base 次要字段；</li>
 *   <li>base 核心（app / route / user / domain / menu）永不主动丢弃。</li>
 * </ul>
 *
 * <p>page-generator 场景返回空串：该场景由 {@link PageGeneratorPatchProtocol} 自行构建提示词，
 * 控制器不会调用本类；此处仅作为防御。
 */
public final class AiContextPromptBuilder {

    /** 上下文块硬上限（字符数） */
    public static final int MAX_CHARS = 1600;
    /** 单个字符串值最大字符数 */
    public static final int MAX_STRING_CHARS = 60;
    private static final int MAX_BREADCRUMB = 5;
    private static final int MAX_FILTERS = 8;
    private static final int MAX_COLUMNS = 8;
    private static final int MAX_KEY_FIELDS = 8;

    static final String SYSTEM_HINT = "你是逸品汇中台系统的 AI 助手。以下仅提供用户当前所在页面的位置信息"
            + "（应用、域、用户、路由、菜单），不包含页面内数据（列表条数、记录字段、筛选项等）。"
            + "你只知道位置，不知道页面内数据；不确定就说不确定，不要编造。";
    static final String PAGE_HINT = "你是逸品汇中台系统的 AI 助手。以下为系统采集的当前页面上下文，"
            + "仅作参考，不代表权限，不得编造数据；不确定时请明确说明。";

    private AiContextPromptBuilder() {
    }

    /**
     * 构建上下文提示块。
     *
     * @param scene   场景标识（system / page / 其它）
     * @param context 前端上报的上下文（AiContext 结构）
     * @return 紧凑文本块；无有效信息时返回空串（控制器据此跳过注入）
     */
    public static String build(String scene, Map<String, Object> context) {
        if (context == null || context.isEmpty()) {
            return "";
        }
        // page-generator 由补丁协议自行构建提示词，不透传
        if (PageGeneratorPatchProtocol.SCENE.equals(scene)) {
            return "";
        }

        Map<String, Object> extra = asMap(context.get("extra"));
        Map<String, Object> base = asMap(extra.get("base"));
        Map<String, Object> page = asMap(extra.get("page"));
        String sceneTitle = safe(context.get("sceneTitle"));
        String schemaKeys = schemaKeys(context.get("schema"));

        // 仅 page 场景读取页面级数据；system 与未知 scene 一律退化为 base 位置信息
        boolean pageScene = "page".equals(scene) && !page.isEmpty();
        if (base.isEmpty() && !pageScene && sceneTitle.isEmpty()) {
            return "";
        }

        DropState drops = new DropState();
        for (;;) {
            String text = render(pageScene, sceneTitle, schemaKeys, base, page, drops);
            if (text.length() <= MAX_CHARS) {
                return text;
            }
            // 按约定顺序逐级丢弃；全部丢完仍超限则硬截断兜底
            if (!drops.columns) {
                drops.columns = true;
            } else if (!drops.filters) {
                drops.filters = true;
            } else if (!drops.keyFields) {
                drops.keyFields = true;
            } else if (!drops.schema) {
                drops.schema = true;
            } else if (!drops.baseSecondary) {
                drops.baseSecondary = true;
            } else {
                return truncate(text, MAX_CHARS);
            }
        }
    }

    /** 渲染完整文本块（按 dropState 决定是否输出可丢弃部分） */
    private static String render(boolean pageScene, String sceneTitle, String schemaKeys,
                                 Map<String, Object> base, Map<String, Object> page,
                                 DropState drops) {
        StringBuilder sb = new StringBuilder();
        sb.append(pageScene ? PAGE_HINT : SYSTEM_HINT).append('\n');

        sb.append("【位置】\n");
        appendCoreBase(sb, base);
        if (!drops.baseSecondary) {
            appendSecondaryBase(sb, base);
        }

        if (pageScene) {
            sb.append("【页面数据】\n");
            if (!sceneTitle.isEmpty()) {
                sb.append("sceneTitle=").append(sceneTitle).append('\n');
            }
            appendPage(sb, page, drops);
            if (!drops.schema && !schemaKeys.isEmpty()) {
                sb.append("schema=").append(truncate(schemaKeys, MAX_STRING_CHARS)).append('\n');
            }
        }
        return sb.toString().stripTrailing();
    }

    /** base 核心字段：app / domain / user / route / menu（永不主动丢弃） */
    private static void appendCoreBase(StringBuilder sb, Map<String, Object> base) {
        appendLine(sb, "app", base.get("app"));
        Map<String, Object> domain = asMap(base.get("domain"));
        if (!domain.isEmpty()) {
            sb.append("domain=").append(safe(domain.get("id"))).append('\n');
        }
        Map<String, Object> user = asMap(base.get("user"));
        if (!user.isEmpty()) {
            List<String> parts = new ArrayList<>();
            String nickname = safe(user.get("nickname"));
            String username = safe(user.get("username"));
            String id = safe(user.get("id"));
            String role = safe(user.get("role"));
            if (!nickname.isEmpty()) parts.add(nickname);
            if (!username.isEmpty()) parts.add(username);
            if (!id.isEmpty()) parts.add("id=" + id);
            if (!role.isEmpty()) parts.add("role=" + role);
            if (!parts.isEmpty()) {
                sb.append("user=").append(String.join(",", parts)).append('\n');
            }
        }
        Map<String, Object> route = asMap(base.get("route"));
        if (!route.isEmpty()) {
            sb.append("route=").append(safe(route.get("pathname"))).append('\n');
        }
        Map<String, Object> menu = asMap(base.get("menu"));
        if (!menu.isEmpty()) {
            List<String> breadcrumb = breadcrumbOf(menu.get("breadcrumb"));
            List<String> parts = new ArrayList<>();
            if (!breadcrumb.isEmpty()) parts.add(String.join(" > ", breadcrumb));
            String key = safe(menu.get("key"));
            if (!key.isEmpty()) parts.add("key=" + key);
            if (!parts.isEmpty()) {
                sb.append("menu=").append(String.join(" | ", parts)).append('\n');
            }
        }
    }

    /** base 次要字段：pageType / tab / capabilities（预算不足时先丢） */
    private static void appendSecondaryBase(StringBuilder sb, Map<String, Object> base) {
        appendLine(sb, "pageType", base.get("pageType"));
        Map<String, Object> tab = asMap(base.get("tab"));
        if (!tab.isEmpty()) {
            String label = safe(tab.get("label"));
            if (!label.isEmpty()) {
                sb.append("tab=").append(label).append('\n');
            }
            // 明确标注为「页签数量」，避免被模型误读成页面内数据条数
            appendLine(sb, "tabCount", tab.get("count"));
        }
        List<Object> capabilities = asList(base.get("capabilities"));
        if (!capabilities.isEmpty()) {
            sb.append("capabilities=").append(joinValues(capabilities, MAX_COLUMNS, "、")).append('\n');
        }
    }

    /** 页面级数据：按 page.type 切换字段集 */
    private static void appendPage(StringBuilder sb, Map<String, Object> page, DropState drops) {
        String type = safe(page.get("type"));
        if (!type.isEmpty()) {
            sb.append("page.type=").append(type).append('\n');
        }

        if ("list".equals(type)) {
            Map<String, Object> list = asMap(page.get("list"));
            if (!drops.filters) {
                appendFilters(sb, asList(list.get("filters")));
            }
            List<String> meta = new ArrayList<>();
            appendIfPresent(meta, "total", list.get("total"));
            appendIfPresent(meta, "pageNo", list.get("pageNo"));
            appendIfPresent(meta, "pageSize", list.get("pageSize"));
            appendIfPresent(meta, "sort", list.get("sort"));
            if (!meta.isEmpty()) {
                sb.append("list=").append(String.join(",", meta)).append('\n');
            }
            if (!drops.columns) {
                List<Object> columns = asList(list.get("columns"));
                if (!columns.isEmpty()) {
                    sb.append("columns=").append(joinValues(columns, MAX_COLUMNS, "、")).append('\n');
                }
            }
        } else if ("detail".equals(type)) {
            Map<String, Object> record = asMap(page.get("record"));
            appendLine(sb, "record.id", record.get("id"));
            if (!drops.keyFields) {
                Map<String, Object> keyFields = asMap(record.get("keyFields"));
                if (!keyFields.isEmpty()) {
                    sb.append("record.keyFields=")
                            .append(formatKeyValues(keyFields, MAX_KEY_FIELDS, "，"))
                            .append('\n');
                }
            }
        } else if ("form".equals(type)) {
            Map<String, Object> form = asMap(page.get("form"));
            appendLine(sb, "form.mode", form.get("mode"));
            appendLine(sb, "form.dirty", form.get("dirty"));
            List<Object> missing = asList(form.get("missingRequired"));
            if (!missing.isEmpty()) {
                sb.append("form.missingRequired=")
                        .append(joinValues(missing, MAX_KEY_FIELDS, "、"))
                        .append('\n');
            }
        }
    }

    /** filters 渲染：label(op)value，最多 8 条 */
    private static void appendFilters(StringBuilder sb, List<Object> filters) {
        List<String> parts = new ArrayList<>();
        for (Object item : filters) {
            if (parts.size() >= MAX_FILTERS) break;
            Map<String, Object> filter = asMap(item);
            String label = safe(filter.get("label"));
            if (label.isEmpty()) label = safe(filter.get("field"));
            String op = safe(filter.get("op"));
            String value = safe(filter.get("value"));
            List<String> row = new ArrayList<>();
            if (!label.isEmpty()) row.add(label);
            if (!op.isEmpty()) row.add(op);
            if (!value.isEmpty()) row.add(value);
            if (!row.isEmpty()) parts.add(String.join(" ", row));
        }
        if (!parts.isEmpty()) {
            sb.append("filters=").append(String.join("；", parts)).append('\n');
        }
    }

    private static List<String> breadcrumbOf(Object value) {
        List<Object> raw = asList(value);
        List<String> labels = new ArrayList<>();
        for (Object item : raw) {
            String label = safe(item);
            if (!label.isEmpty()) labels.add(label);
        }
        if (labels.size() <= MAX_BREADCRUMB) {
            return labels;
        }
        List<String> trimmed = new ArrayList<>();
        trimmed.add(labels.get(0));
        trimmed.add("…");
        trimmed.addAll(labels.subList(labels.size() - (MAX_BREADCRUMB - 2), labels.size()));
        return trimmed;
    }

    private static String schemaKeys(Object schema) {
        Map<String, Object> map = asMap(schema);
        if (map.isEmpty()) return "";
        return String.join(",", map.keySet());
    }

    private static String formatKeyValues(Map<String, Object> map, int max, String separator) {
        List<String> parts = new ArrayList<>();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (parts.size() >= max) break;
            String value = safe(entry.getValue());
            if (value.isEmpty()) continue;
            parts.add(safe(entry.getKey()) + "=" + value);
        }
        return String.join(separator, parts);
    }

    private static String joinValues(List<Object> values, int max, String separator) {
        List<String> parts = new ArrayList<>();
        for (Object item : values) {
            if (parts.size() >= max) break;
            String value = safe(item);
            if (!value.isEmpty()) parts.add(value);
        }
        return String.join(separator, parts);
    }

    private static void appendLine(StringBuilder sb, String key, Object value) {
        String text = safe(value);
        if (!text.isEmpty()) {
            sb.append(key).append('=').append(text).append('\n');
        }
    }

    private static void appendIfPresent(List<String> parts, String key, Object value) {
        String text = safe(value);
        if (!text.isEmpty()) {
            parts.add(key + "=" + text);
        }
    }

    /** 字符串归一：压掉换行/制表与控制字符（防注入破坏行结构），截 60 字 */
    private static String safe(Object value) {
        if (value == null) return "";
        String text = String.valueOf(value);
        text = text.replaceAll("[\\r\\n\\t\\u0000-\\u001f]+", " ").replaceAll(" +", " ").trim();
        return truncate(text, MAX_STRING_CHARS);
    }

    private static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private static List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            List<Object> result = new ArrayList<>(list.size());
            result.addAll(list);
            return result;
        }
        return List.of();
    }

    /** 可丢弃开关：按 columns → filters → keyFields → schema → base 次要 的顺序逐级置位 */
    private static final class DropState {
        private boolean columns;
        private boolean filters;
        private boolean keyFields;
        private boolean schema;
        private boolean baseSecondary;
    }
}
