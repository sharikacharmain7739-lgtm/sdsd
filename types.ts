

export enum ClientType {
  PARENT = '家长',
  ADULT_STUDENT = '成人学员',
}

export enum ClientStatus {
  REGULAR = '正课学员',
  TRIAL = '试听学员',
  LEAD = '咨询学员',
  CHURNED = '流失学员',
}

export enum CourseType {
  PIANO = '钢琴',
  VOCAL = '声乐',
  GUITAR = '吉他',
  UKULELE = '尤克里里',
  PIANO_PRACTICE = '钢琴陪练',
  PIANO_SINGING = '钢琴弹唱',
}

// Based on the provided image
export enum PackageLevel {
  STANDARD = '标准包 (16课时)',
  PREMIUM = '优享包 (26+2课时)',
  ADVANCED = '进阶包 (30+2课时)',
  SUPREME = '尊享包 (42+6课时)',
}

export interface PackageDetails {
  name: string;
  lessons: number;
  bonus: number;
  priceOnSite: number;
  unitPrice: number;
}

// --- Class Feedback Types ---

export enum FeedbackStyle {
    ENCOURAGING = '鼓励型', // 热情、正向
    INSTRUCTIONAL = '指导型', // 给出具体改进建议
    PROFESSIONAL = '专业型', // 客观、严谨
}

export enum TargetAudienceMode {
    CHILD = '儿童模式 (向家长汇报)', 
    TEEN = '青少年模式 (成熟鼓励)', 
    ADULT = '成人模式 (专业直接)'
}

export interface PerformanceMetric {
    id: string;
    name: string; // e.g. "音准", "节奏"
    value: string; // e.g. "良好", "有偏差"
    options?: string[]; // Optional preset options for dropdown
}

export interface FeedbackConfig {
    targetMode?: TargetAudienceMode;
    previousFeedbackTemplate?: string;
    customMetrics?: PerformanceMetric[];
}

export interface ClientProfile {
  id: string;
  name: string; // Parent or Student Name
  clientType: ClientType;
  status: ClientStatus; // Status Category
  
  // Demographics
  age?: number; // Parent or Adult Student Age
  gender?: string; // Male/Female
  occupation?: string; // Optional
  
  childName?: string; // Optional if Adult
  childAge?: number;
  childGender?: '男' | '女' | '未知'; // New field
  address: string;
  course: CourseType;
  addDate: number; // Timestamp for sorting
  
  // Package & Lesson details
  currentPackage: PackageLevel;
  remainingLessons: number; // Primary sorting key for Regular
  trialRemainingLessons?: number; // Primary sorting key for Trial
  otherPackages?: string; // Remark for other packages
  weeklyFrequency?: string; // e.g. "2" or "1-2"
  
  // Visual Data & Deep Analysis
  profileScreenshots?: string[]; // Array of base64 strings (WeChat profile, etc.)
  personalityNotes?: string; // Manual notes about personality
  personalityAnalysis?: PersonalityAnalysisResult; // Persisted AI Analysis Result

  // Tags (Multi-select)
  studentPersonality: string[];
  learningState: string[];
  parentFocus: string[]; // Or Student Focus if adult
  otherInfo: string;
  
  // Historical context
  historySummary: string;
  
  // Saved Preferences for Feedback Generator
  feedbackConfig?: FeedbackConfig;
}

export interface AnalysisResult {
  emotionalTone: string;
  keyConcerns: string[];
  suggestedPackage?: PackageLevel;
  strategies: {
    title: string;
    content: string;
    principle: string; // e.g., "Reciprocity", "Social Proof"
  }[];
  // New: Specific reply suggestions
  replySuggestions: {
      detailed: string; // 具体/详细建议
      brief: string;    // 简短建议
  };
  profileUpdateSuggestion?: Partial<ClientProfile>;
  interactionSummary: string; // New field for auto-updating history
}

export interface MBTIAnalysis {
  type: string; // e.g. "ENFP - 竞选者"
  description: string; // Brief description based on Gifts Differing
  cognitiveStyle: string; // How they process info (S/N) and decide (T/F)
  teachingAdvice: string; // Specific advice for teachers interacting with this type
}

export interface ChildInteractionGuide {
  personalityAnalysis: string; // New: Child's personality summary
  mbti?: MBTIAnalysis; // New: Child's MBTI
  rewardMechanisms: string[];  // New: What motivates them
  toyTypes: string[];          // New: Preferred toys
  dos: string[];
  donts: string[];
  winningStrategy: string; // 成交必杀技 (针对孩子)
}

export interface PersonalityAnalysisResult {
  summary: string;
  tags: string[];
  communicationStyle: string;
  mbti?: MBTIAnalysis; // New MBTI Section
  dos: string[];
  donts: string[];
  closingStrategy: string;
  childInteractionGuide?: ChildInteractionGuide; // Optional, mostly for parents
}

export type InputPerspective = 'PARENT' | 'TEACHER';

export interface FeedbackResult {
    learningContentSummary: string;
    variations: {
        style: string;
        content: string;
    }[];
}

// --- Activity Planner Types ---

export type ActivityCategory = 'FESTIVAL' | 'ROUTINE';

export type ActivityStyle = 'RITUAL' | 'FUN' | 'SKILL' | 'STAGE';

export interface InventoryItem {
    name: string;
    price: number;
}

export interface ActivityCostConfig {
    floorPrice: number;
    budgetCapPercent: number;
    preferredStyle: ActivityStyle;
    gifts: InventoryItem[];
    materials: InventoryItem[];
}

export interface ActivityPlan {
  theme: string;
  personaSummary: string;
  smartStrategy: string;
  marketOpportunities: string[];
  successProbability: string;
  financialAnalysis: {
    suggestedPrice: number;
    totalCost: number;
    profit: number;
    breakdown: {
      gifts: InventoryItem[];
      materials: InventoryItem[];
    };
  };
  contentDesign: {
    highlights: string[];
    parentAppeal: string;
    renewalMechanism: string;
  };
  operationalSOP: {
    preEvent: string[];
    duringEvent: string[];
    postEvent: string[];
  };
  reusableTemplates: {
    privateMessageTemplate: string;
  };
}

export interface ActivityChatMessage {
    role: 'user' | 'model';
    content: string;
    files?: string[];
    plan?: ActivityPlan;
}
