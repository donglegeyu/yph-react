import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Select, Cascader, Upload, Radio, DatePicker, ConfigProvider, Space, Modal, Image, type UploadFile, type UploadProps } from 'antd'
const { RangePicker } = DatePicker
import { UploadOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import pcaCodeData from 'china-division/dist/pca-code.json'
import {
  CompanyMessage,
  CompanyButton,
  CompanyForm,
  CompanyCascader,
  CompanyRow,
  CompanyCol,
  FormPageTemplate,
  SectionTitle,
} from '@donglegeyu/company-ui'
import { API_ENDPOINTS } from '@/constants/api'
import { SERVICE_PROVIDER_LIST, getServiceProviderById } from '@/constants/serviceProviders'
import './CraftsmanForm.scss'

interface SkillOption {
  id: number
  skillName: string
  secondaryCategory: string
  category3: string
  certificateType: string
  exampleImage?: string
}

interface BrandOption {
  value: string
  label: string
}

interface CertificateUploadItem {
  certificateType: string
  exampleImage?: string
}

interface ServiceArea {
  codes: string[]
  labels: string[]
}

interface CraftsmanFormData {
  name: string
  phone: string
  userAccount: string
  craftsmanCategory: string | undefined
  craftsmanType: number | string
  serviceProviderId: number | undefined
  region: string
  idCardNo: string
  idCardValidDate: string[]
  residentialArea: (string | number)[]
  residentialStreet: string
  residentialDetail: string
  idCardFrontUrl: string
  idCardBackUrl: string
  serviceAreas: ServiceArea[]
  serviceSkillIds: number[]
  brands: string[]
  certificates: Record<string, string[]>
  workProofType: number
  workCertificate: string[]
  serviceRecord: string[]
  noCriminalCertificate: string[]
}

const initialFormData: CraftsmanFormData = {
  name: '',
  phone: '',
  userAccount: '',
  craftsmanCategory: undefined,
  craftsmanType: 2,
  serviceProviderId: undefined,
  region: '',
  idCardNo: '',
  idCardValidDate: [],
  residentialArea: [],
  residentialStreet: '',
  residentialDetail: '',
  idCardFrontUrl: '',
  idCardBackUrl: '',
  serviceAreas: [],
  serviceSkillIds: [],
  brands: [],
  certificates: {},
  workProofType: 1,
  workCertificate: [],
  serviceRecord: [],
  noCriminalCertificate: [],
}

const LONG_TERM_LABEL = '长期'
const LONG_TERM_DATE = '2099-12-31'
const toLongTermIfMatch = (dateStr: string) => (dateStr === LONG_TERM_DATE ? LONG_TERM_LABEL : dateStr)
const toDateStrOrLongTerm = (dateStr: string) => (dateStr === LONG_TERM_LABEL ? LONG_TERM_DATE : dateStr)

function fileListToUrls(list: UploadFile[]): string[] {
  return list
    .filter((f) => f.status === 'done')
    .map((f) => (f.url ? f.url : (f.response?.data as string)))
    .filter(Boolean)
}

export default function CraftsmanForm() {
  const navigate = useNavigate()
  const [baseInfoForm] = CompanyForm.useForm()
  const [residentialForm] = CompanyForm.useForm()
  const [idCardForm] = CompanyForm.useForm()
  const [skillForm] = CompanyForm.useForm()
  const [certificateForm] = CompanyForm.useForm()
  const [proofForm] = CompanyForm.useForm()
  const sectionForms = [baseInfoForm, residentialForm, idCardForm, skillForm, certificateForm, proofForm]
  const [formData, setFormData] = useState<CraftsmanFormData>(initialFormData)
  const [uploadFileLists, setUploadFileLists] = useState<Record<string, UploadFile[]>>({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [userAccountMode, setUserAccountMode] = useState<'new' | 'link'>('new')
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([])
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [examplePreview, setExamplePreview] = useState<{ visible: boolean; title: string; images: string[] }>({ visible: false, title: '', images: [] })
  const [frontRecognized, setFrontRecognized] = useState(false)
  const [backRecognized, setBackRecognized] = useState(false)
  const [recognizingFront, setRecognizingFront] = useState(false)
  const [recognizingBack, setRecognizingBack] = useState(false)
  const [brands] = useState<BrandOption[]>([
    { value: 'midea', label: '美的' },
    { value: 'haier', label: '海尔' },
    { value: 'gree', label: '格力' },
    { value: 'supor', label: '苏泊尔' },
    { value: 'philips', label: '飞利浦' },
  ])
  const formContainerRef = useRef<HTMLDivElement>(null)
  const [colSpan, setColSpan] = useState(8)

  useEffect(() => {
    const el = formContainerRef.current
    if (!el) return
    const updateSpan = () => {
      const w = el.offsetWidth
      if (w < 560) setColSpan(24)
      else if (w < 860) setColSpan(12)
      else if (w < 1200) setColSpan(8)
      else setColSpan(6)
    }
    updateSpan()
    const ro = new ResizeObserver(updateSpan)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    fetch(`${API_ENDPOINTS.SKILLS}?size=1000`)
      .then((res) => res.json())
      .then((json) => {
        const records = json.data?.records || []
        setSkills(records.map((s: SkillOption) => ({
          id: s.id,
          skillName: s.skillName,
          secondaryCategory: s.secondaryCategory,
          category3: s.category3,
          certificateType: s.certificateType,
          exampleImage: s.exampleImage,
        })))
      })
      .catch(() => {
        // 技能加载失败时保持空列表
      })
  }, [])

  useEffect(() => {
    fetch(`${API_ENDPOINTS.SYS_USERS}?size=1000`)
      .then((res) => res.json())
      .then((json) => {
        const records = json.data?.records || json.data || []
        setUserOptions(records.map((u: { userAccount: string; name: string }) => ({
          value: u.userAccount,
          label: `${u.name}（${u.userAccount}）`,
        })))
      })
      .catch(() => {})
  }, [])

  const certificateItems = useMemo<CertificateUploadItem[]>(() => {
    const selected = skills.filter((s) => formData.serviceSkillIds.includes(s.id))
    const seen = new Set<string>()
    const result: CertificateUploadItem[] = []
    selected.forEach((s) => {
      if (s.certificateType && !seen.has(s.certificateType)) {
        seen.add(s.certificateType)
        result.push({ certificateType: s.certificateType, exampleImage: s.exampleImage })
      }
    })
    return result
  }, [formData.serviceSkillIds, skills])

  const updateField = <K extends keyof CraftsmanFormData>(field: K, value: CraftsmanFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const recognizeIdCard = (side: 'front' | 'back', url: string) => {
    if (!url) return
    if (side === 'front') {
      setRecognizingFront(true)
      setTimeout(() => {
        updateField('name', '张三')
        updateField('idCardNo', '110101199001011234')
        setFrontRecognized(true)
        setRecognizingFront(false)
        CompanyMessage.success('身份证人像面识别成功')
      }, 1000)
    } else {
      setRecognizingBack(true)
      setTimeout(() => {
        updateField('idCardValidDate', ['2010-01-01', '2030-01-01'])
        setBackRecognized(true)
        setRecognizingBack(false)
        CompanyMessage.success('身份证国徽面识别成功')
      }, 1000)
    }
  }

  const handleIdCardRemove = (side: 'front' | 'back') => {
    if (side === 'front') {
      updateField('idCardFrontUrl', '')
      updateField('name', '')
      updateField('idCardNo', '')
      setFrontRecognized(false)
    } else {
      updateField('idCardBackUrl', '')
      updateField('idCardValidDate', [])
      setBackRecognized(false)
    }
  }

  const [serviceAreaAdding, setServiceAreaAdding] = useState(false)
  const [pendingAreaCodes, setPendingAreaCodes] = useState<string[]>([])

  const resolveAreaLabels = (codes: string[]): string[] => {
    const labels: string[] = []
    let list: DivisionRegion[] = pcaCodeData as DivisionRegion[]
    for (const code of codes) {
      const hit = list.find((n) => String(n.code) === String(code))
      if (!hit) break
      labels.push(hit.name)
      list = hit.children || []
    }
    return labels
  }

  const handleAddServiceArea = () => {
    if (pendingAreaCodes.length !== 3) return
    const exists = formData.serviceAreas.some((a) => a.codes.join('-') === pendingAreaCodes.join('-'))
    if (exists) {
      CompanyMessage.warning('该区域已添加')
      return
    }
    const next: ServiceArea = { codes: pendingAreaCodes, labels: resolveAreaLabels(pendingAreaCodes) }
    setFormData((prev) => ({ ...prev, serviceAreas: [...prev.serviceAreas, next] }))
    setPendingAreaCodes([])
    setServiceAreaAdding(false)
  }

  const handleRemoveServiceArea = (index: number) => {
    setFormData((prev) => ({ ...prev, serviceAreas: prev.serviceAreas.filter((_, i) => i !== index) }))
  }

  const [skillAdding, setSkillAdding] = useState(false)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null)
  const [pendingSkillIdList, setPendingSkillIdList] = useState<number[]>([])

  const skillLabelMap = useMemo(() => {
    const m = new Map<number, string>()
    skills.forEach((s) => m.set(s.id, s.skillName))
    return m
  }, [skills])

  const availableSkillCategories = useMemo(() => {
    const set = new Set<string>()
    skills.forEach((s) => {
      if (s.category3 && !formData.serviceSkillIds.includes(s.id)) set.add(s.category3)
    })
    return Array.from(set).map((c) => ({ value: c, label: c }))
  }, [skills, formData.serviceSkillIds])

  const availableSkillsInPendingCategory = useMemo(() => {
    if (!pendingCategory) return []
    return skills
      .filter((s) => s.category3 === pendingCategory && !formData.serviceSkillIds.includes(s.id))
      .map((s) => ({ value: s.id, label: s.skillName }))
  }, [skills, pendingCategory, formData.serviceSkillIds])

  const skillGrouped = useMemo(() => {
    const map = new Map<string, number[]>()
    skills.forEach((s) => {
      if (!formData.serviceSkillIds.includes(s.id)) return
      if (!s.category3) return
      const arr = map.get(s.category3) || []
      arr.push(s.id)
      map.set(s.category3, arr)
    })
    return Array.from(map.entries()).map(([category, ids]) => ({ category, ids }))
  }, [skills, formData.serviceSkillIds])

  const recalcCertificates = (ids: number[], prevCerts: Record<string, string[]>) => {
    const allSelected = skills.filter((s) => ids.includes(s.id))
    const allTypes = new Set(allSelected.map((s) => s.certificateType).filter((t): t is string => Boolean(t)))
    const nextCerts: Record<string, string[]> = {}
    allTypes.forEach((t) => { nextCerts[t] = prevCerts[t] || [] })
    return nextCerts
  }

  const handleAddSkill = () => {
    if (pendingSkillIdList.length === 0) return
    setFormData((prev) => {
      const nextIds = [...prev.serviceSkillIds, ...pendingSkillIdList.filter((id) => !prev.serviceSkillIds.includes(id))]
      const nextCerts = recalcCertificates(nextIds, prev.certificates)
      return { ...prev, serviceSkillIds: nextIds, certificates: nextCerts }
    })
    setPendingCategory(null)
    setPendingSkillIdList([])
    setSkillAdding(false)
  }

  const handleRemoveSkill = (id: number) => {
    setFormData((prev) => {
      const nextIds = prev.serviceSkillIds.filter((s) => s !== id)
      const nextCerts = recalcCertificates(nextIds, prev.certificates)
      return { ...prev, serviceSkillIds: nextIds, certificates: nextCerts }
    })
  }

  const [brandAdding, setBrandAdding] = useState(false)
  const [pendingBrand, setPendingBrand] = useState<string | null>(null)

  const brandLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    brands.forEach((b) => m.set(b.value, b.label))
    return m
  }, [brands])

  const availableBrandOptions = useMemo(() => {
    return brands.filter((b) => !formData.brands.includes(b.value))
  }, [brands, formData.brands])

  const handleAddBrand = () => {
    if (!pendingBrand) return
    if (formData.brands.includes(pendingBrand)) {
      CompanyMessage.warning('该品牌已添加')
      return
    }
    setFormData((prev) => ({ ...prev, brands: [...prev.brands, pendingBrand] }))
    setPendingBrand(null)
    setBrandAdding(false)
  }

  const handleRemoveBrand = (value: string) => {
    setFormData((prev) => ({ ...prev, brands: prev.brands.filter((b) => b !== value) }))
  }

  const buildUploadProps = (
    fieldKey: string,
    setUrls: (urls: string[]) => void,
    maxCount = 5,
    onRemove?: () => void,
    accept = 'image/jpeg,image/png,image/gif,image/webp',
  ): UploadProps => {
    const fileList = uploadFileLists[fieldKey] || []
    return {
      name: 'file',
      action: API_ENDPOINTS.FILE_UPLOAD,
      accept,
      listType: 'picture-card',
      maxCount,
      multiple: maxCount > 1,
      fileList,
      onChange: ({ fileList: newList }) => {
        setUploadFileLists((prev) => ({ ...prev, [fieldKey]: newList }))
        setUrls(fileListToUrls(newList))
      },
      onPreview: (file) => {
        const url = file.url || (file.response?.data as string)
        if (url) window.open(url, '_blank')
      },
      onRemove: () => {
        if (onRemove) onRemove()
        return true
      },
    }
  }

  const handleCancel = () => navigate('/craftsman-search')

  const handleSubmit = async () => {
    try {
      await Promise.all(sectionForms.map((f) => f.validateFields()))
    } catch {
      CompanyMessage.warning('请完善必填项')
      return
    }

    if (!formData.idCardFrontUrl || !formData.idCardBackUrl) {
      CompanyMessage.warning('请上传身份证正反面照片')
      return
    }
    if (formData.serviceAreas.length === 0) {
      CompanyMessage.warning('请添加至少一个接单区域')
      return
    }
    if (formData.serviceSkillIds.length === 0) {
      CompanyMessage.warning('请选择服务技能')
      return
    }
    const missingCert = certificateItems.find((item) => (formData.certificates[item.certificateType] || []).length === 0)
    if (missingCert) {
      CompanyMessage.warning(`请至少上传一张「${missingCert.certificateType}」`)
      return
    }

    setSubmitLoading(true)
    try {
      const payload = {
        ...formData,
        serviceProviderName: getServiceProviderById(formData.serviceProviderId || 0)?.name,
        idCardValidDate: formData.idCardValidDate.length === 2 ? formData.idCardValidDate.join(',') : null,
        idCardImages: [formData.idCardFrontUrl, formData.idCardBackUrl].filter(Boolean).join(','),
        serviceAreas: formData.serviceAreas.map((a) => a.codes.join(',')),
        serviceAreaLabels: formData.serviceAreas.map((a) => a.labels.join('/')),
        workCertificate: formData.workProofType === 1 ? formData.workCertificate.join(',') : '',
        serviceRecord: formData.workProofType === 2 ? formData.serviceRecord.join(',') : '',
        noCriminalCertificate: formData.noCriminalCertificate.join(','),
        certificates: Object.fromEntries(
          Object.entries(formData.certificates).map(([k, v]) => [k, v.join(',')]),
        ),
      }
      const res = await fetch(API_ENDPOINTS.CRAFTSMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.code === 200) {
        CompanyMessage.success('新增工匠成功')
        navigate('/craftsman-search')
      } else {
        CompanyMessage.error(json.message || '新增失败，请稍后重试')
      }
    } catch {
      CompanyMessage.error('新增失败，请稍后重试')
    } finally {
      setSubmitLoading(false)
    }
  }

  const uploadTheme = { components: { Upload: { pictureCardSize: 96 } } }

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
    <FormPageTemplate
      title="新增工匠"
      showBack
      onBack={() => navigate('/craftsman-search')}
      submitText="确定"
      submitLoading={submitLoading}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      <div ref={formContainerRef} className="craftsman-form" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        <section>
          <SectionTitle title="基础信息" />
          <CompanyForm form={baseInfoForm} layout="horizontal" labelAlign="right" requiredMark component="div" className="base-info-form" style={{ marginTop: 8 }}>
            <CompanyRow gutter={24}>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="姓名" name="name" rules={[{ required: true, message: '请输入' }]}>
                  <Input placeholder="请输入" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入' }, { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}>
                  <Input placeholder="请输入" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="所属服务商" rules={[{ required: true, message: '请选择' }]}>
                  <Select
                    placeholder="请选择"
                    value={formData.serviceProviderId}
                    onChange={(val) => {
                      const opt = getServiceProviderById(val)
                      updateField('serviceProviderId', val)
                      updateField('craftsmanCategory', opt?.category)
                    }}
                    options={SERVICE_PROVIDER_LIST.map((o) => ({ value: o.id, label: o.name }))}
                  />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="工匠类别">
                  <Input placeholder="选择所属服务商后反显" disabled value={getServiceProviderById(formData.serviceProviderId || 0)?.categoryName} />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="用户账号" name="userAccount" rules={[{ required: true, message: '请输入' }]}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      value={userAccountMode}
                      onChange={(val) => { setUserAccountMode(val); updateField('userAccount', '') }}
                      style={{ width: 72 }}
                      options={[
                        { value: 'new', label: '新增' },
                        { value: 'link', label: '关联' },
                      ]}
                    />
                    {userAccountMode === 'new' ? (
                      <Input
                        placeholder="请输入"
                        value={formData.userAccount}
                        onChange={(e) => updateField('userAccount', e.target.value)}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <Select
                        placeholder="请选择"
                        value={formData.userAccount || undefined}
                        onChange={(val) => updateField('userAccount', val)}
                        options={userOptions}
                        showSearch
                        optionFilterProp="label"
                        style={{ flex: 1 }}
                      />
                    )}
                  </Space.Compact>
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
          </CompanyForm>
        </section>

        <section>
          <SectionTitle title="常住地址" />
          <CompanyForm form={residentialForm} layout="horizontal" labelAlign="right" requiredMark component="div" className="base-info-form" style={{ marginTop: 8 }}>
            <CompanyRow gutter={24}>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="省/市/区" name="residentialArea" rules={[{ required: true, message: '请选择' }]}>
                  <Cascader
                    options={pcaCodeData as DivisionRegion[]}
                    fieldNames={{ label: 'name', value: 'code', children: 'children' }}
                    changeOnSelect
                    placeholder="请选择"
                    value={formData.residentialArea as string[]}
                    onChange={(value) => updateField('residentialArea', value as string[])}
                  />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="街道" name="residentialStreet">
                  <Input placeholder="请输入街道/乡镇" value={formData.residentialStreet} onChange={(e) => updateField('residentialStreet', e.target.value)} />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan} className="label-top">
                <CompanyForm.Item label="详细地址" name="residentialDetail">
                  <Input.TextArea rows={2} placeholder="请输入" value={formData.residentialDetail} onChange={(e) => updateField('residentialDetail', e.target.value)} />
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
          </CompanyForm>
        </section>

        <section>
          <SectionTitle title="身份证信息" description="请上传身份证正反面照片，系统将自动识别身份信息，识别成功后将自动填充姓名和身份证号" />
          <CompanyForm form={idCardForm} layout="horizontal" labelAlign="right" requiredMark component="div" className="base-info-form" style={{ marginTop: 8 }}>
            <CompanyRow gutter={24}>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="身份证人像面" required>
                  <ConfigProvider theme={uploadTheme}>
                    <Upload {...buildUploadProps('idCardFront', (urls) => { const u = urls[0] || ''; updateField('idCardFrontUrl', u); recognizeIdCard('front', u) }, 1, () => handleIdCardRemove('front'))}>
                      {!formData.idCardFrontUrl && (
                        <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                          <UploadOutlined style={{ fontSize: 16 }} />
                          <div style={{ marginTop: 2, fontSize: 12 }}>上传人像面</div>
                        </div>
                      )}
                    </Upload>
                  </ConfigProvider>
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="身份证国徽面" required>
                  <ConfigProvider theme={uploadTheme}>
                    <Upload {...buildUploadProps('idCardBack', (urls) => { const u = urls[0] || ''; updateField('idCardBackUrl', u); recognizeIdCard('back', u) }, 1, () => handleIdCardRemove('back'))}>
                      {!formData.idCardBackUrl && (
                        <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                          <UploadOutlined style={{ fontSize: 16 }} />
                          <div style={{ marginTop: 2, fontSize: 12 }}>上传国徽面</div>
                        </div>
                      )}
                    </Upload>
                  </ConfigProvider>
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
            <CompanyRow gutter={24}>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="姓名">
                  <Input placeholder="上传身份证后自动识别" disabled={!frontRecognized || recognizingFront} value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="身份证号" rules={[{ pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号' }]}>
                  <Input placeholder="上传身份证后自动识别" disabled={!frontRecognized || recognizingFront} value={formData.idCardNo} onChange={(e) => updateField('idCardNo', e.target.value)} />
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="有效期">
                  {formData.idCardValidDate.length === 2 && formData.idCardValidDate[1] === LONG_TERM_LABEL ? (
                    <Input
                      value={`${formData.idCardValidDate[0].replace(/-/g, '.')} - ${LONG_TERM_LABEL}`}
                      readOnly
                                      disabled={!backRecognized || recognizingBack}
                      suffix={
                        <CloseOutlined style={{ color: 'rgba(0,0,0,0.25)', cursor: 'pointer' }} onClick={() => updateField('idCardValidDate', [])} />
                      }
                    />
                  ) : (
                    <RangePicker
                      style={{ width: '100%' }}
                      placeholder={['开始日期', '结束日期']}
                      format="YYYY.MM.DD"
                      disabled={!backRecognized || recognizingBack}
                      value={formData.idCardValidDate.length === 2 ? [dayjs(formData.idCardValidDate[0]), dayjs(formData.idCardValidDate[1])] : null}
                      renderExtraFooter={() => (
                        <CompanyButton
                          type="link"
                          size="small"
                          style={{ padding: 0, height: 'auto' }}
                          onClick={() => {
                            const start = formData.idCardValidDate[0] || dayjs().format('YYYY-MM-DD')
                            updateField('idCardValidDate', [start, LONG_TERM_LABEL])
                          }}
                        >
                          长期
                        </CompanyButton>
                      )}
                      onChange={(values, dateStrings) => {
                        const strs = (dateStrings as string[]) || []
                        if (values && values[0] && values[1]) {
                          updateField('idCardValidDate', [values[0].format('YYYY-MM-DD'), values[1].format('YYYY-MM-DD')])
                        } else {
                          updateField('idCardValidDate', strs)
                        }
                      }}
                    />
                  )}
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
          </CompanyForm>
        </section>

        <section>
          <SectionTitle title="接单区域" description="点击「添加区域」选择省/市/区，支持添加多个接单区域，每个区域必须精确到区/县" />
          <div className="service-area-picker" style={{ marginTop: 8, marginBottom: 32 }}>
            {formData.serviceAreas.length > 0 && (
              <div className="service-area-list">
                {formData.serviceAreas.map((area, index) => (
                  <div key={area.codes.join('-')} className="service-area-item">
                    <span className="service-area-text">{area.labels.join(' / ')}</span>
                    <CloseOutlined className="service-area-remove" onClick={() => handleRemoveServiceArea(index)} />
                  </div>
                ))}
              </div>
            )}

            {serviceAreaAdding ? (
              <div className="service-area-adding">
                <CompanyCascader
                  placeholder="请选择省/市/区"
                  options={pcaCodeData as DivisionRegion[]}
                  fieldNames={{ label: 'name', value: 'code', children: 'children' }}
                  value={pendingAreaCodes}
                  onChange={(value) => setPendingAreaCodes(value as string[])}
                  changeOnSelect={false}
                  style={{ width: 260 }}
                />
                <CompanyButton type="text" size="middle" style={{ paddingInline: 6, color: pendingAreaCodes.length !== 3 ? 'rgba(0,0,0,0.25)' : '#F95914' }} disabled={pendingAreaCodes.length !== 3} onClick={handleAddServiceArea}>确定</CompanyButton>
                <CompanyButton type="text" size="middle" style={{ paddingInline: 6, marginLeft: -6, color: '#F95914' }} onClick={() => { setServiceAreaAdding(false); setPendingAreaCodes([]) }}>取消</CompanyButton>
              </div>
            ) : (
              <CompanyButton className="service-area-add-btn" type="dashed" size="middle" icon={<PlusOutlined />} style={{ marginLeft: 12 }} onClick={() => setServiceAreaAdding(true)}>
                添加区域
              </CompanyButton>
            )}
          </div>
        </section>

        <section>
          <SectionTitle title="服务技能" description="请选择工匠具备的服务技能，选择后系统将自动生成对应的资格证书上传项" />
          <CompanyForm form={skillForm} layout="vertical" component="div" className="skill-vertical-form" style={{ marginTop: 8 }}>
            <CompanyRow gutter={24}>
              <CompanyCol span={24}>
                <CompanyForm.Item label="专业技能" required style={{ paddingLeft: 12 }}>
                  <div className="tag-picker">
                    {skillGrouped.length > 0 && (
                      <div className="tag-list">
                        {skillGrouped.map((group) => (
                          <div key={group.category} className="tag-item tag-item-group">
                            <span className="tag-category">{group.category}</span>
                            <span className="tag-slash">/</span>
                            {group.ids.map((id) => (
                              <span key={id} className="tag-skill-chip">
                                {skillLabelMap.get(id) || `技能${id}`}
                                <CloseOutlined className="tag-remove" onClick={() => handleRemoveSkill(id)} />
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {skillAdding ? (
                      <div className="tag-adding">
                        <Select
                          placeholder="请选择品类"
                          options={availableSkillCategories}
                          value={pendingCategory}
                          onChange={(value) => { setPendingCategory(value as string); setPendingSkillIdList([]) }}
                          style={{ width: 140 }}
                          popupMatchSelectWidth={false}
                          showSearch
                          optionFilterProp="label"
                        />
                        <Select
                          mode="multiple"
                          maxTagCount="responsive"
                          placeholder="请选择技能（可多选）"
                          options={availableSkillsInPendingCategory}
                          value={pendingSkillIdList}
                          onChange={(value) => setPendingSkillIdList(value as number[])}
                          style={{ width: 240 }}
                          disabled={!pendingCategory}
                          optionFilterProp="label"
                        />
                        <CompanyButton type="text" size="middle" style={{ paddingInline: 6, color: pendingSkillIdList.length === 0 ? 'rgba(0,0,0,0.25)' : '#F95914' }} onClick={handleAddSkill} disabled={pendingSkillIdList.length === 0}>确定</CompanyButton>
                        <CompanyButton type="text" size="middle" style={{ paddingInline: 6, marginLeft: -8, color: '#F95914' }} onClick={() => { setSkillAdding(false); setPendingCategory(null); setPendingSkillIdList([]) }}>取消</CompanyButton>
                      </div>
                    ) : (
                      availableSkillCategories.length > 0 && (
                        <CompanyButton className="tag-add-btn" type="dashed" size="middle" icon={<PlusOutlined />} onClick={() => setSkillAdding(true)}>
                          添加技能
                        </CompanyButton>
                      )
                    )}
                  </div>
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
            <CompanyRow gutter={24}>
              <CompanyCol span={24}>
                <CompanyForm.Item label="品牌" style={{ paddingLeft: 12, marginBottom: 32 }}>
                  <div className="tag-picker">
                    {formData.brands.length > 0 && (
                      <div className="tag-list">
                        {formData.brands.map((value) => (
                          <div key={value} className="tag-item">
                            <span className="tag-text">{brandLabelMap.get(value) || value}</span>
                            <CloseOutlined className="tag-remove" onClick={() => handleRemoveBrand(value)} />
                          </div>
                        ))}
                      </div>
                    )}

                    {brandAdding ? (
                      <div className="tag-adding">
                        <Select
                          placeholder="请选择品牌"
                          options={availableBrandOptions}
                          value={pendingBrand}
                          onChange={(value) => setPendingBrand(value as string)}
                          style={{ width: 260 }}
                          showSearch
                          optionFilterProp="label"
                        />
                        <CompanyButton type="text" size="middle" style={{ paddingInline: 6, color: !pendingBrand ? 'rgba(0,0,0,0.25)' : '#F95914' }} disabled={!pendingBrand} onClick={handleAddBrand}>确定</CompanyButton>
                        <CompanyButton type="text" size="middle" style={{ paddingInline: 6, marginLeft: -8, color: '#F95914' }} onClick={() => { setBrandAdding(false); setPendingBrand(null) }}>取消</CompanyButton>
                      </div>
                    ) : (
                      availableBrandOptions.length > 0 && (
                        <CompanyButton className="tag-add-btn" type="dashed" size="middle" icon={<PlusOutlined />} onClick={() => setBrandAdding(true)}>
                          添加品牌
                        </CompanyButton>
                      )
                    )}
                  </div>
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
          </CompanyForm>
        </section>

        <section>
          <SectionTitle title="资格证书" description="请上传对应技能所需的资格证书照片" />
          <CompanyForm form={certificateForm} layout="horizontal" labelAlign="right" requiredMark component="div" className="base-info-form" style={{ marginTop: 8 }}>
            {certificateItems.length === 0 ? (
              <div style={{ height: 120, paddingLeft: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>选择服务技能后，系统匹配上传证书</div>
            ) : (
              <CompanyRow gutter={24}>
                {certificateItems.map((item) => (
                  <CompanyCol key={item.certificateType} span={colSpan}>
                    <CompanyForm.Item label={item.certificateType} required>
                      <ConfigProvider theme={uploadTheme}>
                        <Upload
                          {...buildUploadProps(
                            `cert-${item.certificateType}`,
                            (urls) => updateField('certificates', { ...formData.certificates, [item.certificateType]: urls }),
                            2,
                            undefined,
                            'image/jpeg,image/png,image/gif,image/webp,application/pdf',
                          )}
                        >
                          {(uploadFileLists[`cert-${item.certificateType}`] || []).length < 2 && (
                            <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                              <UploadOutlined style={{ fontSize: 16 }} />
                              <div style={{ marginTop: 2, fontSize: 12 }}>上传</div>
                            </div>
                          )}
                        </Upload>
                      </ConfigProvider>
                      {item.exampleImage && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                          参考示例图
                          <a
                            style={{ marginLeft: 4 }}
                            onClick={() => {
                              const imgs = item.exampleImage!.split(',').map((u) => u.trim()).filter(Boolean)
                              setExamplePreview({ visible: true, title: item.certificateType, images: imgs })
                            }}
                          >
                            查看
                          </a>
                        </div>
                      )}
                    </CompanyForm.Item>
                  </CompanyCol>
                ))}
              </CompanyRow>
            )}
          </CompanyForm>
        </section>

        <section>
          <SectionTitle title="佐证材料" description="请上传工作证明、服务记录或无犯罪证明等佐证材料" />
          <CompanyForm form={proofForm} layout="horizontal" labelAlign="right" requiredMark component="div" className="base-info-form" style={{ marginTop: 8 }}>
            <CompanyRow gutter={24}>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="工作证明" required className="label-top">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Radio.Group
                      value={formData.workProofType}
                      onChange={(e) => updateField('workProofType', e.target.value as number)}
                      style={{ paddingTop: 4.8 }}
                    >
                      <Radio value={1}>工作证明</Radio>
                      <Radio value={2}>服务记录</Radio>
                    </Radio.Group>
                    {formData.workProofType === 1 ? (
                      <ConfigProvider theme={uploadTheme}>
                        <Upload
                          {...buildUploadProps(
                            'workCertificate',
                            (urls) => updateField('workCertificate', urls),
                            5,
                            undefined,
                            'image/jpeg,image/png,image/gif,image/webp,application/pdf',
                          )}
                        >
                          <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                            <UploadOutlined style={{ fontSize: 16 }} />
                            <div style={{ marginTop: 2, fontSize: 12 }}>上传</div>
                          </div>
                        </Upload>
                      </ConfigProvider>
                    ) : (
                      <ConfigProvider theme={uploadTheme}>
                        <Upload
                          {...buildUploadProps(
                            'serviceRecord',
                            (urls) => updateField('serviceRecord', urls),
                            5,
                            undefined,
                            'image/jpeg,image/png,image/gif,image/webp,application/pdf',
                          )}
                        >
                          <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                            <UploadOutlined style={{ fontSize: 16 }} />
                            <div style={{ marginTop: 2, fontSize: 12 }}>上传</div>
                          </div>
                        </Upload>
                      </ConfigProvider>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                      参考示例图
                      <a
                        style={{ marginLeft: 4 }}
                        onClick={() => setExamplePreview({
                          visible: true,
                          title: formData.workProofType === 1 ? '工作证明' : '服务记录',
                          images: formData.workProofType === 1
                            ? ['/test/work-cert-real.png']
                            : ['/test/work-cert-real.png'],
                        })}
                      >
                        查看
                      </a>
                    </div>
                  </div>
                </CompanyForm.Item>
              </CompanyCol>
              <CompanyCol span={colSpan}>
                <CompanyForm.Item label="无犯罪证明" required>
                  <ConfigProvider theme={uploadTheme}>
                    <Upload
                      {...buildUploadProps(
                        'noCriminalCertificate',
                        (urls) => updateField('noCriminalCertificate', urls),
                        5,
                        undefined,
                        'image/jpeg,image/png,image/gif,image/webp,application/pdf',
                      )}
                    >
                      <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                        <UploadOutlined style={{ fontSize: 16 }} />
                        <div style={{ marginTop: 2, fontSize: 12 }}>上传</div>
                      </div>
                    </Upload>
                  </ConfigProvider>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    参考示例图
                    <a
                      style={{ marginLeft: 4 }}
                      onClick={() => setExamplePreview({
                        visible: true,
                        title: '无犯罪证明',
                        images: ['/test/nocriminal.png'],
                      })}
                    >
                      查看
                    </a>
                  </div>
                </CompanyForm.Item>
              </CompanyCol>
            </CompanyRow>
          </CompanyForm>
        </section>

        </div>

        <Modal
          title={`${examplePreview.title} - 示例图`}
          open={examplePreview.visible}
          footer={null}
          width={560}
          rootClassName="example-preview-modal"
          onCancel={() => setExamplePreview((prev) => ({ ...prev, visible: false }))}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 1, background: '#fff', borderBottom: '1px solid rgba(5,5,5,0.06)', margin: '0 -20px 12px', padding: '0 20px 12px', color: 'rgba(0,0,0,0.65)', fontSize: 14 }}>
            请参考以下示例图上传对应的资格证书，确保图片清晰、信息完整。
          </div>
          <Image.PreviewGroup>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {examplePreview.images.map((src) => (
                <Image
                  key={src}
                  src={src}
                  style={{ width: '100%', borderRadius: 6 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        </Modal>
    </FormPageTemplate>
    </div>
  )
}
