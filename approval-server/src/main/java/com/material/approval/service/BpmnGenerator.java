package com.material.approval.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.material.approval.common.BizException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 宜搭式流程设计器 JSON → BPMN 2.0 XML（含 DI 图形信息）。
 * 节点类型：start / approve / cc / condition / end。
 * 布局：主干纵向居中排列；条件分支按分支顺序横向展开成列，汇合网关后回到主干。
 * 审批节点：或签 = candidateUsers 静态串；会签 = 并行多实例（运行时注入 approverList_{nodeId}）；
 *          指定角色 = candidateGroups。
 * 条件分支：amount 字段比较表达式，最后一支为默认流（无条件）。
 */
public final class BpmnGenerator {

    private BpmnGenerator() {
    }

    private static final Pattern NODE_ID = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$");
    private static final Set<String> OPS = Set.of(">", ">=", "<", "<=", "==");

    private static final int NODE_W = 180;
    private static final int NODE_H = 64;
    private static final int EVENT_SIZE = 36;
    private static final int GATEWAY_SIZE = 40;
    private static final int V_GAP = 60;    // 纵向相邻元素间隙
    private static final int COL_W = 220;   // 条件分支列宽
    private static final int TRUNK_X = 420; // 主干中心线 x

    /** 生成入口：先结构校验（不通过抛 400），再拼 XML */
    public static String generate(String processKey, String displayName, JsonNode doc) {
        List<String> errors = new ArrayList<>();
        validateDoc(doc, errors);
        if (!errors.isEmpty()) {
            throw new BizException(400, "流程结构校验未通过：" + String.join("；", errors));
        }
        Ctx ctx = new Ctx();
        generateList(doc.get("nodes"), TRUNK_X, 80, ctx);
        return render(processKey, displayName == null ? "" : displayName, ctx);
    }

    // ---------------- 校验 ----------------

    private static void validateDoc(JsonNode doc, List<String> errors) {
        JsonNode nodes = doc == null ? null : doc.get("nodes");
        if (nodes == null || !nodes.isArray() || nodes.isEmpty()) {
            errors.add("流程节点为空");
            return;
        }
        if (!"start".equals(nodes.get(0).path("type").asText())) {
            errors.add("第一个节点必须是开始节点");
        }
        if (!"end".equals(nodes.get(nodes.size() - 1).path("type").asText())) {
            errors.add("最后一个节点必须是结束节点");
        }
        int starts = 0;
        int ends = 0;
        for (JsonNode node : nodes) {
            String type = node.path("type").asText();
            if ("start".equals(type)) {
                starts++;
            }
            if ("end".equals(type)) {
                ends++;
            }
        }
        if (starts != 1) {
            errors.add("开始节点数量必须为 1");
        }
        if (ends != 1) {
            errors.add("结束节点数量必须为 1");
        }
        validateList(nodes, errors, new HashSet<>());
    }

    private static void validateList(JsonNode nodes, List<String> errors, Set<String> usedIds) {
        for (JsonNode node : nodes) {
            String id = node.path("id").asText("");
            String type = node.path("type").asText();
            String name = node.path("name").asText("");
            String label = name.isBlank() ? id : name;
            if (id.isEmpty() || !NODE_ID.matcher(id).matches()) {
                errors.add("节点标识无效：" + (id.isEmpty() ? "(空)" : id));
            } else if (!usedIds.add(id)) {
                errors.add("节点标识重复：" + id);
            }
            if (name.isBlank()) {
                errors.add("节点「" + label + "」名称不能为空");
            }
            switch (type) {
                case "approve" -> {
                    if ("role".equals(node.path("assigneeType").asText("member"))) {
                        if (node.path("roleCode").asText("").isBlank()) {
                            errors.add("审批节点「" + label + "」未指定角色");
                        }
                    } else {
                        JsonNode assigneeIds = node.get("assigneeIds");
                        if (assigneeIds == null || !assigneeIds.isArray() || assigneeIds.isEmpty()) {
                            errors.add("审批节点「" + label + "」未指定审批人");
                        }
                    }
                    String mode = node.path("mode").asText("any");
                    if (!"any".equals(mode) && !"all".equals(mode)) {
                        errors.add("审批节点「" + label + "」审批方式无效");
                    }
                }
                case "cc" -> {
                    // 抄送人一期不强制校验
                }
                case "condition" -> {
                    JsonNode branches = node.get("branches");
                    if (branches == null || !branches.isArray() || branches.size() < 2) {
                        errors.add("条件节点「" + label + "」至少需要 2 个分支");
                        break;
                    }
                    Set<Integer> priorities = new HashSet<>();
                    for (int k = 0; k < branches.size(); k++) {
                        JsonNode br = branches.get(k);
                        String brName = br.path("name").asText("");
                        JsonNode brNodes = br.get("nodes");
                        if (brNodes == null || !brNodes.isArray() || brNodes.isEmpty()) {
                            errors.add("分支「" + brName + "」内容为空");
                        }
                        if (k < branches.size() - 1) {
                            String op = br.path("op").asText("");
                            String value = br.path("value").asText("");
                            if (!OPS.contains(op) || value.isBlank()) {
                                errors.add("分支「" + brName + "」缺少条件表达式");
                            } else {
                                try {
                                    Double.parseDouble(value);
                                } catch (NumberFormatException e) {
                                    errors.add("分支「" + brName + "」条件值必须是数字");
                                }
                            }
                        }
                        if (!priorities.add(br.path("priority").asInt(0))) {
                            errors.add("分支「" + brName + "」优先级重复");
                        }
                        if (brNodes != null && brNodes.isArray() && !brNodes.isEmpty()) {
                            for (JsonNode inner : brNodes) {
                                String innerType = inner.path("type").asText();
                                if ("start".equals(innerType) || "end".equals(innerType)) {
                                    errors.add("分支「" + brName + "」内不允许开始/结束节点");
                                }
                            }
                            validateList(brNodes, errors, usedIds);
                        }
                    }
                }
                case "start", "end" -> {
                }
                default -> errors.add("未知节点类型：" + type);
            }
        }
    }

    // ---------------- 布局与元素生成 ----------------

    private static final class Ctx {
        final List<ElementDef> elements = new ArrayList<>();
        final List<FlowSpec> flows = new ArrayList<>();
        final List<Shape> shapes = new ArrayList<>();
        final List<Edge> edges = new ArrayList<>();
        int flowSeq = 0;
    }

    /** 元素定义；defaultFlowId 仅互斥网关使用，渲染时注入 flowable:default */
    private static final class ElementDef {
        final String xml;
        String defaultFlowId;

        ElementDef(String xml) {
            this.xml = xml;
        }
    }

    private record FlowSpec(String id, String source, String target, String condition) {
    }

    private record Shape(String elementId, int x, int y, int w, int h) {
    }

    private record Edge(String flowId, List<int[]> points) {
    }

    /** 一段节点序列的生成结果：入口元素 id / 出口元素 id / 出口中心 x / 序列底部 y */
    private record Seg(String entryId, String exitId, int exitCx, int bottomY) {
    }

    private record ConditionResult(String entryId, String exitId, int bottomY) {
    }

    /** 生成一段同列节点（主干或分支），返回入口/出口信息 */
    private static Seg generateList(JsonNode nodes, int cx, int yTop, Ctx ctx) {
        if (nodes == null || !nodes.isArray() || nodes.isEmpty()) {
            throw new BizException(400, "流程节点序列为空");
        }
        String entryId = null;
        String cur = null;
        int curBottom = yTop;
        for (JsonNode node : nodes) {
            String id = node.path("id").asText();
            String type = node.path("type").asText();
            int top = cur == null ? yTop : curBottom + V_GAP;
            String in;
            String out;
            int bottom;
            switch (type) {
                case "start", "end" -> {
                    addEvent(ctx, node, cx, top);
                    in = id;
                    out = id;
                    bottom = top + EVENT_SIZE;
                }
                case "approve" -> {
                    addUserTask(ctx, node, cx, top);
                    in = id;
                    out = id;
                    bottom = top + NODE_H;
                }
                case "cc" -> {
                    addCcTask(ctx, node, cx, top);
                    in = id;
                    out = id;
                    bottom = top + NODE_H;
                }
                case "condition" -> {
                    ConditionResult r = addCondition(ctx, node, cx, top);
                    in = r.entryId();
                    out = r.exitId();
                    bottom = r.bottomY();
                }
                default -> throw new BizException(400, "未知节点类型：" + type);
            }
            if (cur != null) {
                link(ctx, cur, in, cx, curBottom, cx, top, null);
            }
            if (entryId == null) {
                entryId = in;
            }
            cur = out;
            curBottom = bottom;
        }
        return new Seg(entryId, cur, cx, curBottom);
    }

    private static void addEvent(Ctx ctx, JsonNode node, int cx, int top) {
        String id = node.path("id").asText();
        String name = node.path("name").asText("");
        String tag = "start".equals(node.path("type").asText()) ? "startEvent" : "endEvent";
        ctx.elements.add(new ElementDef("<" + tag + " id=\"" + id + "\" name=\"" + esc(name) + "\"/>"));
        ctx.shapes.add(new Shape(id, cx - EVENT_SIZE / 2, top, EVENT_SIZE, EVENT_SIZE));
    }

    private static void addUserTask(Ctx ctx, JsonNode node, int cx, int top) {
        String id = node.path("id").asText();
        String name = node.path("name").asText("");
        String assigneeType = node.path("assigneeType").asText("member");
        String mode = node.path("mode").asText("any");
        String xml;
        if ("role".equals(assigneeType)) {
            xml = "<userTask id=\"" + id + "\" name=\"" + esc(name) + "\" flowable:candidateGroups=\""
                    + esc(node.path("roleCode").asText()) + "\"/>";
        } else if ("all".equals(mode)) {
            // 会签：并行多实例，运行时注入 approverList_{nodeId}（List<String> 审批人ID）
            xml = "<userTask id=\"" + id + "\" name=\"" + esc(name) + "\" flowable:assignee=\"${assignee}\">\n"
                    + "        <multiInstanceLoopCharacteristics isSequential=\"false\"\n"
                    + "            flowable:collection=\"${approverList_" + id + "}\" flowable:elementVariable=\"assignee\">\n"
                    + "          <completionCondition>${nrOfCompletedInstances == nrOfInstances}</completionCondition>\n"
                    + "        </multiInstanceLoopCharacteristics>\n"
                    + "      </userTask>";
        } else {
            // 或签：静态候选串，任一审批人可认领处理
            StringBuilder users = new StringBuilder();
            for (JsonNode uid : node.path("assigneeIds")) {
                if (users.length() > 0) {
                    users.append(',');
                }
                users.append(uid.asText());
            }
            xml = "<userTask id=\"" + id + "\" name=\"" + esc(name) + "\" flowable:candidateUsers=\"" + esc(users.toString()) + "\"/>";
        }
        ctx.elements.add(new ElementDef(xml));
        ctx.shapes.add(new Shape(id, cx - NODE_W / 2, top, NODE_W, NODE_H));
    }

    private static void addCcTask(Ctx ctx, JsonNode node, int cx, int top) {
        String id = node.path("id").asText();
        String name = node.path("name").asText("");
        // 抄送节点一期为占位 serviceTask（no-op），实际抄送动作后续接监听
        ctx.elements.add(new ElementDef(
                "<serviceTask id=\"" + id + "\" name=\"" + esc(name) + "\" flowable:expression=\"${true}\"/>"));
        ctx.shapes.add(new Shape(id, cx - NODE_W / 2, top, NODE_W, NODE_H));
    }

    private static ConditionResult addCondition(Ctx ctx, JsonNode node, int cx, int top) {
        String id = node.path("id").asText();
        String name = node.path("name").asText("");
        JsonNode branches = node.path("branches");
        int n = branches.size();

        String gwId = id + "_split";
        ElementDef gwDef = new ElementDef(
                "<exclusiveGateway id=\"" + gwId + "\" name=\"" + esc(name) + "\"/>");
        ctx.elements.add(gwDef);
        ctx.shapes.add(new Shape(gwId, cx - GATEWAY_SIZE / 2, top, GATEWAY_SIZE, GATEWAY_SIZE));
        int gwBottom = top + GATEWAY_SIZE;
        int branchTop = gwBottom + 80;

        List<Seg> segs = new ArrayList<>();
        int maxBottom = 0;
        String defaultFlowId = null;
        for (int k = 0; k < n; k++) {
            JsonNode br = branches.get(k);
            int bcx = (int) Math.round(cx + (k - (n - 1) / 2.0) * COL_W);
            Seg seg = generateList(br.get("nodes"), bcx, branchTop, ctx);
            segs.add(seg);
            boolean isLast = k == n - 1;
            String cond = isLast ? null
                    : "${amount " + br.path("op").asText() + " " + br.path("value").asText() + "}";
            String fid = link(ctx, gwId, seg.entryId(), cx, gwBottom, bcx, branchTop, cond);
            if (isLast) {
                defaultFlowId = fid;
            }
            maxBottom = Math.max(maxBottom, seg.bottomY());
        }

        int mergeTop = maxBottom + 80;
        String mgId = id + "_merge";
        ctx.elements.add(new ElementDef("<exclusiveGateway id=\"" + mgId + "\" name=\"合并\"/>"));
        ctx.shapes.add(new Shape(mgId, cx - GATEWAY_SIZE / 2, mergeTop, GATEWAY_SIZE, GATEWAY_SIZE));
        for (Seg seg : segs) {
            link(ctx, seg.exitId(), mgId, seg.exitCx(), seg.bottomY(), cx, mergeTop, null);
        }
        gwDef.defaultFlowId = defaultFlowId;
        return new ConditionResult(gwId, mgId, mergeTop + GATEWAY_SIZE);
    }

    /** 连接两个元素：生成 sequenceFlow（可带条件）+ DI 折线；返回 flow id */
    private static String link(Ctx ctx, String source, String target,
                               int sx, int syBottom, int tx, int tyTop, String condition) {
        if (source == null || target == null || source.equals(target)) {
            return null;
        }
        String fid = "flow" + (++ctx.flowSeq);
        ctx.flows.add(new FlowSpec(fid, source, target, condition));
        List<int[]> pts = new ArrayList<>();
        if (sx == tx) {
            pts.add(new int[]{sx, syBottom});
            pts.add(new int[]{tx, tyTop});
        } else {
            int midY = syBottom + Math.max(30, (tyTop - syBottom) / 2);
            pts.add(new int[]{sx, syBottom});
            pts.add(new int[]{sx, midY});
            pts.add(new int[]{tx, midY});
            pts.add(new int[]{tx, tyTop});
        }
        ctx.edges.add(new Edge(fid, pts));
        return fid;
    }

    // ---------------- XML 渲染 ----------------

    private static String render(String processKey, String displayName, Ctx ctx) {
        StringBuilder body = new StringBuilder();
        for (ElementDef e : ctx.elements) {
            String xml = e.xml;
            if (e.defaultFlowId != null) {
                xml = xml.replace("<exclusiveGateway ",
                        "<exclusiveGateway flowable:default=\"" + e.defaultFlowId + "\" ");
            }
            body.append("    ").append(xml).append('\n');
        }
        for (FlowSpec f : ctx.flows) {
            body.append("    <sequenceFlow id=\"").append(f.id())
                    .append("\" sourceRef=\"").append(f.source())
                    .append("\" targetRef=\"").append(f.target()).append("\">");
            if (f.condition() != null) {
                body.append('\n')
                        .append("      <conditionExpression xsi:type=\"tFormalExpression\"><![CDATA[")
                        .append(f.condition()).append("]]></conditionExpression>\n").append("    ");
            }
            body.append("</sequenceFlow>\n");
        }

        StringBuilder di = new StringBuilder();
        di.append("  <bpmndi:BPMNDiagram id=\"BPMNDiagram_").append(esc(processKey)).append("\">\n");
        di.append("    <bpmndi:BPMNPlane id=\"BPMNPlane_").append(esc(processKey))
                .append("\" bpmnElement=\"").append(esc(processKey)).append("\">\n");
        for (Shape s : ctx.shapes) {
            di.append("      <bpmndi:BPMNShape id=\"").append(s.elementId()).append("_sh\" bpmnElement=\"")
                    .append(s.elementId()).append("\">\n")
                    .append("        <omgdc:Bounds x=\"").append(s.x()).append("\" y=\"").append(s.y())
                    .append("\" width=\"").append(s.w()).append("\" height=\"").append(s.h()).append("\"/>\n")
                    .append("      </bpmndi:BPMNShape>\n");
        }
        for (Edge e : ctx.edges) {
            di.append("      <bpmndi:BPMNEdge id=\"").append(e.flowId()).append("_eg\" bpmnElement=\"")
                    .append(e.flowId()).append("\">\n");
            for (int[] p : e.points()) {
                di.append("        <omgdi:waypoint x=\"").append(p[0]).append("\" y=\"").append(p[1]).append("\"/>\n");
            }
            di.append("      </bpmndi:BPMNEdge>\n");
        }
        di.append("    </bpmndi:BPMNPlane>\n");
        di.append("  </bpmndi:BPMNDiagram>\n");

        StringBuilder xml = new StringBuilder(8192);
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<definitions xmlns=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n")
                .append("             xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n")
                .append("             xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\"\n")
                .append("             xmlns:omgdc=\"http://www.omg.org/spec/DD/20100524/DC\"\n")
                .append("             xmlns:omgdi=\"http://www.omg.org/spec/DD/20100524/DI\"\n")
                .append("             xmlns:flowable=\"http://flowable.org/bpmn\"\n")
                .append("             targetNamespace=\"http://material.com/approval\">\n\n")
                .append("  <process id=\"").append(esc(processKey)).append("\" name=\"").append(esc(displayName))
                .append("\" isExecutable=\"true\">\n")
                .append(body)
                .append("  </process>\n\n")
                .append(di)
                .append("</definitions>\n");
        return xml.toString();
    }

    private static String esc(String value) {
        return value == null ? "" : value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
