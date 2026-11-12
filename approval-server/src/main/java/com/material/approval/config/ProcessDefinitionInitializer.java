package com.material.approval.config;

import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.ProcessDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProcessDefinitionInitializer {

    private static final Logger log = LoggerFactory.getLogger(ProcessDefinitionInitializer.class);

    private final RepositoryService repositoryService;

    public ProcessDefinitionInitializer(RepositoryService repositoryService) {
        this.repositoryService = repositoryService;
    }

    @Bean
    public ApplicationRunner deployMaterialApplication() {
        return args -> {
            ProcessDefinition existing = repositoryService.createProcessDefinitionQuery()
                    .processDefinitionKey("materialApplication").latestVersion().singleResult();
            if (existing != null) {
                log.info("materialApplication 已部署，版本 {}，跳过部署", existing.getVersion());
                return;
            }
            repositoryService.createDeployment()
                    .name("material-application-p0")
                    .addClasspathResource("processes/material-application.bpmn20.xml")
                    .deploy();
            log.info("materialApplication 首次部署完成");
        };
    }
}
