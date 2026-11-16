# Flowable 流程图生成必须依赖 BPMN DI 节点

> Last updated: 2026-11-12

## 核心结论

手写 BPMN 文件若只写 `<process>` 而缺少 `bpmndi:BPMNDiagram` 图形信息，`DefaultProcessDiagramGenerator.generateDiagram` 会抛 NPE：**"flowNodeGraphicInfo is null"**。

## 必要元素

```xml
<bpmndi:BPMNDiagram id="...">
  <bpmndi:BPMNPlane bpmnElement="流程id">
    <!-- 每个节点需要 BPMNShape + omgdc:Bounds(x,y,width,height) -->
    <bpmndi:BPMNShape bpmnElement="节点id">
      <omgdc:Bounds x="155" y="161" width="36" height="36"/>
    </bpmndi:BPMNShape>
    <!-- 每条连线需要 BPMNEdge + omgdi:waypoint -->
    <bpmndi:BPMNEdge bpmnElement="连线id">
      <omgdi:waypoint x="191" y="179"/>
      <omgdi:waypoint x="250" y="179"/>
    </bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane>
</bpmndi:BPMNDiagram>
```

命名空间：`xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"`、`xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"`、`xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"`

## 服务端守卫

生成图前检测 `BpmnModel.getLocationMap().isEmpty()`，为空则抛 400「流程文件缺少图形信息（DI 节点），无法生成流程图」，避免裸 NPE（见 ApprovalService.processDefinitionDiagram）。

## Flowable 7.2 API 注意

- `generateDiagram` **没有**「双 List + 3 字体」的 7 参重载，可用 10 参版：
  `(model, "png", highLightActivities, highLightFlows, activityFont, labelFont, annotationFont, ClassLoader(可null), scaleFactor, drawSequenceFlowNameWithNoLabel)`
- Flowable 表名**大写**：`ACT_RE_DEPLOYMENT`、`ACT_RE_PROCDEF`
- 挂起/激活：`repositoryService.suspendProcessDefinitionById(id, false, null)`（false = 不影响运行中实例）
- 部署 id ≠ 流程定义 id（不同 UUID），删除部署要用列表里的 `deploymentId`
