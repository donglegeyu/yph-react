<template>
  <div class="component-preview">
    <PageTitle title="主题设置">
      <template #actions>
        <a-button @click="handleReset">重置为默认</a-button>
        <a-button type="primary" @click="handleApply" :loading="applying">应用修改</a-button>
      </template>
    </PageTitle>
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="tokens" tab="全局样式">
        <div class="tokens-panel">
          <div class="tokens-layout">
            <div class="tokens-nav">
              <a-menu
                :selectedKeys="[selectedCategory as string]"
                mode="inline"
                theme="light"
                @click="({ key }) => selectedCategory = key as string"
              >
                <a-menu-item 
                  v-for="category in sortedCategories" 
                  :key="category.code"
                >
                  {{ category.name }}
                </a-menu-item>
              </a-menu>
            </div>
            <div class="tokens-content" :class="{ 'tokens-content-fixed': selectedCategory !== 'base-color', 'tokens-content-wide': selectedCategory === 'base-color' }">
              <a-spin :spinning="loading">
                <template v-for="category in sortedCategories.filter((c: any) => c.code === selectedCategory)" :key="category.code">
                  <div class="token-category">
                    <template v-for="group in getTokensGrouped(category.code)" :key="group.name">
                      <div class="token-group">
                        <div class="group-header" v-if="!isColorScaleGroup(group)">{{ group.name }}</div>
                        <div class="token-list">
                          <ColorScale
                            v-if="isColorScaleGroup(group)"
                            :key="getColorScalePrefix(group)"
                            :label="getColorScaleLabel(group)"
                            :base-color="getColorScaleBase(group.items)"
                            :colors="getColorScaleColors(group.items)"
                            :custom-colors="getColorScaleCustomColors(group.items)"
                            :highlight-index="5"
                            :token-prefix="getColorScalePrefix(group)"
                            :selected-index="selectedColorInfo?.index ?? null"
                            :selected-group-key="selectedGroupKey"
                            @select="(info: any) => { selectedColorInfo = info; selectedGroupKey = info.groupKey }"
                          />
                          <template v-else>
                            <div 
                              v-for="token in group.items" 
                              :key="token.id"
                              class="token-row"
                              :class="{ 'is-selected': selectedTokenId === token.id }"
                              @click="selectedTokenId = token.id"
                            >
                              <div class="token-label">
                                <div v-if="token.tokenType === 'color'" class="token-preview color-preview" :style="{ backgroundColor: token.currentValue }"></div>
                                <div class="label-text">
                                  <div class="token-name">{{ token.name }}</div>
                                  <div class="token-key">{{ token.tokenKey }}</div>
                                </div>
                              </div>
                            </div>
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </a-spin>
            </div>
            <div class="tokens-divider" />
            <div class="tokens-preview">
              <template v-if="selectedCategory === 'base-color' && selectedColorInfo">
                <div class="preview-content">
                  <div class="color-detail-panel">
                    <div class="color-detail-row" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="cursor-pointer" style="color: var(--color-text); font-weight: 600;">{{ selectedColorInfo.tokenName }}</span>
                        <a-input
                          v-if="colorType === 'custom'"
                          v-model:value="customColor"
                          class="color-edit-input"
                          style="width: 120px; font-weight: 400;"
                          placeholder="#FFFFFF"
                          @focus="handleColorInputFocus"
                          @blur="handleColorInputBlur"
                        />
                        <span v-else class="cursor-pointer" style="color: var(--color-text-secondary); font-weight: 600;">#{{ displayColor.replace('#', '') }}</span>
                      </div>
                      <a-radio-group v-model:value="colorType">
                        <a-radio value="auto">算法生成色值</a-radio>
                        <a-radio value="custom">自定义色值</a-radio>
                      </a-radio-group>
                    </div>

                    <div style="color: var(--color-text); font-weight: 600; margin-bottom: 12px;">引用它的功能色</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px;">
                      <a-tag
                        v-for="token in relatedTokens"
                        :key="token.tokenKey"
                        class="cursor-pointer"
                        @click="handleTagClick(token.tokenKey)"
                      >
                        {{ token.name }}/{{ token.tokenKey }}
                      </a-tag>
                      <span v-if="relatedTokens.length === 0" style="color: var(--color-text-secondary);">
                        暂无
                      </span>
                    </div>

                    <div style="color: var(--color-text); font-weight: 600; margin-bottom: 12px;">无障碍检查</div>
                    <AccessibilityChecker
                      :token-name="selectedColorInfo.tokenName"
                      :color="displayColor"
                    />
                  </div>
                </div>
              </template>
              <template v-else-if="selectedCategory !== 'base-color' && selectedTokenId">
                <div class="preview-content">
                  <div class="color-detail-panel" style="display: flex; flex-direction: column; gap: 32px;">
                    <div class="color-detail-row" style="display: flex; flex-direction: column; gap: 12px;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="cursor-pointer" style="color: var(--color-text); font-weight: 600;">{{ selectedTokenInfo?.name }}</span>
                        <span class="cursor-pointer" style="color: var(--color-text-secondary); font-weight: 600;">{{ selectedTokenInfo?.tokenKey }}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <a-input 
                          v-if="selectedTokenInfo?.tokenType === 'color'" 
                          v-model:value="selectedTokenInfo!.currentValue" 
                          style="width: 100px;"
                          @change="() => handleTokenChange(selectedTokenInfo!)"
                        />
                        <a-input-number 
                          v-else-if="selectedTokenInfo?.tokenType === 'number' || selectedTokenInfo?.tokenType === 'spacing'" 
                          v-model:value="selectedTokenInfo!.currentValue" 
                          :min="0"
                          style="width: 100px;"
                          @change="() => handleTokenChange(selectedTokenInfo!)"
                        />
                        <a-input 
                          v-else 
                          v-model:value="selectedTokenInfo!.currentValue"
                          style="width: 100px;"
                          @change="() => handleTokenChange(selectedTokenInfo!)"
                        />
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                          <a-tag
                            v-for="token in colorRelatedBaseTokens"
                            :key="token.tokenKey"
                            class="cursor-pointer"
                            @click="handleTagClick(token.tokenKey)"
                          >
                            {{ token.name }}/{{ token.tokenKey }}
                          </a-tag>
                          <span v-if="colorRelatedBaseTokens.length === 0" style="color: var(--color-text-secondary);">
                            暂无
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="color-classification-preview">
                      <div class="preview-label">基础色阶引用关系</div>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <a-select v-model:value="selectedBaseColorScale" style="width: 136px;">
                          <a-select-option v-for="opt in baseColorScaleOptions" :key="opt.value" :value="opt.value">
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <div class="color-preview-circle" :style="{ backgroundColor: getBaseColorByScale(opt.value) }"></div>
                              <span>{{ opt.label.split(' ')[0] }}</span>
                            </div>
                          </a-select-option>
                        </a-select>
                        <ColorScale
                          :label="baseColorScaleOptions.find(o => o.value === selectedBaseColorScale)?.label || '主色'"
                          :base-color="currentBaseColorScaleBase"
                          :colors="currentBaseColorScaleColors"
                          :highlight-index="5"
                          :token-prefix="selectedBaseColorScale"
                          :selected-index="currentBaseColorScaleSelectedIndex ?? null"
                          :selected-group-key="selectedBaseColorScale"
                          :hide-header="true"
                          :hide-base="true"
                          @select="(info: any) => { handleColorScaleSelect(info) }"
                        />
                      </div>
                    </div>
                    <div class="color-classification-preview">
                      <div class="preview-label">透明度</div>
                      <a-input v-model:value="colorOpacity" style="width: 136px">
                        <template #suffix>
                          <span>%</span>
                        </template>
                      </a-input>
                    </div>
                    <div class="color-classification-preview">
                        <div class="preview-label">无障碍检查</div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                          <span style="color: var(--color-text); font-weight: 600;">{{ selectedTokenInfo?.name }}</span>
                          <span style="color: var(--color-text); font-weight: 600; margin: 0 8px;">vs.</span>
                          <a-select v-model:value="compareColor2" style="width: 160px">
                            <a-select-option value="white">--color-white</a-select-option>
                            <a-select-option value="black">--color-black</a-select-option>
                          </a-select>
                        </div>
                        <div class="a11y-checker" v-if="colorClassA11yResults">
                          <div class="a11y-item">
                            <div class="a11y-box" :style="{ backgroundColor: compareColorMap2[compareColor2] || '#ffffff', color: selectedTokenInfo?.currentValue }">
                              APCA
                            </div>
                            <div class="a11y-result" :style="getResultStyle(colorClassA11yResults.textOnBg.level)">
                              <span style="font-weight: 600;">{{ colorClassA11yResults.textOnBg.value.toFixed(0) }}</span>
                              <span>-</span>
                              <span>{{ colorClassA11yResults.textOnBg.level }}</span>
                            </div>
                          </div>
                          <div class="a11y-item">
                            <div class="a11y-box" :style="{ backgroundColor: selectedTokenInfo?.currentValue, color: compareColorMap2[compareColor2] || '#ffffff' }">
                              APCA
                            </div>
                            <div class="a11y-result" :style="getResultStyle(colorClassA11yResults.bgOnText.level)">
                              <span style="font-weight: 600;">{{ colorClassA11yResults.bgOnText.value.toFixed(0) }}</span>
                              <span>-</span>
                              <span>{{ colorClassA11yResults.bgOnText.level }}</span>
                            </div>
                          </div>
                          <div class="a11y-item">
                            <div class="a11y-box" :style="{ backgroundColor: compareColorMap2[compareColor2] || '#ffffff', color: selectedTokenInfo?.currentValue }">
                              WCAG
                            </div>
                            <div class="a11y-result" :style="getResultStyle(colorClassA11yResults.wcagLevel)">
                              <span style="font-weight: 600;">{{ colorClassA11yResults.wcagRatio.toFixed(2) }}:1</span>
                              <span>-</span>
                              <span>{{ colorClassA11yResults.wcagLevel }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </template>
              <template v-else>
                <div class="preview-header">实时预览</div>
                <div class="preview-content">
                  <a-button type="primary">主要按钮</a-button>
                  <a-button>默认按钮</a-button>
                  <a-button danger>危险按钮</a-button>
                  <a-tag color="success">成功标签</a-tag>
                  <a-tag color="warning">警告标签</a-tag>
                  <a-tag color="error">错误标签</a-tag>
                  <div class="preview-text">
                    主要文字颜色
                  </div>
                  <div class="preview-bg">
                    背景色预览
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="components" tab="业务组件">
        <div class="components-layout">
          <div class="components-nav" :style="{ width: businessNavWidth + 'px' }">
            <a-menu
              :selectedKeys="[selectedBusinessComponent]"
              mode="inline"
              theme="light"
              @click="({ key }) => selectedBusinessComponent = key as string"
            >
              <a-menu-item-group
                v-for="group in businessComponentGroups"
                :key="group.key"
                :title="group.name"
              >
                <a-menu-item
                  v-for="comp in getBusinessComponentsByGroup(group.key)"
                  :key="comp.key"
                >
                  {{ comp.name }}
                </a-menu-item>
              </a-menu-item-group>
            </a-menu>
          </div>
          <div class="components-content">
            <div v-if="selectedBusinessComponent === 'action-cell'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <ActionCell 
                  :buttons="demoButtons" 
                  :max-visible="demoMaxVisible"
                  @click="handleActionClick"
                />
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>{{ getActionCellCode() }}</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'icon-select'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <IconSelect v-model:value="selectedIcon" placeholder="请选择图标" />
                <div class="selected-icon-display" v-if="selectedIcon">
                  选中图标：<strong>{{ selectedIcon }}</strong>
                </div>
              </div>

              <div class="demo-section">
                <h4>使用示例</h4>
                <pre>&lt;IconSelect v-model:value="selectedIcon" placeholder="请选择图标" /&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'filter-form'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <FilterForm 
                  :filters="filterConfig"
                  @search="handleFilterSearch"
                  @reset="handleFilterReset"
                />
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'label-item'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <div class="label-item">
                  <div class="label-left">{{ demoLabelZh }}</div>
                  <div class="label-center">
                    <span class="zh-name">{{ demoContentZh }}</span>
                    <span class="separator" v-if="demoContentEn"> / </span>
                    <span class="en-name" v-if="demoContentEn">{{ demoContentEn }}</span>
                  </div>
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;div class="label-item"&gt;
  &lt;div class="label-left"&gt;材料名称&lt;/div&gt;
  &lt;div class="label-center"&gt;
    &lt;span class="zh-name"&gt;不锈钢板&lt;/span&gt;
    &lt;span class="separator"&gt; / &lt;/span&gt;
    &lt;span class="en-name"&gt;Stainless Steel Plate&lt;/span&gt;
  &lt;/div&gt;
&lt;/div&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'accessibility-checker'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <div style="width: 560px;">
                  <AccessibilityChecker
                    token-name="primary-5"
                    color="#F95914"
                  />
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;AccessibilityChecker
  token-name="primary-5"
  color="#F95914"
/&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'page-title'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <PageTitle 
                  :title="demoPageTitle" 
                  :showBack="showPageTitleBack"
                >
                  <template #titleSuffix>
                    <template v-if="showPageTitleSuffix">
                      <a-tag color="blue">{{ demoPageTitleSuffix }}</a-tag>
                    </template>
                  </template>
                  <template #actions>
                    <template v-if="showPageTitleActions">
                      <a-button>返回</a-button>
                      <a-button type="primary">保存</a-button>
                    </template>
                  </template>
                </PageTitle>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;PageTitle title="页面标题"&gt;
  &lt;template #actions&gt;
    &lt;a-button&gt;次要操作&lt;/a-button&gt;
    &lt;a-button type="primary"&gt;主要操作&lt;/a-button&gt;
  &lt;/template&gt;
&lt;/PageTitle&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'color-scale'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <div style="width: 600px;">
                  <ColorScale 
                    label="主色 primary"
                    :base-color="'#F95914'"
                    :colors="[]"
                    :highlight-index="5"
                    token-prefix="primary"
                  />
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;ColorScale 
  label="主色 primary"
  :base-color="'#F95914'"
  :colors="[]"
  :highlight-index="5"
  token-prefix="primary"
/&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'filter-options-drawer'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <a-button @click="showFilterDrawer = true">打开抽屉</a-button>
                <FilterOptionsDrawer
                  v-model:open="showFilterDrawer"
                  :options="filterDrawerOptions"
                  @save="handleFilterDrawerSave"
                />
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;FilterOptionsDrawer
  v-model:open="showDrawer"
  :options="filterOptions"
  @save="handleSave"
/&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'column-settings-panel'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <ColumnSettingsPanel
                  :fields="columnFields"
                  :default-fields="columnFields"
                  @confirm="handleColumnConfirm"
                >
                  <a-button>列设置</a-button>
                </ColumnSettingsPanel>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;ColumnSettingsPanel
  :fields="columnFields"
  :default-fields="defaultFields"
  @confirm="handleConfirm"
&gt;
  &lt;a-button&gt;列设置&lt;/a-button&gt;
&lt;/ColumnSettingsPanel&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'list-page-template'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>说明</h4>
                <p style="color: var(--color-text-secondary);">列表页模板，提供筛选、表格、分页等完整功能组合。</p>
                <p style="color: var(--color-text-secondary);">包含视图选择、视图保存、视图管理等功能。</p>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'smart-list-template'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
              </div>
              <div class="demo-section">
                <div class="smart-list-demo">
                  <SmartListTemplate
                    title="材料列表"
                    :fields="smartListFields"
                    :data-source="smartListData"
                    :loading="smartListLoading"
                    :pagination="smartListPagination"
                  >
                    <template #toolbar-actions>
                      <a-space :size="12">
                        <a-button type="primary" @click="message.info('点击了新增')">新增</a-button>
                        <ColumnSettingsPanel
                          :fields="smartListColumnFields"
                          :default-fields="smartListColumnFields"
                          :exclude-keys="['action']"
                          @confirm="handleSmartListColumnConfirm"
                        >
                          <a-button style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                            <template #icon>
                              <svg viewBox="0 0 48 48" style="width: 16px; height: 16px"><use href="#setting" /></svg>
                            </template>
                          </a-button>
                        </ColumnSettingsPanel>
                      </a-space>
                    </template>
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'status'">
                        <a-tag :color="record.status === 'pending' ? 'orange' : record.status === 'approved' ? 'green' : 'red'">
                          {{ record.statusText }}
                        </a-tag>
                      </template>
                      <template v-else-if="column.key === 'action'">
                        <ActionCell
                          :buttons="[
                            { key: 'edit', label: '编辑', onClick: () => message.info('编辑 ' + record.id) },
                            { key: 'delete', label: '删除', danger: true, onClick: () => message.info('删除 ' + record.id) },
                          ]"
                        />
                      </template>
                    </template>
                  </SmartListTemplate>
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;SmartListTemplate
  title="材料列表"
  :fields="fields"
  :data-source="data"
  :loading="loading"
  :pagination="pagination"
&gt;
  &lt;template #toolbar-actions&gt;
    &lt;a-button type="primary"&gt;新增&lt;/a-button&gt;
  &lt;/template&gt;
  &lt;template #bodyCell="{ column, record }"&gt;
    ...
  &lt;/template&gt;
&lt;/SmartListTemplate&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'section-title'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <SectionTitle :title="demoSectionTitle" />
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;SectionTitle title="基础信息" /&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'base-info-form'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <div style="background: var(--color-bg-container); padding: 16px; border-radius: 8px;">
                  <BaseInfoForm
                    v-model="demoBaseInfoFormData"
                    :fields="demoBaseInfoFields"
                    layout="horizontal"
                    @fieldChange="handleBaseInfoFieldChange"
                  />
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;BaseInfoForm
  v-model="formData"
  :fields="fields"
  layout="horizontal"
  @fieldChange="handleFieldChange"
/&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'form-footer-actions'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <div style="position: relative; height: 80px; background: var(--color-bg-container); border-radius: 8px; overflow: hidden;">
                  <FormFooterActions
                    :submitLoading="demoFooterSubmitLoading"
                    @submit="handleDemoFooterSubmit"
                    @cancel="handleDemoFooterCancel"
                  />
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;FormFooterActions
  :submitLoading="submitLoading"
  @submit="handleSubmit"
  @cancel="handleCancel"
/&gt;</pre>
              </div>
            </div>

            <div v-if="selectedBusinessComponent === 'form-page-template'" class="component-demo">
              <div class="demo-section">
                <h3 class="component-title">{{ currentBusinessName }}</h3>
                <div class="component-update-time">更新时间：{{ getUpdateTime(selectedBusinessComponent) }}</div>
                <h4>基本用法</h4>
                <div style="min-height: 400px; background: var(--color-bg-lighter, #F5F5F5); border-radius: 4px; overflow: hidden;">
                  <FormPageTemplate
                    :title="demoPageTitle"
                    :show-back="demoShowBack"
                    :loading="demoDomainPageLoading"
                    :submit-loading="demoDomainSubmitLoading"
                    :show-footer="demoShowFooter"
                    :footer-position="demoFooterPosition"
                    @submit="handleDemoDomainSubmit"
                    @cancel="handleDemoDomainCancel"
                  >
                    <div>
                      <SectionTitle title="基础信息" />
                      <BaseInfoForm
                        v-model="demoFormData"
                        :fields="demoFormFields"
                        layout="horizontal"
                      />
                      <SectionTitle title="关联材料" />
                      <BaseInfoForm
                        v-model="demoMaterialFormData"
                        :fields="demoMaterialFormFields"
                        layout="horizontal"
                      />
                    </div>
                  </FormPageTemplate>
                </div>
              </div>

              <div class="demo-code">
                <h4>使用示例</h4>
                <pre>&lt;FormPageTemplate
  title="编辑域"
  :show-back="true"
  back-path="/domain-manage"
  :loading="loading"
  :submit-loading="submitLoading"
  :show-footer="true"
  footer-position="fixed"
  @submit="handleSubmit"
  @cancel="handleCancel"
&gt;
  &lt;div class="form-section"&gt;
    &lt;SectionTitle title="基础信息" /&gt;
    &lt;BaseInfoForm
      v-model="formData"
      :fields="fields"
      layout="horizontal"
    /&gt;
  &lt;/div&gt;
&lt;/FormPageTemplate&gt;</pre>
              </div>
            </div>
          </div>
          <div class="components-divider" @mousedown="startTokensDrag">
            <div class="drag-handle"></div>
          </div>
          <div class="components-tokens" :style="{ width: tokensWidth + 'px' }">
            <a-tabs v-model:activeKey="businessTokenTabKey" size="small">
              <a-tab-pane key="config" tab="配置">
                <div v-if="selectedBusinessComponent === 'action-cell'" class="config-panel">
                  <a-form layout="vertical">
                    <a-form-item label="最大可见按钮数">
                      <a-select v-model:value="demoMaxVisible">
                        <a-select-option :value="1">1</a-select-option>
                        <a-select-option :value="2">2</a-select-option>
                        <a-select-option :value="3">3</a-select-option>
                        <a-select-option :value="4">4</a-select-option>
                        <a-select-option :value="5">5</a-select-option>
                      </a-select>
                    </a-form-item>
                    <a-form-item label="按钮配置">
                      <a-button type="dashed" @click="addDemoButton">+ 添加按钮</a-button>
                      <div v-for="(btn, idx) in demoButtons" :key="idx" class="button-config" style="margin-top: 8px;">
                        <div class="button-config-row">
                          <a-input v-model:value="btn.label" placeholder="按钮文字" style="flex: 1;" />
                        </div>
                        <div class="button-config-row" style="margin-top: 4px;">
                          <a-switch v-model:checked="btn.confirm" checked-children="确认" un-checked-children="无" />
                          <a-button type="link" danger @click="removeDemoButton(idx)">删除</a-button>
                        </div>
                      </div>
                    </a-form-item>
                  </a-form>
                </div>
                <div v-else-if="selectedBusinessComponent === 'label-item'" class="config-panel">
                  <a-form layout="vertical">
                    <a-form-item label="左侧中文">
                      <a-input v-model:value="demoLabelZh" placeholder="请输入中文名称" />
                    </a-form-item>
                    <a-form-item label="中间中文">
                      <a-input v-model:value="demoContentZh" placeholder="请输入内容中文" />
                    </a-form-item>
                    <a-form-item label="中间英文">
                      <a-input v-model:value="demoContentEn" placeholder="请输入英文名称" />
                    </a-form-item>
                  </a-form>
                </div>
                <div v-else-if="selectedBusinessComponent === 'page-title'" class="config-panel">
                  <a-form layout="vertical">
                    <a-form-item label="标题文本">
                      <a-input v-model:value="demoPageTitle" placeholder="请输入页面标题" />
                    </a-form-item>
                    <a-form-item label="显示返回区域">
                      <a-switch v-model:checked="showPageTitleBack" />
                    </a-form-item>
                    <a-form-item label="显示标题后缀">
                      <a-switch v-model:checked="showPageTitleSuffix" />
                    </a-form-item>
                    <a-form-item label="标题后缀文本" v-if="showPageTitleSuffix">
                      <a-input v-model:value="demoPageTitleSuffix" placeholder="请输入标题后缀" />
                    </a-form-item>
                    <a-form-item label="显示操作按钮">
                      <a-switch v-model:checked="showPageTitleActions" />
                    </a-form-item>
                  </a-form>
                </div>
                <div v-else-if="selectedBusinessComponent === 'section-title'" class="config-panel">
                  <a-form layout="vertical">
                    <a-form-item label="标题文本">
                      <a-input v-model:value="demoSectionTitle" placeholder="请输入标题" />
                    </a-form-item>
                  </a-form>
                </div>
                <div v-else-if="selectedBusinessComponent === 'form-page-template'" class="config-panel">
                  <a-form layout="vertical">
                    <a-form-item label="页面标题">
                      <a-input v-model:value="demoPageTitle" placeholder="请输入页面标题" />
                    </a-form-item>
                    <a-form-item label="显示返回按钮">
                      <a-switch v-model:checked="demoShowBack" />
                    </a-form-item>
                    <a-form-item label="显示底部操作栏">
                      <a-switch v-model:checked="demoShowFooter" />
                    </a-form-item>
                    <a-form-item label="底部操作栏位置">
                      <a-select v-model:value="demoFooterPosition">
                        <a-select-option value="fixed">固定在底部</a-select-option>
                        <a-select-option value="static">跟随内容</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-form>
                </div>
                <div v-else class="tokens-empty">暂无配置项</div>
              </a-tab-pane>
              <a-tab-pane key="color" tab="颜色">
                <div v-if="businessColorTokens.length > 0" class="tokens-list">
                  <div v-for="token in businessColorTokens" :key="token.token" class="token-item">
                    <div class="token-color-preview" :style="{ backgroundColor: `var(${token.token})` }"></div>
                    <div class="token-info">
                      <div class="token-name">{{ token.name }}</div>
                      <div class="token-key">{{ token.token }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="tokens-empty">暂无该类型 Token</div>
              </a-tab-pane>
              <a-tab-pane key="number" tab="数值">
                <div v-if="businessNumberTokens.length > 0" class="tokens-list">
                  <div v-for="token in businessNumberTokens" :key="token.token" class="token-item">
                    <div class="token-number-preview">{{ getTokenValue(token.token) }}</div>
                    <div class="token-info">
                      <div class="token-name">{{ token.name }}</div>
                      <div class="token-key">{{ token.token }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="tokens-empty">暂无该类型 Token</div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="antd-components" tab="基础组件">
        <div class="components-layout">
          <div class="components-nav" :style="{ width: navWidth + 'px' }">
            <a-menu
              :selectedKeys="[selectedBaseComponent]"
              mode="inline"
              theme="light"
              @click="({ key }) => selectedBaseComponent = key as string"
            >
              <a-menu-item-group 
                v-for="group in baseComponentGroups" 
                :key="group.key"
                :title="group.name"
              >
                <a-menu-item 
                  v-for="comp in getBaseComponentsByGroup(group.key)" 
                  :key="comp.key"
                >
                  {{ comp.label }}
                </a-menu-item>
              </a-menu-item-group>
            </a-menu>
          </div>
          <div class="components-content">
            <div v-if="selectedBaseComponent === 'buttons'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">主要按钮</div>
              <div class="button-group">
                <a-button type="primary">Primary</a-button>
                <a-button type="primary" disabled>Primary (Disabled)</a-button>
                <a-button type="primary" loading>Loading</a-button>
                <a-button type="primary" size="large">Large</a-button>
                <a-button type="primary" size="small">Small</a-button>
              </div>

              <div class="component-section-title">默认按钮</div>
              <div class="button-group">
                <a-button>Default</a-button>
                <a-button disabled>Default (Disabled)</a-button>
                <a-button loading>Loading</a-button>
              </div>

              <div class="component-section-title">危险按钮</div>
              <div class="button-group">
                <a-button danger>危险按钮</a-button>
                <a-button danger disabled>危险按钮 (禁用)</a-button>
              </div>

              <div class="component-section-title">文字按钮</div>
              <div class="button-group">
                <a-button type="text">文字按钮</a-button>
                <a-button type="link">链接按钮</a-button>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'inputs'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本输入框</div>
              <div class="input-group">
                <a-input v-model:value="inputValue" placeholder="请输入内容" />
              </div>

              <div class="component-section-title">文本域</div>
              <div class="input-group">
                <a-textarea v-model:value="textareaValue" placeholder="请输入多行文本" :rows="4" />
              </div>

              <div class="component-section-title">数字输入框</div>
              <div class="input-group">
                <a-input-number v-model:value="numberValue" :min="1" :max="100" />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'selects'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本选择器</div>
              <div class="select-group">
                <GlobalSelect 
                  v-model:value="selectedValue"
                  :options="selectOptions"
                  placeholder="请选择"
                />
              </div>

              <div class="component-section-title">多选模式</div>
              <div class="select-group">
                <GlobalSelect 
                  v-model:value="multiSelectedValue"
                  :options="selectOptions"
                  mode="multiple"
                  placeholder="多选"
                />
              </div>

              <div class="component-section-title">可搜索模式</div>
              <div class="select-group">
                <GlobalSelect 
                  v-model:value="searchSelectedValue"
                  :options="selectOptions"
                  show-search
                  placeholder="可搜索"
                />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'tables'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本表格</div>
              <a-table :columns="tableColumns" :data-source="tableData" :pagination="false" size="small" row-key="key">
                <template #bodyCell="{ column }">
                  <template v-if="column.key === 'action'">
                    <a :style="{ color: 'var(--primary-color)' }">操作</a>
                  </template>
                </template>
              </a-table>
            </div>

            <div v-if="selectedBaseComponent === 'tags'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本标签</div>
              <div class="tag-group">
                <a-tag>标签一</a-tag>
                <a-tag color="blue">蓝色标签</a-tag>
                <a-tag color="green">绿色标签</a-tag>
                <a-tag color="orange">橙色标签</a-tag>
                <a-tag color="red">红色标签</a-tag>
                <a-tag color="purple">紫色标签</a-tag>
              </div>

              <div class="component-section-title">状态标签</div>
              <div class="tag-group">
                <a-tag class="status-tag success">成功</a-tag>
                <a-tag class="status-tag warning">警告</a-tag>
                <a-tag class="status-tag error">错误</a-tag>
                <a-tag class="status-tag info">信息</a-tag>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'forms'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本表单</div>
              <div class="form-group">
                <a-form :model="formState" layout="vertical" style="max-width: 600px">
                  <a-form-item label="用户名" name="username">
                    <a-input v-model:value="formState.username" placeholder="请输入用户名" />
                  </a-form-item>
                  <a-form-item label="邮箱" name="email">
                    <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
                  </a-form-item>
                  <a-form-item label="密码" name="password">
                    <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
                  </a-form-item>
                  <a-form-item>
                    <a-space>
                      <a-button type="primary" @click="handleFormSubmit">提交</a-button>
                      <a-button @click="handleFormReset">重置</a-button>
                    </a-space>
                  </a-form-item>
                </a-form>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'datepicker'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本日期选择</div>
              <div class="datepicker-group">
                <a-date-picker v-model:value="dateValue" placeholder="选择日期" />
              </div>

              <div class="component-section-title">日期范围选择</div>
              <div class="datepicker-group">
                <a-range-picker v-model:value="dateRangeValue" />
              </div>

              <div class="component-section-title">月份选择</div>
              <div class="datepicker-group">
                <a-month-picker v-model:value="monthValue" placeholder="选择月份" />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'modal'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本模态框</div>
              <div class="modal-group">
                <a-button type="primary" @click="showModal = true">打开模态框</a-button>
              </div>
              <a-modal v-model:open="showModal" title="基本模态框" @ok="showModal = false">
                <p>这是一个基本的模态框组件。</p>
                <p>可以包含表单、列表等复杂内容。</p>
              </a-modal>

              <div class="component-section-title">确认对话框</div>
              <div class="modal-group">
                <a-popconfirm title="确定要删除吗?" @confirm="() => {}">
                  <a-button danger>删除</a-button>
                </a-popconfirm>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'drawer'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本抽屉</div>
              <div class="drawer-group">
                <a-button type="primary" @click="showDrawer = true">打开抽屉</a-button>
              </div>
              <a-drawer v-model:open="showDrawer" title="基本抽屉" placement="right" width="400" @close="showDrawer = false">
                <p>这是一个从右侧滑出的抽屉组件。</p>
                <p>常用于详情查看、表单编辑等场景。</p>
              </a-drawer>
            </div>

            <div v-if="selectedBaseComponent === 'tooltip'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本文字提示</div>
              <div class="tooltip-group">
                <a-tooltip title="这是提示文字">
                  <a-button>鼠标悬停显示提示</a-button>
                </a-tooltip>
                <a-tooltip title="提示内容在右边" placement="right">
                  <a-button>右侧提示</a-button>
                </a-tooltip>
                <a-tooltip title="提示内容在左边" placement="left">
                  <a-button>左侧提示</a-button>
                </a-tooltip>
              </div>

              <div class="component-section-title">图标提示</div>
              <div class="tooltip-group">
                <a-tooltip title="删除操作">
                  <a-button type="text" danger>
                    <template #icon><svg style="width: 16px; height: 16px;"><use href="#delete"></use></svg></template>
                  </a-button>
                </a-tooltip>
                <a-tooltip title="编辑操作">
                  <a-button type="text">
                    <template #icon><svg style="width: 16px; height: 16px;"><use href="#edit"></use></svg></template>
                  </a-button>
                </a-tooltip>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'switch'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本开关</div>
              <div class="switch-group">
                <a-switch v-model:checked="switchChecked" />
                <a-switch v-model:checked="switchChecked" disabled />
              </div>

              <div class="component-section-title">开关状态</div>
              <div class="switch-group">
                <a-switch v-model:checked="switchOn" />
                <span style="margin-left: 8px;">{{ switchOn ? '开启' : '关闭' }}</span>
              </div>

              <div class="component-section-title">不同尺寸</div>
              <div class="switch-group">
                <a-switch size="small" />
                <a-switch />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'checkbox'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本多选框</div>
              <div class="checkbox-group">
                <a-checkbox v-model:checked="checkboxChecked">选项一</a-checkbox>
                <a-checkbox v-model:checked="checkboxChecked2">选项二</a-checkbox>
                <a-checkbox v-model:checked="checkboxChecked3" disabled>禁用选项</a-checkbox>
              </div>

              <div class="component-section-title">多选框组</div>
              <div class="checkbox-group">
                <a-checkbox-group v-model:value="checkedList" :options="checkboxOptions" />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'radio'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">按钮风格单选框</div>
              <div class="radio-group">
                <a-radio-group v-model:value="radioValue">
                  <a-radio-button value="a">选项一</a-radio-button>
                  <a-radio-button value="b">选项二</a-radio-button>
                  <a-radio-button value="c">选项三</a-radio-button>
                  <a-radio-button value="d" disabled>禁用</a-radio-button>
                </a-radio-group>
              </div>

              <div class="component-section-title">基本单选框</div>
              <div class="radio-group">
                <a-radio-group v-model:value="radioValue">
                  <a-radio value="option1">选项一</a-radio>
                  <a-radio value="option2">选项二</a-radio>
                  <a-radio value="option3" disabled>禁用选项</a-radio>
                </a-radio-group>
              </div>

              <div class="component-section-title">单选框组</div>
              <div class="radio-group">
                <a-radio-group v-model:value="radioValue" :options="radioOptions" />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'badge'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本徽标</div>
              <div class="badge-group">
                <a-badge :count="5">
                  <a-button>新消息</a-button>
                </a-badge>
                <a-badge :count="99">
                  <a-button>通知</a-button>
                </a-badge>
                <a-badge :count="100">
                  <a-button>消息</a-button>
                </a-badge>
              </div>

              <div class="component-section-title">状态徽标</div>
              <div class="badge-group">
                <a-badge status="success" text="成功" />
                <a-badge status="warning" text="警告" />
                <a-badge status="error" text="错误" />
                <a-badge status="default" text="默认" />
                <a-badge status="processing" text="进行中" />
              </div>

              <div class="component-section-title">圆点徽标</div>
              <div class="badge-group">
                <a-badge dot>
                  <a-button type="text">通知</a-button>
                </a-badge>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'progress'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">线性进度条</div>
              <div class="progress-group">
                <a-progress :percent="30" />
                <a-progress :percent="50" status="active" />
                <a-progress :percent="70" status="exception" />
                <a-progress :percent="100" status="success" />
              </div>

              <div class="component-section-title">不同尺寸</div>
              <div class="progress-group">
                <a-progress :percent="60" size="small" />
                <a-progress :percent="60" size="default" />
              </div>

              <div class="component-section-title">圆形进度</div>
              <div class="progress-group">
                <a-progress type="circle" :percent="75" />
                <a-progress type="circle" :percent="70" status="exception" />
                <a-progress type="circle" :percent="100" status="success" />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'alert'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本警告提示</div>
              <div class="alert-group">
                <a-alert message="信息提示" type="info" show-icon />
                <a-alert message="操作成功" description="这是一条成功提示" type="success" show-icon />
                <a-alert message="警告提示" description="这是一条警告提示" type="warning" show-icon />
                <a-alert message="错误提示" description="这是一条错误提示" type="error" show-icon />
              </div>

              <div class="component-section-title">可关闭</div>
              <div class="alert-group">
                <a-alert message="可关闭的提示" type="info" closable show-icon />
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'collapse'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本折叠面板</div>
              <div class="collapse-group">
                <a-collapse v-model:activeKey="collapseActiveKey">
                  <a-collapse-panel key="1" header="第一项内容">
                    <p>这是第一项的折叠内容。可以包含任意内容。</p>
                  </a-collapse-panel>
                  <a-collapse-panel key="2" header="第二项内容">
                    <p>这是第二项的折叠内容。</p>
                  </a-collapse-panel>
                  <a-collapse-panel key="3" header="第三项内容">
                    <p>这是第三项的折叠内容。</p>
                  </a-collapse-panel>
                </a-collapse>
              </div>

              <div class="component-section-title">手风琴模式</div>
              <div class="collapse-group">
                <a-collapse v-model:activeKey="accordionActiveKey" accordion>
                  <a-collapse-panel key="1" header="第一项">
                    <p>手风琴模式下，同时只能展开一项。</p>
                  </a-collapse-panel>
                  <a-collapse-panel key="2" header="第二项">
                    <p>点击其他项会收起当前项。</p>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </div>

            <div v-if="selectedBaseComponent === 'tabs'" class="component-section">
              <div class="component-name">{{ currentBaseName }}</div>
              <div class="component-section-title">基本标签页</div>
              <div class="tabs-demo">
                <a-tabs v-model:activeKey="demoTabKey">
                  <a-tab-pane key="1" tab="标签一">标签一的内容</a-tab-pane>
                  <a-tab-pane key="2" tab="标签二">标签二的内容</a-tab-pane>
                  <a-tab-pane key="3" tab="标签三">标签三的内容</a-tab-pane>
                </a-tabs>
              </div>

              <div class="component-section-title">卡片式标签页</div>
              <div class="tabs-demo">
                <a-tabs v-model:activeKey="demoTabKey2" type="card">
                  <a-tab-pane key="1" tab="卡片一">卡片一的内容</a-tab-pane>
                  <a-tab-pane key="2" tab="卡片二">卡片二的内容</a-tab-pane>
                  <a-tab-pane key="3" tab="卡片三">卡片三的内容</a-tab-pane>
                </a-tabs>
              </div>
            </div>
          </div>
          <div class="components-divider" @mousedown="startTokensDrag">
            <div class="drag-handle"></div>
          </div>
          <div class="components-tokens" :style="{ width: tokensWidth + 'px' }">
            <a-tabs v-model:activeKey="tokenTabKey" size="small">
              <a-tab-pane key="color" tab="颜色">
                <div v-if="colorTokens.length > 0" class="tokens-list">
                  <div v-for="token in colorTokens" :key="token.token" class="token-item">
                    <div class="token-color-preview" :style="{ backgroundColor: `var(${token.token})` }"></div>
                    <div class="token-info">
                      <div class="token-name">{{ token.name }}</div>
                      <div class="token-key">{{ token.token }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="tokens-empty">暂无该类型 Token</div>
              </a-tab-pane>
              <a-tab-pane key="number" tab="数值">
                <div v-if="numberTokens.length > 0" class="tokens-list">
                  <div v-for="token in numberTokens" :key="token.token" class="token-item">
                    <div class="token-number-preview">{{ getTokenValue(token.token) }}</div>
                    <div class="token-info">
                      <div class="token-name">{{ token.name }}</div>
                      <div class="token-key">{{ token.token }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="tokens-empty">暂无该类型 Token</div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { useDesignTokens } from '@/composables/useDesignTokens'
import ActionCell from '@/components/ActionCell.vue'
import IconSelect from '@/components/IconSelect.vue'
import GlobalSelect from '@/components/GlobalSelect.vue'
import FilterForm from '@/components/FilterForm.vue'
import PageTitle from '@/components/PageTitle.vue'
import ColorScale from '@/components/ColorScale.vue'
import AccessibilityChecker from '@/components/AccessibilityChecker.vue'
import ColumnSettingsPanel from '@/components/ColumnSettingsPanel.vue'
import FilterOptionsDrawer from '@/components/FilterOptionsDrawer.vue'
import SmartListTemplate from '@/components/SmartListTemplate.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import BaseInfoForm from '@/components/BaseInfoForm.vue'
import FormFooterActions from '@/components/FormFooterActions.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'

const { 
  tokens, 
  categories, 
  loading,
  loadTokens, 
  updateToken, 
  saveAndApply,
  resetToDefault 
} = useDesignTokens()

const activeTab = ref('tokens')
const activeTokenCollapse = ref(['color'])
const activeComponentCollapse = ref(['action-cell'])
const activeAntdCollapse = ref(['buttons'])
const applying = ref(false)

const isTraeBrowser = navigator.userAgent.includes('Trae')

const getDefaultCategory = () => {
  return 'base-color'
}

const selectedCategory = ref(getDefaultCategory())

const sortedCategories = computed(() => {
  const nameMap: Record<string, string> = {
    'border': '圆角'
  }
  return [...categories.value]
    .filter(c => c.code !== 'custom')
    .map(c => ({
      ...c,
      name: nameMap[c.code] || c.name
    }))
    .sort((a, b) => {
      if (a.code === 'base-color') return -1
      if (b.code === 'base-color') return 1
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    })
})

watch([categories, selectedCategory], ([cats, selected]) => {
  if (cats.length > 0 && !selected) {
    const sorted = sortedCategories.value
    selectedCategory.value = sorted[0]?.code || ''
    localStorage.setItem('selectedCategory', sorted[0]?.code || '')
  }
}, { immediate: true })

watch(categories, (cats) => {
  if (cats.length > 0 && selectedCategory.value === 'base-color') {
    const groups = getTokensGrouped('base-color')
    const primaryGroup = groups.find((g: any) => getColorScalePrefix(g) === 'primary')
    const primaryColors = primaryGroup ? getColorScaleColors(primaryGroup.items) : []
    const tokenName = 'primary-5'
    const token = tokens.value.find((t: any) => {
      const key = t.tokenKey.replace(/^--/, '')
      return key === tokenName || t.tokenKey === tokenName
    })
    
    selectedColorInfo.value = {
      index: 5,
      color: token?.currentValue || primaryColors[5] || '#F95914',
      tokenName,
      groupKey: 'primary'
    }
    selectedGroupKey.value = 'primary'
    
    if (token?.customValue) {
      colorType.value = 'custom'
      customColor.value = token.customValue
    } else {
      colorType.value = 'auto'
      customColor.value = token?.currentValue || primaryColors[5] || '#F95914'
    }
  }
}, { immediate: true })

watch(selectedCategory, (newVal) => {
  localStorage.setItem('selectedCategory', newVal)
  if (newVal !== 'base-color') {
    selectedColorInfo.value = null
    const categoryTokens = tokens.value.filter((t: any) => t.categoryCode === newVal)
    if (categoryTokens.length > 0) {
      selectedTokenId.value = categoryTokens[0].id
    }
  } else {
    selectedTokenId.value = null
  }
})

const selectedColorInfo = ref<{
  index: number
  color: string
  tokenName: string
  groupKey: string
} | null>(null)

const selectedGroupKey = ref('')
const selectedTokenId = ref<number | null>(null)

const selectedTokenInfo = computed(() => {
  if (!selectedTokenId.value) return null
  return tokens.value.find((t: any) => t.id === selectedTokenId.value) || null
})

watch(selectedTokenInfo, (token) => {
  if (!token) return
  const key = token.tokenKey.toLowerCase()
  if (key.includes('success')) {
    selectedBaseColorScale.value = 'green'
  } else if (key.includes('warning')) {
    selectedBaseColorScale.value = 'orange'
  } else if (key.includes('error') || key.includes('danger')) {
    selectedBaseColorScale.value = 'red'
  } else if (key.includes('info')) {
    selectedBaseColorScale.value = 'blue'
  } else if (key.includes('text')) {
    selectedBaseColorScale.value = 'gray'
  } else if (key.includes('primary')) {
    selectedBaseColorScale.value = 'primary'
  } else {
    selectedBaseColorScale.value = 'primary'
  }
})

const colorType = ref<'auto' | 'custom'>('auto')
const compareColor = ref('white')
const customColor = ref('')
const isEditingColor = ref(false)

const compareColorMap: Record<string, string> = {
  'white': '#ffffff',
  'black': '#000000'
}

const compareColor2 = ref('white')
const compareColorMap2: Record<string, string> = {
  'white': '#ffffff',
  'black': '#000000'
}

const colorOpacity = ref(100)

const colorRelatedBaseTokens = computed(() => {
  if (!selectedTokenInfo.value) return []
  const currentValue = selectedTokenInfo.value.currentValue
  const currentId = selectedTokenInfo.value.id
  return tokens.value.filter((t: any) => {
    if (t.categoryCode !== 'base-color') return false
    if (t.id === currentId) return false
    return t.currentValue === currentValue
  })
})

const baseColorScaleOptions = [
  { label: '主色 primary', value: 'primary' },
  { label: '灰色 gray', value: 'gray' },
  { label: '绿色 green', value: 'green' },
  { label: '橙色 orange', value: 'orange' },
  { label: '红色 red', value: 'red' },
  { label: '蓝色 blue', value: 'blue' }
]

const selectedBaseColorScale = ref('primary')

const currentBaseColorScaleColors = computed(() => {
  const groups = getTokensGrouped('base-color')
  const targetGroup = groups.find((g: any) => getColorScalePrefix(g) === selectedBaseColorScale.value)
  if (!targetGroup) return []
  return getColorScaleColors(targetGroup.items)
})

const currentBaseColorScaleBase = computed(() => {
  const groups = getTokensGrouped('base-color')
  const targetGroup = groups.find((g: any) => getColorScalePrefix(g) === selectedBaseColorScale.value)
  if (!targetGroup) return '#F95914'
  return getColorScaleBase(targetGroup.items)
})

function getBaseColorByScale(scale: string): string {
  const groups = getTokensGrouped('base-color')
  const targetGroup = groups.find((g: any) => getColorScalePrefix(g) === scale)
  if (!targetGroup) return '#F95914'
  return getColorScaleBase(targetGroup.items)
}

const currentBaseColorScaleSelectedIndex = computed(() => {
  if (!selectedTokenInfo.value) return 5
  const currentValue = (selectedTokenInfo.value.currentValue || '').toUpperCase()
  const colors = currentBaseColorScaleColors.value
  const index = colors.indexOf(currentValue)
  return index >= 0 ? index : 5
})

const colorClassA11yResults = computed(() => {
  if (!selectedTokenInfo.value?.currentValue) return null
  const fgColor = selectedTokenInfo.value.currentValue
  const bgColor = compareColorMap2[compareColor2.value] || '#ffffff'

  const textOnBg = getApcaContrast(fgColor, bgColor)
  const bgOnText = getApcaContrast(bgColor, fgColor)
  const wcagRatio = getContrastRatio(fgColor, bgColor)

  return {
    textOnBg: { value: textOnBg, level: getApcaLevel(textOnBg) },
    bgOnText: { value: bgOnText, level: getApcaLevel(bgOnText) },
    wcagRatio,
    wcagLevel: getWcagLevel(wcagRatio)
  }
})

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return 0
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getWcagLevel(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA (large & UI components)'
  return 'Fail'
}

function getResultStyle(level: string): Record<string, string> {
  if (level === 'Fail' || level === 'Not recommended') {
    return { backgroundColor: 'var(--color-error-bg, #FFF2F0)' }
  }
  return { backgroundColor: 'var(--color-success-bg, #F6FFED)' }
}

function sRGBtoY(sRGB: number): number {
  if (sRGB <= 0.04045) return sRGB / 12.92
  return Math.pow((sRGB + 0.055) / 1.055, 2.4)
}

function getLuminanceApca(r: number, g: number, b: number): number {
  const rY = sRGBtoY(r / 255) * 0.2126729
  const gY = sRGBtoY(g / 255) * 0.7151522
  const bY = sRGBtoY(b / 255) * 0.0721750
  return rY + gY + bY
}

function getApcaContrast(txtColor: string, bgColor: string): number {
  const txtRgb = hexToRgb(txtColor)
  const bgRgb = hexToRgb(bgColor)
  if (!txtRgb || !bgRgb) return 0

  const txtY = getLuminanceApca(txtRgb.r, txtRgb.g, txtRgb.b)
  const bgY = getLuminanceApca(bgRgb.r, bgRgb.g, bgRgb.b)

  const normBG = Math.pow(bgY, 0.56)
  const normTXT = Math.pow(txtY, 0.57)

  if (bgY > txtY) {
    return (normBG - normTXT) * 1.14 * 100
  } else {
    return (normTXT - normBG) * 1.14 * 100 * -1
  }
}

function getApcaLevel(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 90) return 'Ok for text'
  if (absValue >= 75) return 'Ok for large text'
  if (absValue >= 60) return 'Ok for UI components'
  return 'Not recommended'
}

const apcaResults = computed(() => {
  if (!displayColor.value) return null
  const whiteBg = '#ffffff'
  const blackBg = '#000000'
  
  const textOnWhite = getApcaContrast(displayColor.value, whiteBg)
  const textOnBlack = getApcaContrast(displayColor.value, blackBg)
  const bgOnWhite = getApcaContrast(whiteBg, displayColor.value)
  const bgOnBlack = getApcaContrast(blackBg, displayColor.value)

  return {
    textOnWhite: { value: textOnWhite, level: getApcaLevel(textOnWhite) },
    textOnBlack: { value: textOnBlack, level: getApcaLevel(textOnBlack) },
    bgOnWhite: { value: bgOnWhite, level: getApcaLevel(bgOnWhite) },
    bgOnBlack: { value: bgOnBlack, level: getApcaLevel(bgOnBlack) }
  }
})

const contrastResults = computed(() => {
  if (!displayColor.value) return null
  const bgColor = compareColorMap[compareColor.value] || '#ffffff'
  const ratio = getContrastRatio(displayColor.value, bgColor)
  const ratioReverse = getContrastRatio(bgColor, displayColor.value)
  return {
    normal: ratio,
    normalLevel: getWcagLevel(ratio),
    reverse: ratioReverse,
    reverseLevel: getWcagLevel(ratioReverse)
  }
})

const displayColor = computed(() => {
  if (!selectedColorInfo.value) return ''
  if (colorType.value === 'custom') {
    return customColor.value || selectedColorInfo.value.color
  }
  return selectedColorInfo.value.color
})

const relatedTokens = computed(() => {
  if (!selectedColorInfo.value) return []
  const { groupKey, index } = selectedColorInfo.value
  const colorTokenMap: Record<string, { name: string; tokenKey: string; level: number }[]> = {
    'primary': [
      { name: 'primary', tokenKey: '--primary-color', level: 5 },
      { name: 'hover', tokenKey: '--primary-hover', level: 6 },
      { name: 'active', tokenKey: '--primary-active', level: 7 },
    ],
    'gray': [
      { name: 'text', tokenKey: '--color-text', level: 8 },
      { name: 'secondary', tokenKey: '--color-text-secondary', level: 6 },
    ],
    'green': [
      { name: 'success', tokenKey: '--color-success', level: 6 },
    ],
    'orange': [
      { name: 'warning', tokenKey: '--color-warning', level: 6 },
    ],
    'red': [
      { name: 'error', tokenKey: '--color-error', level: 6 },
    ],
    'blue': [
      { name: 'info', tokenKey: '--color-info', level: 6 },
    ],
  }
  const groupTokens = colorTokenMap[groupKey] || []
  return groupTokens.filter(t => t.level === index)
})

watch(colorType, (newVal, oldVal) => {
  if (newVal === 'custom' && selectedColorInfo.value) {
    const token = tokens.value.find((t: any) => {
      const match = t.tokenKey.match(/^--(\w+)-(\d+)$/)
      return match && match[1] === selectedColorInfo.value!.groupKey && parseInt(match[2]) === selectedColorInfo.value!.index
    })
    if (token?.customValue) {
      customColor.value = token.customValue
    } else {
      customColor.value = selectedColorInfo.value.color
    }
  }
  if (newVal === 'auto' && oldVal === 'custom' && selectedColorInfo.value) {
    const token = tokens.value.find((t: any) => {
      const match = t.tokenKey.match(/^--(\w+)-(\d+)$/)
      return match && match[1] === selectedColorInfo.value!.groupKey && parseInt(match[2]) === selectedColorInfo.value!.index
    })
    if (token) {
      token.currentValue = selectedColorInfo.value.color
    }
    customColor.value = ''
  }
})

watch(customColor, (newVal) => {
  if (colorType.value === 'custom' && selectedColorInfo.value && newVal) {
    const token = tokens.value.find((t: any) => {
      const match = t.tokenKey.match(/^--(\w+)-(\d+)$/)
      return match && match[1] === selectedColorInfo.value!.groupKey && parseInt(match[2]) === selectedColorInfo.value!.index
    })
    if (token) {
      token.currentValue = newVal
      token.customValue = newVal
    }
  }
})

watch(selectedColorInfo, (newVal) => {
  if (!newVal) return
  
  const token = tokens.value.find((t: any) => {
    const match = t.tokenKey.match(/^--(\w+)-(\d+)$/)
    return match && match[1] === newVal.groupKey && parseInt(match[2]) === newVal.index
  })
  
  if (token?.customValue) {
    colorType.value = 'custom'
    customColor.value = token.customValue
  } else {
    colorType.value = 'auto'
    customColor.value = newVal.color
  }
})

watch([selectedCategory, categories], ([cat, cats]) => {
  if (cat === 'base-color' && cats.length > 0) {
    const groups = getTokensGrouped('base-color')
    const primaryGroup = groups.find((g: any) => getColorScalePrefix(g) === 'primary')
    const primaryColors = primaryGroup ? getColorScaleColors(primaryGroup.items) : []
    const token = tokens.value.find((t: any) => {
      const match = t.tokenKey.match(/^--(\w+)-(\d+)$/)
      return match && match[1] === 'primary' && parseInt(match[2]) === 5
    })
    
    selectedColorInfo.value = {
      index: 5,
      color: primaryColors[5] || primaryColors[0] || '#F95914',
      tokenName: 'primary-5',
      groupKey: 'primary'
    }
    selectedGroupKey.value = 'primary'
    
    if (token?.customValue) {
      colorType.value = 'custom'
      customColor.value = token.customValue
    } else {
      colorType.value = 'auto'
      customColor.value = token?.currentValue || primaryColors[5] || '#F95914'
    }
  }
}, { immediate: true })

function handleTagClick(tokenKey: string) {
  navigator.clipboard.writeText(tokenKey).then(() => {
    message.success(`已复制: ${tokenKey}`)
  })
}

function handleColorScaleSelect(info: { index: number; color: string; tokenName: string; groupKey: string }) {
  selectedColorInfo.value = info
  selectedGroupKey.value = info.groupKey
  if (selectedTokenInfo.value) {
    selectedTokenInfo.value.currentValue = info.color
    updateToken(selectedTokenInfo.value.id, info.color)
  }
}

function getTokensByCategory(categoryCode: string) {
  return tokens.value.filter((t: any) => t.categoryCode === categoryCode)
}

function getTokensGrouped(categoryCode: string) {
  const categoryTokens = tokens.value.filter((t: any) => t.categoryCode === categoryCode)
  
  if (categoryCode === 'base-color') {
    const groups: Record<string, typeof categoryTokens> = {}
    for (const token of categoryTokens) {
      const group = token.description || '其他'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(token)
    }
    return Object.entries(groups).map(([name, items]) => ({ name, items }))
  }
  
  const groups: Record<string, typeof categoryTokens> = {}
  for (const token of categoryTokens) {
    let prefix = 'other'
    if (token.tokenKey.startsWith('--primary')) prefix = 'primary'
    else if (token.tokenKey.startsWith('--color-success')) prefix = 'color-success'
    else if (token.tokenKey.startsWith('--color-warning')) prefix = 'color-warning'
    else if (token.tokenKey.startsWith('--color-error')) prefix = 'color-error'
    else if (token.tokenKey.startsWith('--color-info')) prefix = 'color-info'
    else if (token.tokenKey.startsWith('--color-text')) prefix = 'color-text'
    else if (token.tokenKey.startsWith('--color-bg')) prefix = 'color-bg'
    else if (token.tokenKey.startsWith('--color-border')) prefix = 'color-border'
    
    if (!groups[prefix]) {
      groups[prefix] = []
    }
    groups[prefix].push(token)
  }
  
  const prefixNames: Record<string, string> = {
    'primary': '主色',
    'color-success': '成功色',
    'color-warning': '警告色',
    'color-error': '错误色',
    'color-info': '信息色',
    'color-text': '文本色',
    'color-bg': '背景色',
    'color-border': '边框色'
  }
  
  return Object.entries(groups).map(([prefix, items]) => ({ 
    name: prefixNames[prefix] || prefix, 
    items 
  }))
}

function isColorScaleGroup(group: any): boolean {
  if (group.items.length === 0) return false
  const firstToken = group.items[0]
  if (firstToken.categoryCode !== 'base-color') return false
  return firstToken.tokenKey && firstToken.tokenKey.match(/^--\w+-\d+$/)
}

function getColorScaleLabel(group: any): string {
  const prefix = getColorScalePrefix(group)
  const labelMap: Record<string, string> = {
    'primary': '主色 primary',
    'success': '成功色 success',
    'warning': '警告色 warning',
    'error': '错误色 error',
    'info': '信息色 info',
    'gray': '灰色 gray',
    'green': '绿色 green',
    'orange': '橙色 orange',
    'red': '红色 red',
    'blue': '蓝色 blue'
  }
  return labelMap[prefix] || prefix
}

function getColorScalePrefix(group: any): string {
  if (group.items.length === 0) return 'primary'
  const firstToken = group.items[0]
  const match = firstToken.tokenKey.match(/^--(\w+)-\d+$/)
  return match ? match[1] : 'primary'
}

function getColorScaleBase(tokens: any[]): string {
  if (tokens.length === 0) return '#F95914'
  const firstToken = tokens[0]
  const match = firstToken.tokenKey.match(/^--(\w+)-\d+$/)
  if (!match) return '#F95914'
  const prefix = match[1]
  const baseTokenKey = `--${prefix}-color`
  const baseToken = tokens.find((t: any) => t.tokenKey === baseTokenKey)
  if (baseToken) return baseToken.defaultValue
  const scaleTokens = tokens.filter(t => t.tokenKey && t.tokenKey.match(/^--\w+-\d+$/))
  const sortedTokens = [...scaleTokens].sort((a, b) => {
    const aNum = parseInt(a.tokenKey.match(/\d+$/)?.[0] || '0')
    const bNum = parseInt(b.tokenKey.match(/\d+$/)?.[0] || '0')
    return aNum - bNum
  })
  return sortedTokens[5]?.defaultValue || sortedTokens[0]?.defaultValue || '#F95914'
}

function getColorScaleColors(tokens: any[]): string[] {
  return tokens.map((t: any) => (t.currentValue || t.defaultValue || '').toUpperCase())
}

function getColorScaleCustomColors(tokens: any[]): (string | undefined)[] {
  return tokens.map((t: any) => t.customValue || undefined)
}

function handleTokenChange(token: any) {
  updateToken(token.id, token.currentValue)
}

async function handleApply() {
  applying.value = true
  try {
    await saveAndApply()
  } finally {
    applying.value = false
  }
}

async function handleReset() {
  await resetToDefault()
}

const demoMaxVisible = ref(2)
const selectedIcon = ref('')
const selectedValue = ref('')
const multiSelectedValue = ref([])
const searchSelectedValue = ref('')
const demoSectionTitle = ref('基础信息')

const demoBaseInfoFormData = ref({
  domainName: '',
  domainKey: '',
  status: 1,
  category: undefined as string | undefined,
  sortOrder: undefined as number | undefined,
  contact: '',
  phone: '',
  description: ''
})

const demoBaseInfoFields = [
  {
    name: 'domainName',
    label: '域名称',
    type: 'input' as const,
    required: true,
    rules: [
      { required: true, message: '请输入域名称', trigger: 'blur' },
      { max: 50, message: '域名称不能超过50个字符', trigger: 'blur' }
    ]
  },
  {
    name: 'domainKey',
    label: '域标识',
    type: 'input' as const,
    placeholder: '根据域名称自动生成',
    readonly: true
  },
  {
    name: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { value: 1, label: '启用' },
      { value: 0, label: '禁用' }
    ]
  },
  {
    name: 'category',
    label: '分类',
    type: 'select' as const,
    options: [
      { value: 'system', label: '系统域' },
      { value: 'business', label: '业务域' },
      { value: 'data', label: '数据域' }
    ]
  },
  {
    name: 'sortOrder',
    label: '排序',
    type: 'input-number' as const
  },
  {
    name: 'contact',
    label: '联系人',
    type: 'input' as const
  },
  {
    name: 'phone',
    label: '联系电话',
    type: 'input' as const,
    rules: [
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ]
  },
  {
    name: 'description',
    label: '描述',
    type: 'textarea' as const,
    rules: [
      { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
    ]
  }
]

const demoFooterSubmitLoading = ref(false)

function handleBaseInfoFieldChange(field: string, value: any) {
  if (field === 'domainName' && value) {
    demoBaseInfoFormData.value.domainKey = value.toLowerCase().replace(/\s+/g, '-')
  }
}

function handleDemoFooterSubmit() {
  demoFooterSubmitLoading.value = true
  setTimeout(() => {
    demoFooterSubmitLoading.value = false
    message.success('提交成功')
  }, 1000)
}

function handleDemoFooterCancel() {
  message.info('取消操作')
}

const demoShowBack = ref(true)
const demoShowFooter = ref(true)
const demoFooterPosition = ref<'fixed' | 'static'>('fixed')
const demoDomainPageLoading = ref(false)
const demoDomainSubmitLoading = ref(false)

const demoFormData = ref({
  name: '',
  code: '',
  status: undefined,
  description: '',
  type: undefined,
  sort: 0,
})

const demoFormFields = [
  { name: 'name', label: '名称', type: 'input' as const, required: true },
  { name: 'code', label: '编码', type: 'input' as const, required: true },
  { name: 'status', label: '状态', type: 'select' as const, options: [{ value: 1, label: '启用' }, { value: 0, label: '禁用' }] },
  { name: 'type', label: '类型', type: 'select' as const, options: [{ value: 'type1', label: '类型1' }, { value: 'type2', label: '类型2' }] },
  { name: 'sort', label: '排序', type: 'input-number' as const },
  { name: 'description', label: '描述', type: 'textarea' as const },
]

const demoMaterialFormData = ref({
  materialName: '',
  spec: '',
  quantity: undefined,
  unit: undefined,
})

const demoMaterialFormFields = [
  { name: 'materialName', label: '材料名称', type: 'input' as const, required: true },
  { name: 'spec', label: '规格', type: 'input' as const, required: true },
  { name: 'quantity', label: '数量', type: 'input-number' as const, required: true },
  { name: 'unit', label: '单位', type: 'select' as const, options: [{ value: 'ton', label: '吨' }, { value: 'meter', label: '米' }, { value: 'piece', label: '张' }] },
]

function handleDemoDomainSubmit() {
  demoDomainSubmitLoading.value = true
  setTimeout(() => {
    demoDomainSubmitLoading.value = false
    message.success('保存成功')
  }, 1000)
}

function handleDemoDomainCancel() {
  message.info('取消操作')
}

const demoPageTitle = ref('页面标题')
const showPageTitleActions = ref(true)
const showPageTitleBack = ref(true)
const showPageTitleSuffix = ref(false)
const demoPageTitleSuffix = ref('示例')

const businessComponents = [
  {
    key: 'icon-select',
    name: '图标选择器',
    enName: 'IconSelect',
    group: '基础',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  {
    key: 'filter-form',
    name: '筛选表单',
    enName: 'FilterForm',
    group: '筛选',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
    ]
  },
  {
    key: 'filter-options-drawer',
    name: '新增视图',
    enName: 'FilterOptionsDrawer',
    group: '筛选',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
    ]
  },
  {
    key: 'smart-list-template',
    name: '智能列表模板',
    enName: 'SmartListTemplate',
    group: '列表',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
    ]
  },
  {
    key: 'column-settings-panel',
    name: '列设置面板',
    enName: 'ColumnSettingsPanel',
    group: '列表',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  {
    key: 'list-page-template',
    name: '列表页模板',
    enName: 'ListPageTemplate',
    group: '列表',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
    ]
  },
  {
    key: 'action-cell',
    name: '操作按钮',
    enName: 'ActionCell',
    group: '列表',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '主色悬停', token: '--primary-hover', type: 'color' },
      { name: '成功色', token: '--color-success', type: 'color' },
    ]
  },
  {
    key: 'color-scale',
    name: '色阶',
    enName: 'ColorScale',
    group: '基础',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  {
    key: 'page-title',
    name: '页面标题',
    enName: 'PageTitle',
    group: '基础',
    tokens: [
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  {
    key: 'label-item',
    name: '标签项',
    enName: 'LabelItem',
    group: '基础',
    tokens: [
      { name: '文本色', token: '--color-text', type: 'color' },
      { name: '次要文本', token: '--color-text-secondary', type: 'color' },
      { name: '禁用文本', token: '--color-text-disabled', type: 'color' },
    ]
  },
  {
    key: 'accessibility-checker',
    name: '无障碍检查',
    enName: 'AccessibilityChecker',
    group: '基础',
    tokens: [
      { name: '边框色', token: '--color-border-secondary', type: 'color' },
      { name: '成功背景', token: '--color-success-bg', type: 'color' },
      { name: '错误背景', token: '--color-error-bg', type: 'color' },
    ]
  },
  {
    key: 'form-page-template',
    name: '表单模板',
    enName: 'FormPageTemplate',
    group: '表单',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border-secondary', type: 'color' },
      { name: '背景色', token: '--color-bg-container', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  {
    key: 'section-title',
    name: '区域标题',
    enName: 'SectionTitle',
    group: '表单',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  {
    key: 'base-info-form',
    name: '多列表单',
    enName: 'BaseInfoForm',
    group: '表单',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
      { name: '主色', token: '--primary-color', type: 'color' },
    ]
  },
  {
    key: 'form-footer-actions',
    name: '底部操作栏',
    enName: 'FormFooterActions',
    group: '表单',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border-secondary', type: 'color' },
    ]
  },
]

const businessComponentGroups = [
  { key: '列表', name: '列表' },
  { key: '表单', name: '表单' },
  { key: '筛选', name: '筛选' },
  { key: '基础', name: '基础' },
]

function getBusinessComponentsByGroup(groupKey: string) {
  return businessComponents.filter(c => c.group === groupKey)
}

const componentUpdateTimes: Record<string, string> = {
  'action-cell': '2024-01-15 10:30',
  'icon-select': '2024-01-14 14:20',
  'filter-form': '2024-01-13 09:15',
  'filter-options-drawer': '2024-01-12 16:45',
  'column-settings-panel': '2024-01-11 11:00',
  'color-scale': '2024-01-10 15:30',
  'page-title': '2024-01-09 08:45',
  'list-page-template': '2024-01-08 13:20',
  'smart-list-template': '2024-01-07 17:10',
  'label-item': '2024-01-06 10:00',
  'accessibility-checker': '2024-01-05 14:30',
  'section-title': '2024-01-04 09:45',
  'base-info-form': '2025-05-21 10:00',
  'form-footer-actions': '2025-05-21 10:00',
  'form-page-template': '2025-05-21 10:00',
}

function getUpdateTime(componentKey: string): string {
  return componentUpdateTimes[componentKey] || '2024-01-01 00:00'
}

const baseComponents = [
  { 
    key: 'buttons', 
    label: '按钮',
    name: '按钮 Button',
    group: '基础',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '成功色', token: '--color-success', type: 'color' },
      { name: '错误色', token: '--color-error', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'switch', 
    label: '开关',
    name: '开关 Switch',
    group: '基础',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '成功色', token: '--color-success', type: 'color' },
    ]
  },
  { 
    key: 'inputs', 
    label: '输入框',
    name: '输入框 Input',
    group: '数据录入',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'selects', 
    label: '选择器',
    name: '选择器 Select',
    group: '数据录入',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'datepicker', 
    label: '日期选择',
    name: '日期选择 DatePicker',
    group: '数据录入',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'checkbox', 
    label: '多选框',
    name: '多选框 Checkbox',
    group: '数据录入',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
    ]
  },
  { 
    key: 'radio', 
    label: '单选框',
    name: '单选框 Radio',
    group: '数据录入',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
    ]
  },
  { 
    key: 'tables', 
    label: '表格',
    name: '表格 Table',
    group: '数据展示',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'tags', 
    label: '标签',
    name: '标签 Tag',
    group: '数据展示',
    tokens: [
      { name: '成功色', token: '--color-success', type: 'color' },
      { name: '警告色', token: '--color-warning', type: 'color' },
      { name: '错误色', token: '--color-error', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'badge', 
    label: '徽标',
    name: '徽标 Badge',
    group: '数据展示',
    tokens: [
      { name: '成功色', token: '--color-success', type: 'color' },
      { name: '警告色', token: '--color-warning', type: 'color' },
      { name: '错误色', token: '--color-error', type: 'color' },
      { name: '主色', token: '--primary-color', type: 'color' },
    ]
  },
  { 
    key: 'progress', 
    label: '进度条',
    name: '进度条 Progress',
    group: '数据展示',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '成功色', token: '--color-success', type: 'color' },
    ]
  },
  { 
    key: 'modal', 
    label: '模态框',
    name: '模态框 Modal',
    group: '反馈',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框圆角', token: '--border-radius-base', type: 'number' },
    ]
  },
  { 
    key: 'drawer', 
    label: '抽屉',
    name: '抽屉 Drawer',
    group: '反馈',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '主色', token: '--primary-color', type: 'color' },
    ]
  },
  { 
    key: 'tooltip', 
    label: '文字提示',
    name: '文字提示 Tooltip',
    group: '反馈',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
    ]
  },
  { 
    key: 'alert', 
    label: '警告',
    name: '警告 Alert',
    group: '反馈',
    tokens: [
      { name: '成功色', token: '--color-success', type: 'color' },
      { name: '警告色', token: '--color-warning', type: 'color' },
      { name: '错误色', token: '--color-error', type: 'color' },
      { name: '信息色', token: '--color-info', type: 'color' },
    ]
  },
  { 
    key: 'collapse', 
    label: '折叠面板',
    name: '折叠面板 Collapse',
    group: '反馈',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '主色', token: '--primary-color', type: 'color' },
    ]
  },
  { 
    key: 'tabs', 
    label: '标签页',
    name: '标签页 Tabs',
    group: '反馈',
    tokens: [
      { name: '主色', token: '--primary-color', type: 'color' },
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
    ]
  },
  { 
    key: 'forms', 
    label: '表单',
    name: '表单 Form',
    group: '表单',
    tokens: [
      { name: '边框色', token: '--color-border', type: 'color' },
      { name: '文本色', token: '--color-text', type: 'color' },
      { name: '主色', token: '--primary-color', type: 'color' },
    ]
  },
]

const baseComponentGroups = [
  { key: '通用', name: '通用' },
  { key: '数据录入', name: '数据录入' },
  { key: '数据展示', name: '数据展示' },
  { key: '反馈', name: '反馈' },
  { key: '表单', name: '表单' },
]

function getBaseComponentsByGroup(groupKey: string) {
  return baseComponents.filter(c => c.group === groupKey)
}

const selectedBusinessComponent = ref('action-cell')
const selectedBaseComponent = ref('buttons')

const currentBusinessTokens = computed(() => {
  const comp = businessComponents.find(c => c.key === selectedBusinessComponent.value)
  return comp?.tokens || []
})

const currentBusinessName = computed(() => {
  const comp = businessComponents.find(c => c.key === selectedBusinessComponent.value)
  if (!comp) return ''
  return comp.enName ? `${comp.name} ${comp.enName}` : comp.name
})

const businessTokenTabKey = ref('config')

const businessColorTokens = computed(() => {
  return currentBusinessTokens.value.filter(t => t.type === 'color')
})

const businessNumberTokens = computed(() => {
  return currentBusinessTokens.value.filter(t => t.type === 'number')
})

const currentBaseTokens = computed(() => {
  const comp = baseComponents.find(c => c.key === selectedBaseComponent.value)
  return comp?.tokens || []
})

const currentBaseName = computed(() => {
  const comp = baseComponents.find(c => c.key === selectedBaseComponent.value)
  return comp?.name || ''
})

const tokenTabKey = ref('color')

const colorTokens = computed(() => {
  return currentBaseTokens.value.filter(t => t.type === 'color')
})

const numberTokens = computed(() => {
  return currentBaseTokens.value.filter(t => t.type === 'number')
})

const tokenValues: Record<string, string> = {
  '--border-radius-base': '6px',
  '--border-radius-sm': '4px',
  '--border-radius-lg': '8px',
  '--border-radius-round': '50%',
  '--font-size': '14px',
  '--font-size-sm': '12px',
  '--font-size-lg': '16px',
}

function getTokenValue(token: string): string {
  return tokenValues[token] || '-'
}

const navWidth = ref(200)
const tokensWidth = ref(360)
const businessNavWidth = ref(200)
const isDragging = ref(false)
const isTokensDragging = ref(false)

function startDrag(e: MouseEvent) {
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const layout = document.querySelector('.components-layout')
  if (!layout) return
  const rect = layout.getBoundingClientRect()
  const newWidth = e.clientX - rect.left
  if (newWidth >= 160 && newWidth <= 400) {
    navWidth.value = newWidth
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function startTokensDrag(e: MouseEvent) {
  isTokensDragging.value = true
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  document.addEventListener('mousemove', onTokensDrag)
  document.addEventListener('mouseup', stopTokensDrag)
  e.preventDefault()
}

function onTokensDrag(e: MouseEvent) {
  if (!isTokensDragging.value) return
  const newWidth = window.innerWidth - e.clientX
  if (newWidth >= 100) {
    tokensWidth.value = newWidth
  }
}

function stopTokensDrag() {
  isTokensDragging.value = false
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  document.removeEventListener('mousemove', onTokensDrag)
  document.removeEventListener('mouseup', stopTokensDrag)
}

const demoButtons = ref<Array<{
  key: string
  label: string
  danger?: boolean
  confirm?: boolean
  onClick?: () => void
}>>([
  { key: 'edit', label: '编辑', onClick: () => {} },
  { key: 'delete', label: '删除', danger: true, onClick: () => {} },
  { key: 'view', label: '查看', onClick: () => {} },
  { key: 'export', label: '导出', onClick: () => {} },
])

const selectOptions = [
  { label: '选项一', value: 'option1' },
  { label: '选项二', value: 'option2' },
  { label: '选项三', value: 'option3' },
]

const filterConfig = [
  { key: 'name', label: '名称', type: 'input' },
  { key: 'status', label: '状态', type: 'select', options: selectOptions },
]

const demoLabelZh = ref('材料名称')
const demoContentZh = ref('不锈钢板')
const demoContentEn = ref('Stainless Steel Plate')

const showFilterDrawer = ref(false)
const filterDrawerOptions = [
  { key: 'name', label: '名称', checked: true },
  { key: 'status', label: '状态', checked: true, options: [
    { label: '待审核', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
  ]},
  { key: 'dateRange', label: '日期范围', checked: false },
]

function handleFilterDrawerSave(data: any) {
  message.success(`已保存视图: ${data.name}`)
}

const columnFields = ref([
  { key: 'name', label: '名称', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'createTime', label: '创建时间', visible: true },
  { key: 'updateTime', label: '更新时间', visible: false },
])

function handleColumnConfirm(fields: any[]) {
  message.success(`已更新 ${fields.length} 列`)
}

const inputValue = ref('')
const textareaValue = ref('')
const numberValue = ref(1)

const dateValue = ref<Dayjs | undefined>(undefined)
const dateRangeValue = ref<[Dayjs, Dayjs] | undefined>(undefined)
const monthValue = ref<Dayjs | undefined>(undefined)
const showModal = ref(false)
const showDrawer = ref(false)
const switchChecked = ref(true)
const switchOn = ref(false)
const checkboxChecked = ref(true)
const checkboxChecked2 = ref(false)
const checkboxChecked3 = ref(false)
const checkedList = ref(['Apple'])
const checkboxOptions = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange' },
]
const radioValue = ref('Apple')
const radioOptions = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange' },
]
const collapseActiveKey = ref(['1'])
const accordionActiveKey = ref('1')
const demoTabKey = ref('1')
const demoTabKey2 = ref('1')

const tableColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' },
]

const tableData = [
  { id: 1, name: '项目一', status: '进行中', key: '1' },
  { id: 2, name: '项目二', status: '已完成', key: '2' },
  { id: 3, name: '项目三', status: '待开始', key: '3' },
]

const smartListColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '规格', dataIndex: 'spec', key: 'spec' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 120 },
]

const smartListData = [
  { id: 1, name: '不锈钢板', spec: '304 2mm', brand: '宝钢', supplier: '华东物资', quantity: 100, unit: '吨', status: 'pending', statusText: '待审核', createTime: '2024-01-15' },
  { id: 2, name: '镀锌钢管', spec: 'DN50', brand: '华歧', supplier: '华北贸易', quantity: 200, unit: '米', status: 'approved', statusText: '已通过', createTime: '2024-01-14' },
  { id: 3, name: '铝合金板', spec: '3mm', brand: '南山', supplier: '华南建材', quantity: 50, unit: '张', status: 'rejected', statusText: '已拒绝', createTime: '2024-01-13' },
  { id: 4, name: '铜芯电缆', spec: '4x25mm²', brand: '远东', supplier: '华东电缆', quantity: 500, unit: '米', status: 'approved', statusText: '已通过', createTime: '2024-01-12' },
  { id: 5, name: 'PVC管材', spec: 'DN25', brand: '联塑', supplier: '华南管业', quantity: 300, unit: '根', status: 'pending', statusText: '待审核', createTime: '2024-01-11' },
  { id: 6, name: '水泥', spec: 'PO42.5', brand: '海螺', supplier: '华东水泥', quantity: 1000, unit: '吨', status: 'approved', statusText: '已通过', createTime: '2024-01-10' },
  { id: 7, name: '砂石料', spec: '中粗', brand: '本地', supplier: '建材公司', quantity: 2000, unit: '方', status: 'pending', statusText: '待审核', createTime: '2024-01-09' },
  { id: 8, name: '保温棉', spec: '50mm', brand: '欧文斯科宁', supplier: '保温材料厂', quantity: 100, unit: '卷', status: 'approved', statusText: '已通过', createTime: '2024-01-08' },
  { id: 9, name: '防水卷材', spec: 'SBS', brand: '东方雨虹', supplier: '防水材料公司', quantity: 80, unit: '卷', status: 'rejected', statusText: '已拒绝', createTime: '2024-01-07' },
  { id: 10, name: '防火涂料', spec: '饰面型', brand: '金隅', supplier: '防火材料厂', quantity: 60, unit: '桶', status: 'approved', statusText: '已通过', createTime: '2024-01-06' },
]

const smartListLoading = ref(false)

const smartListPagination = ref({
  current: 1,
  pageSize: 10,
  total: 50,
})

const smartListFields = [
  { key: 'name', label: '名称', type: 'input' as const },
  { key: 'spec', label: '规格', type: 'input' as const },
  { key: 'status', label: '状态', type: 'select' as const, options: [
    { label: '待审核', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已拒绝', value: 'rejected' },
  ]},
  { key: 'brand', label: '品牌', type: 'input' as const },
  { key: 'supplier', label: '供应商', type: 'input' as const },
  { key: 'quantity', label: '数量', type: 'input' as const },
  { key: 'unit', label: '单位', type: 'input' as const },
  { key: 'price', label: '单价', type: 'input' as const },
  { key: 'createTime', label: '创建时间', type: 'date' as const },
  { key: 'action', label: '操作', type: 'item' as const },
]

const smartListColumnFields = [
  { key: 'name', label: '名称', visible: true, width: 120 },
  { key: 'spec', label: '规格', visible: true, width: 100 },
  { key: 'status', label: '状态', visible: true, width: 80 },
  { key: 'brand', label: '品牌', visible: true, width: 100 },
  { key: 'supplier', label: '供应商', visible: true, width: 120 },
  { key: 'quantity', label: '数量', visible: true, width: 80 },
  { key: 'unit', label: '单位', visible: true, width: 60 },
  { key: 'createTime', label: '创建时间', visible: true, width: 120 },
  { key: 'action', label: '操作', visible: true, width: 120 },
]

function handleSmartListColumnConfirm(fields: any[]) {
  message.success(`已更新 ${fields.length} 列`)
}

const formState = ref({
  username: '',
  email: '',
  password: '',
})

function handleActionClick(key: string) {
  message.info(`点击了按钮: ${key}`)
}

function addDemoButton() {
  demoButtons.value.push({ 
    key: `btn${Date.now()}`, 
    label: '新按钮', 
    onClick: () => {} 
  })
}

function removeDemoButton(index: number) {
  demoButtons.value.splice(index, 1)
}

function getActionCellCode() {
  return `<ActionCell 
  :buttons="buttons" 
  :max-visible="${demoMaxVisible.value}"
  @click="handleClick"
/>`
}

function handleFormSubmit() {
  message.success('表单已提交')
}

function handleFormReset() {
  formState.value = {
    username: '',
    email: '',
    password: '',
  }
  message.info('表单已重置')
}

function handleFilterSearch(filters: any) {
  message.info(`搜索条件: ${JSON.stringify(filters)}`)
}

function handleFilterReset() {
  message.info('已重置筛选条件')
}

onMounted(() => {
  loadTokens()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event: MouseEvent) {
  if (!isEditingColor.value) return
  const target = event.target as HTMLElement
  if (target.closest('.color-edit-input')) return
  isEditingColor.value = false
}

function handleColorInputFocus() {
  isEditingColor.value = true
}

function handleColorInputBlur() {
  isEditingColor.value = false
}
</script>

<style scoped lang="scss">
.component-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0rem 0.75rem;
  flex-grow: 1;
  align-self: stretch;
  height: 0;
}

:deep(.ant-tabs-top) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 6px 6px 0 0;

  .ant-tabs-content-holder {
    flex: 1;
    overflow: hidden;
  }

  .ant-tabs-content {
    height: 100%;
  }

  .ant-tabs-tabpane {
    height: 100%;
    overflow: hidden;
  }

  .ant-tabs-nav-wrap {
    margin-left: 12px;
    margin-right: 12px;
    padding-left: 0px;
    padding-right: 0px;
  }

  .ant-tabs-nav {
    margin-left: 12px;
    margin-right: 12px;
    margin-bottom: 24px;
  }
}

.tokens-panel {
  flex: 1;
  min-height: 0;
  height: 100%;
  background: var(--color-bg-container, #ffffff);
  border-radius: 8px;
}

.tokens-layout {
  display: flex;
  height: 100%;
}

.tokens-nav {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;

  :deep(.ant-menu) {
    border-right: none;
    padding-left: 12px;
    padding-right: 12px;

    .ant-menu-item {
      padding-left: 12px !important;
      padding-right: 12px;
      border-radius: 4px;
    }
  }
}

.tokens-content {
  flex: 0 0 396px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding-top: 0px;
  padding-right: 16px;
  padding-bottom: 12px;
  padding-left: 16px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.components-layout {
  display: flex;
  height: 100%;
}

.components-nav {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.ant-menu) {
    border-right: none;
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.ant-menu-item) {
    padding-left: 12px !important;
    padding-right: 12px;
    border-radius: 4px;
  }

  :deep(.ant-menu-item-group-title) {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-disabled, #bfbfbf);
    padding: 8px 0;
    margin: 0 12px 0 12px;
    border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
  }
}

.components-content {
  flex: 1;
  height: 100%;
  min-height: 0;
  min-width: 400px;
  overflow-y: auto;
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 16px;
  padding-right: 16px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
  }

  &:hover {
    scrollbar-color: var(--color-border, #d9d9d9) transparent;

    &::-webkit-scrollbar-thumb {
      background-color: var(--color-border, #d9d9d9);
    }
  }
}

.components-divider {
  width: 3px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  position: relative;
  overflow: visible;

  &::before {
    content: '';
    position: absolute;
    left: 1px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-border-secondary, #f0f0f0);
  }

  .drag-handle {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 48px;
    margin: 0 auto;
    background: var(--color-text, #262626);
    border-radius: 2px;
    opacity: 0.3;
    transition: opacity 0.2s;
    z-index: 1;
  }
}

.tokens-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
  margin-bottom: 16px;
}

.components-tokens {
  width: 200px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  padding: 0 16px;
  background: transparent;

  :deep(.ant-tabs-nav) {
    margin: 0;
  }
}

.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--color-bg-container, #ffffff);
  border-radius: 6px;
}

.token-color-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.token-number-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: var(--color-bg-light, #fafafa);
  border: 1px solid var(--color-border, #d9d9d9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.tokens-empty {
  text-align: center;
  color: var(--color-text-disabled);
  padding: 24px 0;
  font-size: 13px;
}

.config-panel {
  padding-top: 16px;
}

:deep(.ant-form-item-control-input-content) {
  .ant-select,
  .ant-input,
  .ant-input-number,
  .ant-slider {
    width: 100%;
  }
  
  .ant-switch {
    width: auto;
    flex-shrink: 0;
  }
}

.token-info {
  flex: 1;
  min-width: 0;
}

.token-name {
  font-size: 13px;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-key {
  font-size: 11px;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.45));
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tokens-divider {
  width: 1px;
  background: var(--color-border-secondary, #f0f0f0);
  flex-shrink: 0;
  margin: 0 16px;
}

.tokens-preview {
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
  padding-bottom: 24px;
  padding-left: 24px;
  background: var(--color-bg-container, #ffffff);
  border-radius: 8px;
}

.token-category {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border, #d9d9d9);
}

.token-group {
  margin: 0 0 32px 0;

  &:last-child {
    margin: 0;
  }
}

.group-header {
  margin-bottom: 12px;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
  }

  &:hover {
    scrollbar-color: var(--color-border, #d9d9d9) transparent;

    &::-webkit-scrollbar-thumb {
      background-color: var(--color-border, #d9d9d9);
    }
  }
}

.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  gap: 16px;
  cursor: pointer;
  border: 1px solid var(--color-border-secondary);
  transition: border-color 0.2s ease;
  width: 100%;
}

.token-row.is-selected {
  border-width: 1.5px;
  border-color: var(--primary-color);
}

.token-label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}

.label-text {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.token-name {
  font-weight: 500;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-key {
  font-size: 12px;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.45));
  font-family: monospace;
}

.token-value {
  flex-shrink: 0;
  width: 200px;

  :deep(.ant-input),
  :deep(.ant-input-number) {
    width: 100%;
  }
}



.preview-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
}

.preview-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.preview-text {
  color: var(--ant-color-text, rgba(0,0,0,0.88));
}

.preview-bg {
  padding: 16px;
  background: var(--layout-bg, #F5F5F5);
  border-radius: 6px;
}

.component-demo {
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 16px;
  padding-right: 16px;
}

.component-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  margin-bottom: 8px;
}

.component-update-time {
  font-size: 12px;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.45));
  margin-bottom: 24px;
}

.demo-section {
  margin-bottom: 24px;

  h4 {
    margin-bottom: 12px;
    color: var(--color-bg-gray, #262626);
    font-size: 14px;
  }
}

.button-config {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 8px;
}

.button-config-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.demo-code {
  margin-top: 24px;

  pre {
    background: var(--color-bg-light, #fafafa);
    color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
  }
}

.selected-icon-display,
.selected-display {
  margin-top: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.smart-list-demo {
  background: var(--color-bg-lighter, #F5F5F5);
  border-radius: 4px;
  overflow: hidden;
}

.demo-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
}

.demo-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  margin: 0;
}

.demo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-line {
  width: 1px;
  height: 16px;
  background: var(--color-border, #d9d9d9);
  margin: 0 4px;
}

.demo-filter {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-lighter, #fafafa);
  border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
}

.demo-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
}

.demo-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-secondary, #f0f0f0);
}

.component-collapse {
  :deep(.ant-collapse-content-box) {
    padding: 0;
  }
}

.component-section {
  padding: 0 24px;
}

.component-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text, #262626);
  margin-bottom: 48px;
}

.component-section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-bg-gray, #262626);
  margin-bottom: 16px;
  margin-top: 32px;

  &:first-child {
    margin-top: 0;
  }
}

.button-group,
.input-group,
.tag-group,
.select-group,
.datepicker-group,
.modal-group,
.drawer-group,
.tooltip-group,
.switch-group,
.checkbox-group,
.radio-group,
.badge-group,
.progress-group,
.alert-group,
.collapse-group,
.tabs-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.input-group {
  max-width: 400px;
}

.form-group {
  display: block;
}

.color-detail-panel {
  padding: 16px 0;
  width: 100%;
}

.color-detail-row {
  display: flex;
  align-items: center;
}

.color-detail-row:not([style*="flex-direction: column"]) {
  margin-bottom: 48px;
}

.color-detail-panel[style*="gap: 32px"] .color-detail-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0;
}

.a11y-checker {
  display: flex;
  gap: 10px;
  width: 560px;
}

.a11y-item {
  flex: 1;
}

.a11y-box {
  width: 100%;
  height: 138px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--color-border-secondary);
}

.a11y-result {
  height: 69px;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  margin-top: 8px;
  font-size: 13px;
}

.color-classification-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.preview-color-box {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.preview-scenes {
  display: flex;
  gap: 12px;
  align-items: center;
}

.label-item-demo {
  max-width: 400px;
}

.label-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-container, #ffffff);
  border-radius: 8px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.label-left {
  flex: 0 0 120px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
  line-height: 22px;
}

.label-center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 14px;
  line-height: 22px;
}

.label-center .zh-name {
  color: var(--primary-color, #F95914);
  font-weight: 600;
}

.label-center .separator {
  color: var(--color-text-disabled, rgba(0, 0, 0, 0.25));
}

.label-center .en-name {
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
  font-style: italic;
}

.tokens-content-fixed {
  flex: 0 0 396px !important;

  .token-group {
    width: 360px;
  }
}

.tokens-content-wide {
  flex: 0 0 600px !important;
}

.group-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, rgba(0, 0, 0, 0.88));
  margin-bottom: 12px;
  padding-left: 4px;
}

.color-preview-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.color-preview-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.opacity-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.opacity-unit {
  color: var(--color-text-secondary);
}

.token-preview {
  border-radius: 50%;
}

.color-detail-panel[style*="gap: 32px"] .color-classification-preview:nth-child(3) .ant-input-affix-wrapper {
  &.ant-input-affix-wrapper-focused,
  &:focus-within {
    box-shadow: none !important;
  }
}
</style>
