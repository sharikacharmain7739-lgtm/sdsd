
import { PackageLevel, PackageDetails, CourseType, ClientStatus, PerformanceMetric } from './types';

export const COURSE_OPTIONS = Object.values(CourseType);
export const CLIENT_STATUS_OPTIONS = Object.values(ClientStatus);

export const PACKAGE_DATA: Record<PackageLevel, PackageDetails> = {
  [PackageLevel.STANDARD]: { name: '标准包', lessons: 16, bonus: 0, priceOnSite: 2860, unitPrice: 178 },
  [PackageLevel.PREMIUM]: { name: '优享包', lessons: 26, bonus: 2, priceOnSite: 4800, unitPrice: 171.4 },
  [PackageLevel.ADVANCED]: { name: '进阶包', lessons: 30, bonus: 2, priceOnSite: 5200, unitPrice: 165 },
  [PackageLevel.SUPREME]: { name: '尊享包', lessons: 42, bonus: 6, priceOnSite: 7200, unitPrice: 150 },
};

export const PERSONALITY_TAGS = [
  '内向害羞', '外向活泼', '敏感细腻', '好胜心强', '专注力高', '容易分心', '需要鼓励', '抗压能力弱'
];

export const LEARNING_STATE_TAGS = [
  '兴趣浓厚', '瓶颈期', '产生厌学', '考级冲刺', '回课质量高', '练习频率低', '需家长督促', '即将结课', '初次接触', '犹豫不决', '对比价格', '体验良好'
];

export const PARENT_FOCUS_TAGS = [
  '考级证书', '兴趣培养', '提升气质', '价格敏感', '重视师资', '距离远近', '注重服务', '升学加分', '上课时间', '退费政策'
];

// --- New: Unified Rating Scales ---
export const RATING_SCALES = {
    GENERAL_LEVEL: ['优秀 (S)', '良好 (A)', '合格 (B)', '需加油 (C)'],
    MASTERY: ['完全掌握', '基本掌握', '熟练度不足', '未掌握'],
    FREQUENCY: ['总是', '经常', '偶尔', '从不'],
    INTONATION: ['音准完美', '基本准确', '偶有跑调', '音准偏差大', '找不到调'],
    RHYTHM: ['节奏精准', '基本稳定', '忽快忽慢', '卡顿严重', '完全错乱'],
    HAND_SHAPE: ['手型标准', '较为放松', '偶有折指', '手腕僵硬', '手型塌陷'],
    EMOTION: ['情感充沛', '自然流畅', '略显平淡', '机械生硬'],
    ATTITUDE: ['非常积极', '配合度高', '注意力分散', '抗拒练习'],
    HOMEWORK: ['高质量完成', '按时完成', '完成度一般', '未完成'],
    READING: ['视奏流畅', '读谱较快', '读谱吃力', '不识谱'],
};

// Mapping for UI display
export const RATING_SCALE_LABELS: Record<keyof typeof RATING_SCALES, string> = {
    GENERAL_LEVEL: '综合评级',
    MASTERY: '掌握程度',
    FREQUENCY: '频率/频次',
    INTONATION: '音准',
    RHYTHM: '节奏',
    HAND_SHAPE: '手型状态',
    EMOTION: '情感表达',
    ATTITUDE: '课堂态度',
    HOMEWORK: '作业完成',
    READING: '识谱能力',
};

// Default Metrics by Course
export const DEFAULT_PERFORMANCE_METRICS: Record<CourseType, PerformanceMetric[]> = {
    [CourseType.PIANO]: [
        { id: 'p1', name: '手型状态', value: '较为放松', options: RATING_SCALES.HAND_SHAPE },
        { id: 'p2', name: '识谱能力', value: '读谱较快', options: RATING_SCALES.READING },
        { id: 'p3', name: '音准控制', value: '基本准确', options: RATING_SCALES.INTONATION },
        { id: 'p4', name: '节奏稳定性', value: '基本稳定', options: RATING_SCALES.RHYTHM },
        { id: 'p5', name: '音乐表现力', value: '自然流畅', options: RATING_SCALES.EMOTION },
        { id: 'p6', name: '练琴态度', value: '配合度高', options: RATING_SCALES.ATTITUDE },
    ],
    [CourseType.VOCAL]: [
        { id: 'v1', name: '音准音高', value: '基本准确', options: RATING_SCALES.INTONATION },
        { id: 'v2', name: '气息支撑', value: '基本掌握', options: RATING_SCALES.MASTERY },
        { id: 'v3', name: '咬字吐字', value: '良好 (A)', options: RATING_SCALES.GENERAL_LEVEL },
        { id: 'v4', name: '节奏律动', value: '基本稳定', options: RATING_SCALES.RHYTHM },
        { id: 'v5', name: '舞台表现', value: '自然流畅', options: RATING_SCALES.EMOTION },
    ],
    [CourseType.GUITAR]: [
        { id: 'g1', name: '左手按弦', value: '基本掌握', options: RATING_SCALES.MASTERY },
        { id: 'g2', name: '右手拨弦/扫弦', value: '基本稳定', options: RATING_SCALES.RHYTHM },
        { id: 'g3', name: '和弦转换', value: '熟练度不足', options: RATING_SCALES.MASTERY },
        { id: 'g4', name: '节奏感', value: '基本稳定', options: RATING_SCALES.RHYTHM },
        { id: 'g5', name: '读谱能力', value: '读谱较快', options: RATING_SCALES.READING },
    ],
    [CourseType.UKULELE]: [
        { id: 'u1', name: '扫弦节奏', value: '轻快', options: ['富有弹性', '轻快', '准确', '僵硬', '节奏乱'] },
        { id: 'u2', name: '左手按弦', value: '清晰', options: ['清晰', '适中', '虚按', '杂音较多'] },
        { id: 'u3', name: '弹唱配合', value: '基本掌握', options: RATING_SCALES.MASTERY },
        { id: 'u4', name: '课堂状态', value: '非常积极', options: RATING_SCALES.ATTITUDE },
    ],
    [CourseType.PIANO_PRACTICE]: [
        { id: 'pp1', name: '识谱准确度', value: '基本准确', options: RATING_SCALES.INTONATION },
        { id: 'pp2', name: '练习效率', value: '良好 (A)', options: RATING_SCALES.GENERAL_LEVEL },
        { id: 'pp3', name: '错音纠正', value: '基本掌握', options: RATING_SCALES.MASTERY },
        { id: 'pp4', name: '手型保持', value: '较为放松', options: RATING_SCALES.HAND_SHAPE },
    ],
    [CourseType.PIANO_SINGING]: [
        { id: 'ps1', name: '弹唱协调性', value: '基本掌握', options: RATING_SCALES.MASTERY },
        { id: 'ps2', name: '音准', value: '基本准确', options: RATING_SCALES.INTONATION },
        { id: 'ps3', name: '伴奏稳定性', value: '基本稳定', options: RATING_SCALES.RHYTHM },
        { id: 'ps4', name: '情感投入', value: '自然流畅', options: RATING_SCALES.EMOTION },
    ],
};

// Activity Planner Constants
export const FESTIVALS = [
  '春节', '元宵节', '妇女节', '母亲节', '儿童节', '父亲节', '端午节', '教师节', '中秋节', '国庆节', '万圣节', '感恩节', '圣诞节', '元旦'
];

export const ROUTINE_THEMES = [
  '月度生日会', '季度汇演', '开学典礼', '结课仪式', '家长开放日', '户外研学', '老带新推荐礼', '续费大转盘', '考级模拟考', '大师班'
];
