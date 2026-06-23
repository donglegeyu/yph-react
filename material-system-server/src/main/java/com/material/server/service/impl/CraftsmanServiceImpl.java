package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.Craftsman;
import com.material.server.entity.CraftsmanBrand;
import com.material.server.entity.CraftsmanCertificate;
import com.material.server.entity.CraftsmanServiceArea;
import com.material.server.entity.CraftsmanSkill;
import com.material.server.entity.Skill;
import com.material.server.mapper.CraftsmanBrandMapper;
import com.material.server.mapper.CraftsmanCertificateMapper;
import com.material.server.mapper.CraftsmanMapper;
import com.material.server.mapper.CraftsmanServiceAreaMapper;
import com.material.server.mapper.CraftsmanSkillMapper;
import com.material.server.mapper.SkillMapper;
import com.material.server.service.CraftsmanService;
import com.material.server.vo.CraftsmanEditVO;
import com.material.server.vo.CraftsmanListVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CraftsmanServiceImpl
    extends ServiceImpl<CraftsmanMapper, Craftsman>
    implements CraftsmanService {

    private final CraftsmanSkillMapper craftsmanSkillMapper;
    private final CraftsmanBrandMapper craftsmanBrandMapper;
    private final CraftsmanServiceAreaMapper craftsmanServiceAreaMapper;
    private final CraftsmanCertificateMapper craftsmanCertificateMapper;
    private final SkillMapper skillMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCraftsman(CraftsmanCreateDTO dto) {
        Craftsman craftsman = buildCraftsmanFromDto(dto);
        save(craftsman);
        Long craftsmanId = craftsman.getId();

        saveSkills(craftsmanId, dto.getServiceSkillIds());
        saveBrands(craftsmanId, dto.getBrands());
        saveServiceAreas(craftsmanId, dto.getServiceAreas(), dto.getServiceAreaLabels());
        saveCertificates(craftsmanId, dto.getCertificates());

        return craftsmanId;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCraftsman(Long id, CraftsmanCreateDTO dto) {
        Craftsman exist = getById(id);
        if (exist == null) {
            throw new IllegalArgumentException("工匠不存在: " + id);
        }

        Craftsman craftsman = buildCraftsmanFromDto(dto);
        craftsman.setId(id);
        craftsman.setCraftsmanCode(exist.getCraftsmanCode());
        craftsman.setRegisterTime(exist.getRegisterTime());
        craftsman.setStatus(exist.getStatus());
        updateById(craftsman);

        deleteAllRelations(id);
        saveSkills(id, dto.getServiceSkillIds());
        saveBrands(id, dto.getBrands());
        saveServiceAreas(id, dto.getServiceAreas(), dto.getServiceAreaLabels());
        saveCertificates(id, dto.getCertificates());
    }

    private void deleteAllRelations(Long craftsmanId) {
        craftsmanSkillMapper.physicalDeleteByCraftsmanId(craftsmanId);
        craftsmanBrandMapper.physicalDeleteByCraftsmanId(craftsmanId);
        craftsmanServiceAreaMapper.physicalDeleteByCraftsmanId(craftsmanId);
        craftsmanCertificateMapper.physicalDeleteByCraftsmanId(craftsmanId);
    }

    @Override
    public CraftsmanEditVO getEditDetail(Long id) {
        Craftsman c = getById(id);
        if (c == null) {
            return null;
        }
        CraftsmanEditVO vo = new CraftsmanEditVO();
        vo.setId(c.getId());
        vo.setCraftsmanCode(c.getCraftsmanCode());
        vo.setName(c.getName());
        vo.setPhone(c.getPhone());
        vo.setUserAccount(c.getUserAccount());
        vo.setEmail(c.getEmail());
        vo.setServiceProviderName(c.getServiceProviderName());
        vo.setCraftsmanCategory(c.getCraftsmanCategory());
        vo.setCraftsmanType(c.getCraftsmanType());
        vo.setRegion(c.getRegion());

        vo.setIdCardNo(c.getIdCardNo());
        vo.setIdCardValidDate(c.getIdCardValidDate());
        List<String> idCardImages = splitCsv(c.getIdCardImages());
        vo.setIdCardFrontUrl(idCardImages.size() > 0 ? idCardImages.get(0) : null);
        vo.setIdCardBackUrl(idCardImages.size() > 1 ? idCardImages.get(1) : null);

        vo.setResidentialAreaCode(c.getResidentialAreaCode());
        vo.setResidentialAreaCodeList(splitCsv(c.getResidentialAreaCode()));
        vo.setResidentialAreaLabels(Collections.emptyList());
        vo.setResidentialStreet(c.getResidentialStreet());
        vo.setResidentialDetail(c.getResidentialDetail());

        List<CraftsmanServiceArea> areas = craftsmanServiceAreaMapper.selectList(
                new LambdaQueryWrapper<CraftsmanServiceArea>()
                        .eq(CraftsmanServiceArea::getCraftsmanId, id));
        vo.setServiceAreaCodes(areas.stream().map(CraftsmanServiceArea::getAreaCodes).collect(Collectors.toList()));
        vo.setServiceAreaLabels(areas.stream().map(CraftsmanServiceArea::getAreaLabels).collect(Collectors.toList()));

        List<CraftsmanSkill> skills = craftsmanSkillMapper.selectList(
                new LambdaQueryWrapper<CraftsmanSkill>()
                        .eq(CraftsmanSkill::getCraftsmanId, id));
        vo.setServiceSkillIds(skills.stream().map(CraftsmanSkill::getSkillId).collect(Collectors.toList()));

        List<CraftsmanBrand> brands = craftsmanBrandMapper.selectList(
                new LambdaQueryWrapper<CraftsmanBrand>()
                        .eq(CraftsmanBrand::getCraftsmanId, id));
        vo.setBrands(brands.stream().map(CraftsmanBrand::getBrandValue).collect(Collectors.toList()));

        List<CraftsmanCertificate> certs = craftsmanCertificateMapper.selectList(
                new LambdaQueryWrapper<CraftsmanCertificate>()
                        .eq(CraftsmanCertificate::getCraftsmanId, id));
        Map<String, List<String>> certMap = new LinkedHashMap<>();
        for (CraftsmanCertificate cert : certs) {
            certMap.put(cert.getCertificateType(), splitCsv(cert.getImageUrls()));
        }
        vo.setCertificates(certMap);

        List<String> workCerts = splitCsv(c.getWorkCertificate());
        List<String> serviceRecords = splitCsv(c.getServiceRecord());
        if (!workCerts.isEmpty()) {
            vo.setWorkProofType(1);
            vo.setWorkCertificate(workCerts);
            vo.setServiceRecord(Collections.emptyList());
        } else if (!serviceRecords.isEmpty()) {
            vo.setWorkProofType(2);
            vo.setWorkCertificate(Collections.emptyList());
            vo.setServiceRecord(serviceRecords);
        } else {
            vo.setWorkProofType(1);
            vo.setWorkCertificate(Collections.emptyList());
            vo.setServiceRecord(Collections.emptyList());
        }
        vo.setNoCriminalCertificate(splitCsv(c.getNoCriminalCertificate()));

        return vo;
    }

    @Override
    public List<CraftsmanListVO> toListVO(List<Craftsman> craftsmen) {
        if (craftsmen == null || craftsmen.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> craftsmanIds = craftsmen.stream()
                .map(Craftsman::getId)
                .collect(Collectors.toList());

        // 1. 一次查中间表：craftsman_id IN (...) AND deleted=0（@TableLogic 自动加 deleted=0）
        List<CraftsmanSkill> relations = craftsmanSkillMapper.selectList(
                new LambdaQueryWrapper<CraftsmanSkill>()
                        .in(CraftsmanSkill::getCraftsmanId, craftsmanIds));

        // 查证书（按技能的 certificateType 分组）
        List<CraftsmanCertificate> allCerts = craftsmanCertificateMapper.selectList(
                new LambdaQueryWrapper<CraftsmanCertificate>()
                        .in(CraftsmanCertificate::getCraftsmanId, craftsmanIds));
        Map<Long, List<CraftsmanCertificate>> certsByCraftsman = allCerts.stream()
                .collect(Collectors.groupingBy(CraftsmanCertificate::getCraftsmanId));

        // 查品牌（按 craftsman_id 分组，拼接 brand_value，逗号分隔）
        List<CraftsmanBrand> allBrands = craftsmanBrandMapper.selectList(
                new LambdaQueryWrapper<CraftsmanBrand>()
                        .in(CraftsmanBrand::getCraftsmanId, craftsmanIds));
        Map<Long, String> brandNamesByCraftsman = allBrands.stream()
                .collect(Collectors.groupingBy(
                        CraftsmanBrand::getCraftsmanId,
                        LinkedHashMap::new,
                        Collectors.mapping(
                                CraftsmanBrand::getBrandValue,
                                Collectors.filtering(
                                        v -> v != null && !v.isEmpty(),
                                        Collectors.joining(",")))));

        // 没有任何技能关联，直接返回纯主表字段
        if (relations.isEmpty()) {
            return craftsmen.stream()
                    .map(c -> {
                        CraftsmanListVO vo = convertToListVO(c);
                        vo.setBrandNames(brandNamesByCraftsman.get(c.getId()));
                        return vo;
                    })
                    .collect(Collectors.toList());
        }

        // 2. 一次查 skill 表：id IN (...) AND deleted=0
        List<Long> skillIds = relations.stream()
                .map(CraftsmanSkill::getSkillId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Skill> skillMap = skillMapper.selectList(
                new LambdaQueryWrapper<Skill>()
                        .in(Skill::getId, skillIds))
                .stream()
                .collect(Collectors.toMap(Skill::getId, s -> s, (a, b) -> a));

        // 3. 按 craftsman_id 分组，拼接 skill_name 和 example_image
        Map<Long, List<Long>> skillsByCraftsman = relations.stream()
                .collect(Collectors.groupingBy(
                        CraftsmanSkill::getCraftsmanId,
                        LinkedHashMap::new,
                        Collectors.mapping(CraftsmanSkill::getSkillId, Collectors.toList())));

        LinkedHashSet<String> imageAccumulator = new LinkedHashSet<>();
        List<CraftsmanListVO> result = new ArrayList<>(craftsmen.size());
        for (Craftsman c : craftsmen) {
            CraftsmanListVO vo = convertToListVO(c);
            vo.setBrandNames(brandNamesByCraftsman.get(c.getId()));
            List<Long> skillIdList = skillsByCraftsman.get(c.getId());
            if (skillIdList != null && !skillIdList.isEmpty()) {
                List<String> names = new ArrayList<>();
                imageAccumulator.clear();
                List<CraftsmanCertificate> myCerts = certsByCraftsman.get(c.getId());
                Map<String, String> certImageByType = new java.util.HashMap<>();
                if (myCerts != null) {
                    for (CraftsmanCertificate cert : myCerts) {
                        if (cert.getCertificateType() != null && cert.getImageUrls() != null && !cert.getImageUrls().isEmpty()) {
                            certImageByType.putIfAbsent(cert.getCertificateType(), cert.getImageUrls());
                        }
                    }
                }
                List<CraftsmanListVO.CertificateItem> certItems = new ArrayList<>();
                for (Long skillId : skillIdList) {
                    Skill skill = skillMap.get(skillId);
                    if (skill == null) continue;
                    if (skill.getSkillName() != null && !skill.getSkillName().isEmpty()) {
                        names.add(skill.getSkillName());
                    }
                    if (skill.getExampleImage() != null && !skill.getExampleImage().isEmpty()) {
                        for (String img : skill.getExampleImage().split(",")) {
                            String trimmed = img.trim();
                            if (!trimmed.isEmpty()) {
                                imageAccumulator.add(trimmed);
                            }
                        }
                    }
                    String certType = skill.getCertificateType();
                    if (certType != null && !certType.isEmpty()) {
                        CraftsmanListVO.CertificateItem item = new CraftsmanListVO.CertificateItem();
                        item.setSkillName(skill.getSkillName());
                        item.setCertificateType(certType);
                        item.setCertificateImage(certImageByType.getOrDefault(certType, ""));
                        item.setCategory1(skill.getCategory1());
                        item.setCategory2(skill.getCategory2());
                        item.setCategory3(skill.getCategory3());
                        certItems.add(item);
                    }
                }
                vo.setServiceSkillNames(String.join(",", names));
                vo.setServiceSkillImages(String.join(",", imageAccumulator));
                vo.setCertificates(certItems);
            }
            result.add(vo);
        }
        return result;
    }

    private CraftsmanListVO convertToListVO(Craftsman c) {
        CraftsmanListVO vo = new CraftsmanListVO();
        vo.setId(c.getId());
        vo.setCraftsmanCode(c.getCraftsmanCode());
        vo.setName(c.getName());
        vo.setPhone(c.getPhone());
        vo.setUserAccount(c.getUserAccount());
        vo.setEmail(c.getEmail());
        vo.setServiceProviderName(c.getServiceProviderName());
        vo.setSourceChannel(c.getSourceChannel());
        vo.setCraftsmanCategory(c.getCraftsmanCategory());
        vo.setCraftsmanType(c.getCraftsmanType());
        vo.setRegion(c.getRegion());
        vo.setServiceSkills(c.getServiceSkills());
        vo.setRegisterTime(c.getRegisterTime());
        vo.setStatus(c.getStatus());
        vo.setBirthday(c.getBirthday());
        vo.setIdCardNo(c.getIdCardNo());
        vo.setAge(c.getAge());
        vo.setResidentialAddress(c.getResidentialAddress());
        vo.setResidentialAreaCode(c.getResidentialAreaCode());
        vo.setResidentialStreet(c.getResidentialStreet());
        vo.setResidentialDetail(c.getResidentialDetail());
        vo.setIdCardValidDate(c.getIdCardValidDate());
        vo.setServiceArea(c.getServiceArea());
        vo.setIdCardImages(c.getIdCardImages());
        vo.setWorkCertificate(c.getWorkCertificate());
        vo.setServiceRecord(c.getServiceRecord());
        vo.setNoCriminalCertificate(c.getNoCriminalCertificate());
        vo.setCreateTime(c.getCreateTime());
        vo.setUpdateTime(c.getUpdateTime());
        return vo;
    }

    private List<String> splitCsv(String csv) {
        if (csv == null || csv.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private Craftsman buildCraftsmanFromDto(CraftsmanCreateDTO dto) {
        Craftsman c = new Craftsman();
        c.setCraftsmanCode(generateCraftsmanCode());
        c.setName(dto.getName());
        c.setPhone(dto.getPhone());
        c.setUserAccount(dto.getUserAccount());
        c.setEmail(dto.getEmail());
        c.setCraftsmanCategory(dto.getCraftsmanCategory());
        c.setCraftsmanType(dto.getCraftsmanType());
        c.setServiceProviderName(dto.getServiceProviderName());
        c.setRegion(dto.getRegion());
        c.setIdCardNo(dto.getIdCardNo());
        c.setIdCardImages(joinNonEmpty(dto.getIdCardFrontUrl(), dto.getIdCardBackUrl()));

        if (dto.getIdCardNo() != null && dto.getIdCardNo().length() >= 14) {
            String idCard = dto.getIdCardNo();
            String birthStr = idCard.substring(6, 14);
            try {
                String year = birthStr.substring(0, 4);
                String month = birthStr.substring(4, 6);
                String day = birthStr.substring(6, 8);
                String birthday = year + "-" + month + "-" + day;
                c.setBirthday(birthday);
                java.time.LocalDate birthDate = java.time.LocalDate.of(
                        Integer.parseInt(year), Integer.parseInt(month), Integer.parseInt(day));
                int age = java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
                c.setAge(age);
            } catch (Exception ignored) {
            }
        }

        c.setResidentialAddress(buildResidentialAddress(dto));
        c.setResidentialAreaCode(joinList(dto.getResidentialArea() == null ? null :
                dto.getResidentialArea().stream().map(String::valueOf).collect(Collectors.toList())));
        c.setResidentialStreet(dto.getResidentialStreet());
        c.setResidentialDetail(dto.getResidentialDetail());
        c.setIdCardValidDate(dto.getIdCardValidDate());

        c.setServiceSkills(dto.getServiceSkillIds() == null ? "" :
                dto.getServiceSkillIds().stream().map(String::valueOf).collect(Collectors.joining(",")));

        String areaStr = dto.getServiceAreaLabels() == null ? "" : String.join(";", dto.getServiceAreaLabels());
        c.setServiceArea(areaStr);

        c.setWorkCertificate(joinList(dto.getWorkCertificate()));
        c.setServiceRecord(joinList(dto.getServiceRecord()));
        c.setNoCriminalCertificate(joinList(dto.getNoCriminalCertificate()));

        c.setRegisterTime(LocalDateTime.now());
        c.setStatus(1);
        return c;
    }

    private String buildResidentialAddress(CraftsmanCreateDTO dto) {
        List<String> parts = new ArrayList<>();
        if (dto.getResidentialAreaLabels() != null) {
            dto.getResidentialAreaLabels().forEach(p -> { if (p != null && !p.isEmpty()) parts.add(p); });
        }
        if (dto.getResidentialStreet() != null && !dto.getResidentialStreet().isEmpty()) {
            parts.add(dto.getResidentialStreet());
        }
        if (dto.getResidentialDetail() != null && !dto.getResidentialDetail().isEmpty()) {
            parts.add(dto.getResidentialDetail());
        }
        return String.join("", parts);
    }

    private void saveSkills(Long craftsmanId, List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return;
        for (Long skillId : skillIds) {
            CraftsmanSkill cs = new CraftsmanSkill();
            cs.setCraftsmanId(craftsmanId);
            cs.setSkillId(skillId);
            craftsmanSkillMapper.insert(cs);
        }
    }

    private void saveBrands(Long craftsmanId, List<String> brands) {
        if (brands == null || brands.isEmpty()) return;
        for (String brand : brands) {
            CraftsmanBrand cb = new CraftsmanBrand();
            cb.setCraftsmanId(craftsmanId);
            cb.setBrandValue(brand);
            craftsmanBrandMapper.insert(cb);
        }
    }

    private void saveServiceAreas(Long craftsmanId, List<String> areas, List<String> labels) {
        if (areas == null || areas.isEmpty()) return;
        for (int i = 0; i < areas.size(); i++) {
            CraftsmanServiceArea csa = new CraftsmanServiceArea();
            csa.setCraftsmanId(craftsmanId);
            csa.setAreaCodes(areas.get(i));
            csa.setAreaLabels(labels != null && i < labels.size() ? labels.get(i) : null);
            craftsmanServiceAreaMapper.insert(csa);
        }
    }

    private void saveCertificates(Long craftsmanId, Map<String, String> certificates) {
        if (certificates == null || certificates.isEmpty()) return;
        certificates.forEach((type, urls) -> {
            if (urls == null || urls.isEmpty()) return;
            CraftsmanCertificate cc = new CraftsmanCertificate();
            cc.setCraftsmanId(craftsmanId);
            cc.setCertificateType(type);
            cc.setImageUrls(urls);
            craftsmanCertificateMapper.insert(cc);
        });
    }

    private String joinList(List<String> list) {
        if (list == null || list.isEmpty()) return "";
        return String.join(",", list);
    }

    private String joinNonEmpty(String... vals) {
        List<String> parts = new ArrayList<>();
        for (String v : vals) {
            if (v != null && !v.isEmpty()) parts.add(v);
        }
        return String.join(",", parts);
    }

    private String generateCraftsmanCode() {
        int year = java.time.Year.now().getValue();
        String prefix = "CM" + year;
        LambdaQueryWrapper<Craftsman> query = new LambdaQueryWrapper<>();
        query.likeRight(Craftsman::getCraftsmanCode, prefix);
        long count = count(query);
        int nextSeq = (int) count + 1;
        while (true) {
            String code = String.format("CM%d%05d", year, nextSeq);
            LambdaQueryWrapper<Craftsman> existQuery = new LambdaQueryWrapper<>();
            existQuery.eq(Craftsman::getCraftsmanCode, code);
            if (count(existQuery) == 0) {
                return code;
            }
            nextSeq++;
        }
    }
}
