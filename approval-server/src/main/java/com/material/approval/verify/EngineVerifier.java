package com.material.approval.verify;

import org.flowable.engine.ProcessEngine;
import org.flowable.engine.ProcessEngineConfiguration;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 启动时验证 Flowable 引擎：部署 BPMN → 启动实例 → 查询任务。
 * 仅用于版本组合验证，后续接入真实业务时删除或关闭。
 */
@Component
@ConditionalOnProperty(name = "appr.verify.enabled", havingValue = "true")
public class EngineVerifier implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EngineVerifier.class);

    private final ProcessEngine processEngine;

    public EngineVerifier(ProcessEngine processEngine) {
        this.processEngine = processEngine;
    }

    @Override
    public void run(ApplicationArguments args) {
        ProcessEngineConfiguration configuration = processEngine.getProcessEngineConfiguration();
        log.info("VERIFY_ENGINE name={} historyLevel={} schemaUpdate={}",
                processEngine.getName(),
                configuration.getHistoryLevel(),
                configuration.getDatabaseSchemaUpdate());

        RepositoryService repositoryService = processEngine.getRepositoryService();
        Deployment deployment = repositoryService.createDeployment()
                .name("verify-deployment")
                .addClasspathResource("processes/verify-simple.bpmn20.xml")
                .deploy();
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .deploymentId(deployment.getId())
                .singleResult();
        log.info("VERIFY_DEPLOY deploymentId={} processDefinitionKey={} version={}",
                deployment.getId(), definition.getKey(), definition.getVersion());

        Map<String, Object> variables = new HashMap<>();
        variables.put("applicantId", "1001");
        variables.put("approverId", "2002");
        RuntimeService runtimeService = processEngine.getRuntimeService();
        ProcessInstance instance = runtimeService.startProcessInstanceByKey(definition.getKey(), variables);

        TaskService taskService = processEngine.getTaskService();
        Task task = taskService.createTaskQuery()
                .processInstanceId(instance.getId())
                .singleResult();

        log.info("VERIFY_TASK processInstanceId={} taskId={} taskName={} assignee={}",
                instance.getId(), task.getId(), task.getName(), task.getAssignee());
        log.info("VERIFY_OK");
    }
}
