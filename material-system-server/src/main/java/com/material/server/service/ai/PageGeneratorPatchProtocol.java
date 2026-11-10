package com.material.server.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 页面生成器补丁协议（不依赖网关 tool calling）。
 *
 * <p>模型在有回填意图时，把补丁 JSON 放在固定标记内：
 * <pre>
 * &lt;!--page_patch--&gt;
 * {"pageName":"...","fields":[...]}
 * &lt;!--/page_patch--&gt;
 * </pre>
 * 本类负责：生成系统提示词（含草稿摘要）、白名单校验并生成干净的补丁、
 * 生成 action 帧所需的 title/items。纯静态方法，便于单元测试。
 */
public final class PageGeneratorPatchProtocol {

    public static final String SCENE = "page-generator";
    public static final String START_MARKER = "<!--page_patch-->";
    public static final String END_MARKER = "<!--/page_patch-->";

    /** 顶层白名单 */
    private static final Set<String> TOP_LEVEL_KEYS = Set.of(
            "pageName", "pageKey", "templateType", "tableName", "apiPrefix",
            "generateMenu", "menuLinkMode", "parentMenuId", "bindMenuId",
            "sourceListPageKey", "fields");

    /** fields 元素白名单（FieldConfig 中允许 AI 写入的子集） */
    private static final Set<String> FIELD_KEYS = Set.of(
            "fieldLabel", "fieldKey", "fieldType", "width", "fixed",
            "isFilter", "sortable", "isRequired",
            "dbColumn", "dbType", "dbLength", "options");

    private static final Set<String> FIELD_TYPES = Set.of(
            "input", "select", "select-multi", "radio", "cascader",
            "date", "daterange", "number", "status");

    private static final Set<String> TEMPLATE_TYPES = Set.of(
            "list_basic", "list_tree", "detail", "form");

    private static final Set<String> MENU_LINK_MODES = Set.of("new_child", "bind_existing");

    private static final String FORBIDDEN_MESSAGE =
            "AI 只能补全页面草稿，不能执行发布、删除或保存操作。";

    private PageGeneratorPatchProtocol() {
    }

    /** 校验结果：ok=false 时 patch 为 null；ok=true 时 patch 为白名单过滤后的干净对象 */
    public record PatchValidation(boolean ok, JsonNode patch, List<String> errors) {
    }

    /**
     * 生成 page-generator 场景的系统提示词。
     * 上下文只保留键名/类型/是否已配置等紧凑信息，不整段灌 JSON。
     */
    public static String buildSystemPrompt(JsonNode context) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是逸品汇中台「页面生成器」的 AI 助手，负责把用户的自然语言需求补全为页面草稿。");
        sb.append("只写草稿，不发布、不删除、不保存；发布必须由用户手动点击。\n\n");

        sb.append("## 当前草稿\n");
        JsonNode values = context == null ? null : context.path("values");
        if (values != null && values.isObject()) {
            appendValue(sb, values, "mode", "模式");
            appendValue(sb, values, "pageKey", "页面 key");
            appendValue(sb, values, "pageName", "页面名称");
            appendValue(sb, values, "templateType", "页面类型");
            appendValue(sb, values, "tableName", "业务表");
            appendValue(sb, values, "apiPrefix", "API 前缀");
            appendValue(sb, values, "menuLinkMode", "挂载方式");
            appendValue(sb, values, "parentMenuId", "父菜单 ID");
            appendValue(sb, values, "bindMenuId", "绑定菜单 ID");
            appendValue(sb, values, "generateMenu", "是否生成菜单");
            appendValue(sb, values, "fieldCount", "字段数");
            JsonNode fields = values.path("fields");
            if (fields.isArray()) {
                sb.append("- 已有字段：");
                if (fields.isEmpty()) {
                    sb.append("（无）");
                }
                int index = 0;
                for (JsonNode f : fields) {
                    if (index > 0) {
                        sb.append("；");
                    }
                    String label = f.path("fieldLabel").asText("");
                    String key = f.path("fieldKey").asText("");
                    String type = f.path("fieldType").asText("");
                    sb.append(label.isEmpty() ? "(未命名)" : label);
                    if (!key.isEmpty()) {
                        sb.append("(").append(key).append(")");
                    }
                    sb.append("[").append(type.isEmpty() ? "未设置" : type).append("]");
                    index++;
                    if (index >= 30) {
                        sb.append("；…");
                        break;
                    }
                }
                sb.append("\n");
            }
        }
        JsonNode extra = context == null ? null : context.path("extra");
        if (extra != null && extra.isObject()) {
            appendValue(sb, extra, "isAdvanced", "高级模式");
            appendValue(sb, extra, "configuredFieldCount", "已配置字段数");
        }

        sb.append("\n## 可用取值\n");
        sb.append("- templateType：list_basic（基础列表）、list_tree（树形列表）、detail（详情）、form（表单）\n");
        sb.append("- menuLinkMode：new_child（新建子菜单）、bind_existing（绑定已有菜单）\n");
        sb.append("- fieldType：input、select、select-multi、radio、cascader、date、daterange、number、status\n");
        sb.append("- 字段可写键：fieldLabel（中文名，必填）、fieldKey（英文 key）、fieldType、width、fixed（left/right/null）、")
                .append("isFilter、sortable、isRequired、dbColumn、dbType（如 VARCHAR/BIGINT/DECIMAL/DATETIME）、dbLength、options\n");

        sb.append("\n## 输出协议（必须遵守）\n");
        sb.append("当用户要求创建或修改页面时，最终回复必须包含且只包含一段如下标记包裹的 JSON：\n");
        sb.append(START_MARKER).append("\n");
        sb.append("{\"pageName\":\"页面名称\",\"templateType\":\"list_basic\",\"menuLinkMode\":\"new_child\",")
                .append("\"fields\":[{\"fieldLabel\":\"入库单号\",\"fieldKey\":\"stockNo\",\"fieldType\":\"input\",")
                .append("\"width\":160,\"fixed\":\"left\",\"isFilter\":true,\"dbColumn\":\"stock_no\",")
                .append("\"dbType\":\"VARCHAR\",\"dbLength\":64}]}\n");
        sb.append(END_MARKER).append("\n");
        sb.append("- 顶层只允许：pageName、pageKey、templateType、tableName、apiPrefix、generateMenu、")
                .append("menuLinkMode、parentMenuId、bindMenuId、sourceListPageKey、fields\n");
        sb.append("- fields 元素只允许：fieldLabel、fieldKey、fieldType、width、fixed、isFilter、sortable、")
                .append("isRequired、dbColumn、dbType、dbLength、options\n");
        sb.append("- 只输出用户明确要求的内容；未提及的字段不要删除，补丁按增量合并处理\n");
        sb.append("- 「生成/做一个/新建某页面」即为创建意图：若用户只给出页面名称、没有列字段，")
                .append("按页面业务语义自行推断 4–6 个常规字段（其中至少 1 个作为筛选条件），直接输出补丁，")
                .append("不要只反问用户；用户可在回填后继续调整\n");
        sb.append("- 标记外可写一两句简要说明；不要在标记外重复输出或解释 JSON\n");
        sb.append("- 严禁输出 publish、delete、save 等操作指令\n");
        sb.append("- 如果用户只是提问、不需要改草稿，则不要输出该标记\n");
        return sb.toString();
    }

    private static void appendValue(StringBuilder sb, JsonNode node, String key, String label) {
        JsonNode value = node.get(key);
        if (value == null || value.isNull()) {
            return;
        }
        sb.append("- ").append(label).append("：").append(value.asText("")).append("\n");
    }

    /**
     * 白名单校验。校验失败时不返回任何可下发内容；成功时返回过滤后的干净补丁。
     */
    public static PatchValidation validate(JsonNode patch) {
        List<String> errors = new ArrayList<>();
        if (patch == null || !patch.isObject()) {
            errors.add("补丁必须是 JSON 对象");
            return new PatchValidation(false, null, errors);
        }

        for (String key : fieldNames(patch)) {
            if (!TOP_LEVEL_KEYS.contains(key)) {
                if (isDangerousKey(key)) {
                    errors.add(FORBIDDEN_MESSAGE);
                } else {
                    errors.add("补丁包含不支持的配置项：" + key);
                }
            }
        }

        ObjectNode out = ((ObjectNode) patch).deepCopy();

        // 顶层强类型校验（就地替换为干净值）
        validateText(out, "pageName", true, errors);
        validateText(out, "pageKey", true, errors);
        validateText(out, "tableName", true, errors);
        validateText(out, "apiPrefix", true, errors);
        validateText(out, "sourceListPageKey", false, errors);
        validateEnum(out, "templateType", TEMPLATE_TYPES, errors);
        validateEnum(out, "menuLinkMode", MENU_LINK_MODES, errors);
        validateMenuId(out, "parentMenuId", errors);
        validateMenuId(out, "bindMenuId", errors);
        if (out.has("generateMenu") && !out.get("generateMenu").isBoolean()) {
            errors.add("generateMenu 必须是布尔值");
        }

        JsonNode fields = out.get("fields");
        if (fields != null && !fields.isNull()) {
            if (!fields.isArray()) {
                errors.add("fields 必须是数组");
            } else {
                validateFields(out, (ArrayNode) fields, errors);
            }
        }

        // 字段 key 唯一（空 key 不参与判重，由前端按中文名推导）
        Set<String> seenKeys = new LinkedHashSet<>();
        if (fields != null && fields.isArray()) {
            for (JsonNode f : fields) {
                JsonNode key = f.get("fieldKey");
                if (key == null || !key.isTextual() || key.asText().trim().isEmpty()) {
                    continue;
                }
                String normalized = key.asText().trim();
                if (!seenKeys.add(normalized)) {
                    errors.add("字段 key「" + normalized + "」重复");
                }
            }
        }

        if (!errors.isEmpty()) {
            return new PatchValidation(false, null, errors);
        }
        return new PatchValidation(true, out, List.of());
    }

    private static void validateFields(ObjectNode parent, ArrayNode fields, List<String> errors) {
        for (int i = 0; i < fields.size(); i++) {
            JsonNode raw = fields.get(i);
            if (!raw.isObject()) {
                errors.add("第 " + (i + 1) + " 个字段必须是对象");
                continue;
            }
            ObjectNode field = (ObjectNode) raw;
            for (String key : fieldNames(field)) {
                if (!FIELD_KEYS.contains(key)) {
                    if (isDangerousKey(key)) {
                        errors.add(FORBIDDEN_MESSAGE);
                    } else {
                        errors.add("字段包含不支持的属性：" + key);
                    }
                }
            }
            String label = text(field.get("fieldLabel"));
            String fieldKey = text(field.get("fieldKey"));
            if (label.isBlank() && fieldKey.isBlank()) {
                errors.add("第 " + (i + 1) + " 个字段缺少 fieldLabel 或 fieldKey");
            }
            if (field.has("fieldLabel") && !field.get("fieldLabel").isTextual()) {
                errors.add("字段 fieldLabel 必须是字符串");
            }
            if (field.has("fieldKey") && !field.get("fieldKey").isTextual()) {
                errors.add("字段 fieldKey 必须是字符串");
            }
            JsonNode type = field.get("fieldType");
            if (type != null) {
                if (!type.isTextual() || !FIELD_TYPES.contains(type.asText())) {
                    errors.add("字段「" + (label.isBlank() ? fieldKey : label) + "」的 fieldType 不合法");
                }
            }
            validatePositiveNumber(field, "width", errors, label, fieldKey);
            validatePositiveNumber(field, "dbLength", errors, label, fieldKey);
            JsonNode fixed = field.get("fixed");
            if (fixed != null && !fixed.isNull()) {
                if (!fixed.isTextual() || !Set.of("left", "right").contains(fixed.asText())) {
                    errors.add("字段「" + (label.isBlank() ? fieldKey : label) + "」的 fixed 只能是 left/right/null");
                }
            }
            for (String boolKey : List.of("isFilter", "sortable", "isRequired")) {
                JsonNode bool = field.get(boolKey);
                if (bool != null && !bool.isBoolean()) {
                    errors.add("字段「" + (label.isBlank() ? fieldKey : label) + "」的 " + boolKey + " 必须是布尔值");
                }
            }
            JsonNode dbType = field.get("dbType");
            if (dbType != null) {
                if (!dbType.isTextual()) {
                    errors.add("字段「" + (label.isBlank() ? fieldKey : label) + "」的 dbType 必须是字符串");
                } else {
                    field.put("dbType", dbType.asText().trim().toUpperCase());
                }
            }
            JsonNode options = field.get("options");
            if (options != null) {
                if (!options.isArray()) {
                    errors.add("字段「" + (label.isBlank() ? fieldKey : label) + "」的 options 必须是数组");
                } else {
                    ArrayNode optionArray = (ArrayNode) options;
                    for (int optIndex = 0; optIndex < optionArray.size(); optIndex++) {
                        JsonNode opt = optionArray.get(optIndex);
                        if (!opt.isObject()) {
                            // 模型常把 options 写成字符串/数字数组：规范化为 {label,value}，
                            // 避免整份补丁因一个字段的选项格式被拒
                            if (opt.isTextual() || opt.isNumber()) {
                                ObjectNode normalized = JsonNodeFactory.instance.objectNode();
                                normalized.set("label", opt);
                                normalized.set("value", opt);
                                optionArray.set(optIndex, normalized);
                                continue;
                            }
                            errors.add("字段「" + (label.isBlank() ? fieldKey : label) + "」的 options 元素必须是对象");
                            break;
                        }
                        for (String optKey : fieldNames(opt)) {
                            if (!Set.of("label", "value").contains(optKey)) {
                                errors.add("options 元素包含不支持的属性：" + optKey);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    private static void validateText(ObjectNode node, String key, boolean required, List<String> errors) {
        JsonNode value = node.get(key);
        if (value == null || value.isNull()) {
            if (required && node.has(key)) {
                errors.add(key + " 不能为空");
            }
            return;
        }
        if (!value.isTextual()) {
            errors.add(key + " 必须是字符串");
            return;
        }
        String trimmed = value.asText().trim();
        if (required && trimmed.isEmpty()) {
            errors.add(key + " 不能为空");
        }
        node.put(key, trimmed);
    }

    private static void validateEnum(ObjectNode node, String key, Set<String> allowed, List<String> errors) {
        JsonNode value = node.get(key);
        if (value == null || value.isNull()) {
            return;
        }
        if (!value.isTextual() || !allowed.contains(value.asText())) {
            errors.add(key + " 取值不合法：" + value.asText(""));
        }
    }

    private static void validateMenuId(ObjectNode node, String key, List<String> errors) {
        JsonNode value = node.get(key);
        if (value == null) {
            return;
        }
        if (value.isNull()) {
            return;
        }
        if (value.isTextual()) {
            node.put(key, value.asText().trim());
        } else if (value.isNumber()) {
            node.put(key, value.asText());
        } else {
            errors.add(key + " 必须是字符串、数字或 null");
        }
    }

    private static void validatePositiveNumber(ObjectNode field, String key, List<String> errors,
                                               String label, String fieldKey) {
        JsonNode value = field.get(key);
        if (value == null) {
            return;
        }
        String name = label.isBlank() ? fieldKey : label;
        if (value.isNumber() && value.asDouble() > 0) {
            return;
        }
        if (value.isTextual()) {
            try {
                double parsed = Double.parseDouble(value.asText().trim());
                if (parsed > 0) {
                    field.put(key, (int) parsed);
                    return;
                }
            } catch (NumberFormatException ignore) {
                // 落到统一错误
            }
        }
        errors.add("字段「" + name + "」的 " + key + " 必须是正数");
    }

    private static boolean isDangerousKey(String key) {
        String lower = key.toLowerCase();
        return lower.contains("publish") || lower.contains("delete") || lower.equals("save")
                || lower.equals("action") || lower.equals("operation");
    }

    private static List<String> fieldNames(JsonNode node) {
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }

    private static String text(JsonNode node) {
        return node != null && node.isTextual() ? node.asText().trim() : "";
    }

    /** action 帧标题 */
    public static String buildActionTitle(JsonNode patch) {
        String pageName = patch == null ? "" : text(patch.get("pageName"));
        return pageName.isBlank() ? "页面生成器 · 草稿补丁" : pageName + " · 草稿补丁";
    }

    /** action 帧摘要行 */
    public static List<String> buildActionItems(JsonNode patch) {
        List<String> items = new ArrayList<>();
        if (patch == null) {
            return items;
        }
        String pageName = text(patch.get("pageName"));
        if (!pageName.isBlank()) {
            items.add("页面名称：" + pageName);
        }
        String templateType = text(patch.get("templateType"));
        if (!templateType.isBlank()) {
            items.add("页面类型：" + templateTypeLabel(templateType));
        }
        String menuLinkMode = text(patch.get("menuLinkMode"));
        if (!menuLinkMode.isBlank()) {
            items.add("挂载方式：" + ("bind_existing".equals(menuLinkMode) ? "绑定已有菜单" : "新建子菜单"));
        }
        JsonNode fields = patch.get("fields");
        if (fields != null && fields.isArray() && !fields.isEmpty()) {
            StringBuilder sb = new StringBuilder("字段 ").append(fields.size()).append(" 个：");
            int index = 0;
            for (JsonNode f : fields) {
                if (index > 0) {
                    sb.append("、");
                }
                String label = text(f.get("fieldLabel"));
                String key = text(f.get("fieldKey"));
                sb.append(label.isBlank() ? key : label);
                if (!label.isBlank() && !key.isBlank()) {
                    sb.append("(").append(key).append(")");
                }
                index++;
                if (index >= 10) {
                    sb.append("…");
                    break;
                }
            }
            items.add(sb.toString());
            List<String> filters = new ArrayList<>();
            for (JsonNode f : fields) {
                if (f.path("isFilter").asBoolean(false)) {
                    String label = text(f.get("fieldLabel"));
                    filters.add(label.isBlank() ? text(f.get("fieldKey")) : label);
                }
            }
            if (!filters.isEmpty()) {
                items.add("筛选字段：" + String.join("、", filters));
            }
        }
        return items;
    }

    private static String templateTypeLabel(String type) {
        return switch (type) {
            case "list_basic" -> "基础列表";
            case "list_tree" -> "树形列表";
            case "detail" -> "详情页";
            case "form" -> "表单页";
            default -> type;
        };
    }

    /** 把校验错误拼成一条用户可读文本 */
    public static String errorText(List<String> errors) {
        if (errors == null || errors.isEmpty()) {
            return "补丁校验失败。";
        }
        String joined = String.join("；", errors);
        return "补丁未能应用：" + joined;
    }

    /** 供测试/排查使用 */
    public static Set<String> topLevelKeys() {
        return TOP_LEVEL_KEYS;
    }

    public static Set<String> fieldKeys() {
        return FIELD_KEYS;
    }

    public static Set<String> fieldTypes() {
        return FIELD_TYPES;
    }
}
