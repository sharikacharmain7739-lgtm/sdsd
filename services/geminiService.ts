
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ClientProfile, AnalysisResult, PackageLevel, ClientStatus, PersonalityAnalysisResult, ClientType, InputPerspective, FeedbackResult, PerformanceMetric, TargetAudienceMode, ActivityPlan, ActivityChatMessage } from "../types";
import { PACKAGE_DATA } from "../constants";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeInteraction = async (
  chatImagesBase64: string[], 
  textInput: string,
  profile: ClientProfile,
  inputPerspective: InputPerspective = 'PARENT',
  modelName: string = "gemini-2.5-flash"
): Promise<AnalysisResult> => {
  const ai = getGeminiClient();

  const priceListContext = JSON.stringify(PACKAGE_DATA, null, 2);
  const personalityContext = profile.personalityAnalysis 
    ? `
      **【重要】已有的AI性格深度画像**:
      - 性格总结: ${profile.personalityAnalysis.summary}
      - MBTI类型: ${profile.personalityAnalysis.mbti?.type || '未知'} (${profile.personalityAnalysis.mbti?.cognitiveStyle || ''})
      - 沟通风格: ${profile.personalityAnalysis.communicationStyle}
      - 推荐做法: ${profile.personalityAnalysis.dos.join(', ')}
      - 禁忌雷区: ${profile.personalityAnalysis.donts.join(', ')}
      - 成交策略: ${profile.personalityAnalysis.closingStrategy}
      - 补充备注: ${profile.personalityNotes || '无'}
      ${profile.personalityAnalysis.childInteractionGuide ? `
      - 孩子MBTI: ${profile.personalityAnalysis.childInteractionGuide.mbti?.type || '未知'}
      - 孩子性格: ${profile.personalityAnalysis.childInteractionGuide.personalityAnalysis}
      ` : ''}
    ` 
    : `暂无深度性格画像，请根据现有标签(${profile.studentPersonality.join(',')})推断。`;
  
  const perspectiveInstruction = inputPerspective === 'PARENT'
    ? `**当前输入视角**: 【家长/学员发来的消息】
       - 场景: 顾问收到了家长的消息/截图。
       - 任务: 分析家长的言外之意、情绪和诉求，并生成顾问的【回复策略】。
       - 策略方向: 解释、安抚、回答问题、处理异议。`
    : `**当前输入视角**: 【老师提出的问题 或 老师的草稿】
       - 场景: 老师(例如黄老师)遇到了教学困难，询问"如何教学？"、"如何相处？"，或者老师想给家长发一段话请求润色。
       - 角色设定: 你是该老师的**高级督导/教育心理学顾问**。
       - 任务: 
         1. 如果输入是提问 (如"这孩子怎么教?"): 请利用档案中的 **MBTI分析** (包括家长和孩子的MBTI) 和 **性格画像**，给出具体的教学方法、相处模式建议。
         2. 如果输入是草稿 (如"帮我催费"): 请润色成高情商、符合家长性格的话术。
       - 策略方向: 教学指导、心理分析、沟通润色、专业建议。`;

  const systemPrompt = `
    你是一位世界级的教育咨询顾问和销售专家，深谙《演讲的艺术》、《影响力》和《先发制人》等书中的沟通心理学。
    
    **你的任务**:
    1. **识别身份与目标**: 
       - 当前客户身份是: 【${profile.status}】。
       - 如果是【正课学员】，目标是续费、消课或解决教学问题。
       - 如果是【试听学员】，目标是**转化成正课**，分析试听体验，消除疑虑，根据试听剩余课时(${profile.trialRemainingLessons})制造紧迫感。
       - 如果是【咨询学员】，目标是**邀约试听**或直接成单，根据添加时间(${new Date(profile.addDate).toLocaleDateString()})判断跟进节奏。
       - 如果是【流失学员】，目标是**召回/复购**，了解流失原因，提供回流优惠或新活动。
    
    2. **处理视角 (核心逻辑)**:
       ${perspectiveInstruction}

    3. **结合档案与历史 (寻找最优解的核心依据)**: 
       - 客户基本面: ${profile.name}, ${profile.age ? profile.age + '岁' : ''} ${profile.gender || ''}, 职业: ${profile.occupation || '未知'}。
       - **深度性格画像**: ${personalityContext}
       - 关注点: ${profile.parentFocus.join(', ')}
       - 历史摘要: ${profile.historySummary || '暂无'}
    
    4. **销售预测与课包推荐**: 
       - 结合【价格表逻辑】推荐课包。
       - 针对"价格敏感"家长，重点推算单价和赠课。
       - 针对"注重效果"家长，重点强调进阶包/尊享包的长期规划价值。
       - 结合职业特点（如会计可能注重性价比，医生/高管可能注重效率和服务）调整话术。

    5. **生成输出**: 
       - 3种回复/发送策略原则。
       - **重点**: 提供【两个版本的具体回复文案】：
         - **详细建议版**: 包含寒暄、共情、解释逻辑、解决方案和结尾升华，适合正式或需要深度沟通的场景。
         - **简短建议版**: 直击要点、高效、不失礼貌，适合微信快速回复或忙碌家长。

    **价格表参考 (JSON)**:
    ${priceListContext}

    **学员档案详情**:
    - 称呼: ${profile.name} (${profile.clientType})
    - 状态: ${profile.status}
    - 孩子: ${profile.childName || '无'} (年龄: ${profile.childAge})
    - 课程: ${profile.course}
    - 剩余正课: ${profile.remainingLessons}
    - 剩余试听: ${profile.trialRemainingLessons || 0}
    - 上课频率: ${profile.weeklyFrequency || '未知'}
    - 其他课包: ${profile.otherPackages || '无'}
    - 学习状态: ${profile.learningState.join(', ')}
    - 其他备注: ${profile.otherInfo}

    **本次输入内容**:
    ${textInput ? `老师输入: "${textInput}"` : ''}

    **回复要求**:
    - 策略必须符合《影响力》原则（互惠、承诺一致、社会认同、喜好、权威、稀缺）。
    - 语气必须严格贴合【深度性格画像】中的建议（例如：如果画像说"忌啰嗦"，则回复必须简练）。
    - 如果老师是在提问教学方法，请直接引用 **MBTI理论** (${profile.personalityAnalysis?.mbti?.type || '性格类型'}) 给出具体的教学建议。
    - 语气自然、专业、绝不尴尬。
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      emotionalTone: { type: Type.STRING, description: "家长/学员当前的情绪状态 (或老师当前面临的问题本质)" },
      keyConcerns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "最关心的3个核心点" },
      suggestedPackage: { type: Type.STRING, description: "推荐的课程包名称 (标准包/优享包/进阶包/尊享包)", nullable: true },
      strategies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "策略名称 (例如: 互惠式开场 / 针对INFP的教学调整)" },
            content: { type: Type.STRING, description: "生成的具体话术内容或教学建议，不要带引号" },
            principle: { type: Type.STRING, description: "使用的心理学原理或MBTI认知功能" },
          },
          required: ["title", "content", "principle"],
        },
      },
      replySuggestions: {
        type: Type.OBJECT,
        description: "提供两个版本的回复建议供老师选择",
        properties: {
          detailed: { type: Type.STRING, description: "完整、详尽的回复建议，包含寒暄、共情、解释和结尾" },
          brief: { type: Type.STRING, description: "简短、高效的回复建议，适用于快速响应" }
        },
        required: ["detailed", "brief"]
      },
      profileUpdateSuggestion: {
        type: Type.OBJECT,
        description: "基于对话和资料截图，建议更新的档案字段",
        properties: {
          learningState: { type: Type.ARRAY, items: { type: Type.STRING } },
          parentFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
          studentPersonality: { type: Type.ARRAY, items: { type: Type.STRING }, description: "从截图推断出的新性格标签" },
          otherInfo: { type: Type.STRING },
        },
        nullable: true,
      },
      interactionSummary: {
        type: Type.STRING,
        description: "本次互动的简要记录，将自动追加到历史摘要中。格式示例：[日期] [视角] 摘要内容..."
      }
    },
    required: ["emotionalTone", "keyConcerns", "strategies", "replySuggestions", "interactionSummary"],
  };

  try {
    const parts: any[] = [{ text: systemPrompt }];
    
    if (chatImagesBase64 && chatImagesBase64.length > 0) {
        chatImagesBase64.forEach(img => {
            const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
            parts.push({
                inlineData: {
                  mimeType: "image/jpeg",
                  data: cleanBase64
                }
            });
        });
    }

    if (profile.profileScreenshots && profile.profileScreenshots.length > 0) {
        profile.profileScreenshots.forEach(img => {
            const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
            if (cleanBase64) {
                parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: cleanBase64
                    }
                });
            }
        });
    }

    if ((!chatImagesBase64 || chatImagesBase64.length === 0) && !textInput && (!profile.profileScreenshots || profile.profileScreenshots.length === 0)) {
        throw new Error("请至少提供聊天截图或文本描述");
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    } else {
        throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzePersonalityFromImages = async (
  profileImagesBase64: string[],
  profileNotes: string,
  chatImagesBase64: string[], 
  chatText: string,
  profile: ClientProfile,
  modelName: string = "gemini-2.5-flash"
): Promise<PersonalityAnalysisResult> => {
  const ai = getGeminiClient();
  
  const isParent = profile.clientType === ClientType.PARENT;
  const targetFocusInstruction = isParent 
  ? `
    **【关键核心：家长档案 - 必须以孩子为绝对中心】**:
    注意：这是一个【家长】档案。
    
    1. **分析家长**:
       - 基于《天资差异》分析家长的MBTI。
       - 生成对家长的推荐(Do's)、禁忌(Don'ts)和成交必杀技，必须强关联孩子的利益。
    
    2. **分析孩子 (新增核心任务)**:
       - 请综合聊天记录中提到的孩子行为、家长对孩子的描述、以及孩子的基本信息(${profile.childName}, ${profile.childAge}岁, 性别:${profile.childGender || '未知'})。
       - **推断孩子的MBTI类型**: 观察孩子的能量来源(E/I)、信息处理(S/N)等。如果是幼儿，观察其天性。
       - 生成 **孩子MBTI深度分析**: 描述其类型、认知风格和教学建议。
       - 生成 **孩子性格画像**: 一段话描述。
       - 生成 **推荐奖励机制** 和 **推荐玩具/IP**。
       - 生成 **对孩子的推荐做法(Do's)**、**禁忌(Don'ts)** 和 **搞定孩子的必杀技**。
    ` 
    : `
    **【成人学员档案】**:
    这是一个成人学员。重点关注**自我提升、解压、社交或专业技能**。
    - **推荐 (Do's)**: 如何让学员感到专业、放松或有成就感。
    - **禁忌 (Don'ts)**: 避免让学员感到压力、尴尬或枯燥。
    - **成交必杀技**: 强调课程带来的生活品质改变或技能变现。
    `;

  const systemPrompt = `
    你是一位顶尖的心理分析师和教育咨询专家，熟读 **《天资差异》 (Gifts Differing, 1980)** by Isabel Briggs Myers。
    
    请根据提供的【微信朋友圈/个人资料截图】(如果有) 和 【聊天记录/文本描述】，深度分析这位${profile.clientType}的性格画像。

    **分析任务**:
    1. **MBTI 深度分析 (基于荣格心理类型理论)**:
       - 观察其关注点（内部概念 vs 外部世界）判断 **E/I (外倾/内倾)**。
       - 观察其获取信息方式（具体细节 vs 宏观愿景）判断 **S/N (感觉/直觉)**。
       - 观察其决策方式（逻辑分析 vs 个人价值/和谐）判断 **T/F (思维/情感)**。
       - 观察其生活方式（计划有序 vs 灵活自发）判断 **J/P (判断/感知)**。
       - **推断其MBTI类型** (如 ESTJ, INFP)。
       - 描述其 **认知风格** (学习新事物的方式) 和 **教学/相处建议**。

    2. **性格画像**:
       - 用一句话精准概括性格核心。
       - 3-5个形容词标签。
       - 沟通风格 (直接高效、需要情绪价值、逻辑严密等)。

    3. **行为指南 (Do's & Don'ts)**:
       - 顾问在销售/服务过程中必须遵守的行为准则。
       - **成交必杀技**: 一句能击中其软肋的促单话术核心逻辑。

    ${targetFocusInstruction}

    **输入素材**:
    - 个人资料/朋友圈截图: ${profileImagesBase64.length} 张
    - 聊天记录截图: ${chatImagesBase64.length} 张
    - 文本备注/聊天内容: "${profileNotes} ${chatText}"
    - 学员信息: ${profile.name}, ${profile.age}岁, 职业:${profile.occupation || '未知'}, 关注点:${profile.parentFocus.join(',')}

    **输出格式 (JSON)**:
    请直接返回 JSON 对象，不要包含 markdown 格式标记。
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "性格核心总结" },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      communicationStyle: { type: Type.STRING },
      mbti: {
        type: Type.OBJECT,
        description: "基于《天资差异》的家长/学员MBTI分析",
        properties: {
          type: { type: Type.STRING, description: "MBTI类型代码 (如 ENFP)" },
          description: { type: Type.STRING, description: "该类型的简要描述 (如 '充满热情的竞选者')" },
          cognitiveStyle: { type: Type.STRING, description: "认知/学习风格分析" },
          teachingAdvice: { type: Type.STRING, description: "针对该类型的教学/相处建议" },
        },
        required: ["type", "description", "cognitiveStyle", "teachingAdvice"]
      },
      dos: { type: Type.ARRAY, items: { type: Type.STRING }, description: "顾问对客户的推荐做法" },
      donts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "顾问对客户的禁忌" },
      closingStrategy: { type: Type.STRING, description: "促单策略核心" },
      childInteractionGuide: {
        type: Type.OBJECT,
        nullable: true,
        properties: {
          personalityAnalysis: { type: Type.STRING, description: "孩子性格简要画像" },
          mbti: {
            type: Type.OBJECT,
            description: "基于《天资差异》的孩子MBTI分析",
            properties: {
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                cognitiveStyle: { type: Type.STRING },
                teachingAdvice: { type: Type.STRING },
            },
            required: ["type", "description", "cognitiveStyle", "teachingAdvice"]
          },
          rewardMechanisms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "推荐的奖励机制/激励手段" },
          toyTypes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "推荐的破冰玩具类型或话题IP" },
          dos: { type: Type.ARRAY, items: { type: Type.STRING }, description: "老师对孩子的推荐做法" },
          donts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "老师对孩子的禁忌" },
          winningStrategy: { type: Type.STRING, description: "搞定孩子的必杀技" }
        },
        required: ["personalityAnalysis", "mbti", "rewardMechanisms", "toyTypes", "dos", "donts", "winningStrategy"]
      }
    },
    required: ["summary", "tags", "communicationStyle", "mbti", "dos", "donts", "closingStrategy"],
  };

  try {
    const parts: any[] = [{ text: systemPrompt }];
    
    profileImagesBase64.forEach(img => {
        const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
        parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
        });
    });

    chatImagesBase64.forEach(img => {
        const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
        parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
        });
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PersonalityAnalysisResult;
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Gemini Personality Analysis Error:", error);
    throw error;
  }
};

// --- Class Feedback Generator Service ---

export const generateClassFeedback = async (
    profile: ClientProfile,
    course: string,
    learningContent: string,
    performanceMetrics: PerformanceMetric[],
    homework: string = '',
    previousFeedbackTemplate: string = '',
    studentNameOverride?: string,
    studentAgeOverride?: number,
    studentGenderOverride?: string,
    targetModeOverride?: TargetAudienceMode,
    modelName: string = "gemini-2.5-flash"
): Promise<FeedbackResult> => {
    const ai = getGeminiClient();
    
    // Detect Identity Context
    const profileIsAdult = profile.clientType === ClientType.ADULT_STUDENT || (profile.age && profile.age >= 18);
    
    // Use Overrides if provided, else fallback to profile
    const name = studentNameOverride || (profileIsAdult ? profile.name : profile.childName) || '学员';
    const age = studentAgeOverride || (profileIsAdult ? profile.age : profile.childAge) || 0;
    const gender = studentGenderOverride || (profileIsAdult ? profile.gender : profile.childGender) || '未知';
    
    // Mode Logic (Target Audience)
    let modeInstruction = '';
    if (targetModeOverride) {
        if (targetModeOverride === TargetAudienceMode.CHILD) {
             modeInstruction = `**模式: 儿童/青少年 (汇报给家长)**: 反馈主体是孩子"${name}"，接收者是家长。语气要热情、详细，多夸奖孩子的具体进步，增强家长的自豪感。`;
        } else if (targetModeOverride === TargetAudienceMode.TEEN) {
             modeInstruction = `**模式: 青少年 (成熟鼓励)**: 反馈主体是"${name}"。语气要平等、尊重，既有鼓励也要有具体的专业建议，不要太幼稚。`;
        } else {
             modeInstruction = `**模式: 成人 (专业直接)**: 反馈主体是"${name}"(学员本人)。语气要专业、尊重、客观，指出问题时要委婉且给出解决方案，强调技能的掌握。`;
        }
    } else {
        // Fallback auto-detection
        if (profileIsAdult) {
            modeInstruction = `**模式: 成人**: 这是一个成人学员。目标受众是学员本人。语气专业严谨。`;
        } else {
            modeInstruction = `**模式: 儿童**: 这是一个孩子。目标受众是家长。语气热情鼓励。`;
        }
    }

    const performanceContext = performanceMetrics.map(m => `- ${m.name}: ${m.value}`).join('\n');
    
    // Personality Context Injection
    const personalityContext = profile.personalityAnalysis 
    ? `
    **目标受众性格/沟通偏好 (非常重要)**:
    - 深度画像: ${profile.personalityAnalysis.summary}
    - 沟通风格: ${profile.personalityAnalysis.communicationStyle}
    - MBTI: ${profile.personalityAnalysis.mbti?.type || '未知'}
    - 建议做法: ${profile.personalityAnalysis.dos.join(', ')}
    `
    : `**性格标签**: ${profile.studentPersonality.join(', ')} (请根据这些标签推断语气)`;

    const systemPrompt = `
      角色：你是一位资深的真人教师，擅长用最自然、最接地气的方式与家长/学员沟通。
      
      **必须严格遵守以下规则 (违反将导致任务失败)**:

      1. **【绝对禁语：主语】**: 
         - 全文**禁止**出现 "${name}"、"你"、"他"、"她"、"学生" 作为句子开头。
         - **必须**直接以动词、形容词或名词(如"音准"、"节奏")开头。
         - 例: 不要说 "${name}今天弹得很好"，要说 "今天弹得非常有感觉"。
         - 例: 不要说 "你需要注意手型"，要说 "手型方面需要多留意"。

      2. **【视觉克隆：模板复刻】**:
         ${previousFeedbackTemplate ? `
         用户提供了参考模板。你必须成为复读机，严格复制其排版和Emoji：
         - **Emoji**: 模板里用了什么Emoji，你在对应位置必须用一模一样的。如果没有Emoji，你也不要加。
         - **空行**: 模板里哪里有空行，你哪里就必须有空行 (使用 \\n\\n)。
         - **列表**: 模板用 "1." 你就用 "1."，模板用 "●" 你就用 "●"。
         - **参考模板内容**: 
           ${previousFeedbackTemplate}
         ` : `
         无模板时，请使用通用的清晰排版，板块间必须空行。
         `}

      3. **【防黏连：强制换行】**:
         - 每一个大的板块 (如: 学习内容、课堂反馈、作业) 之间，**必须**插入一个空行 (\\n\\n)。
         - 不要把所有字挤在一起。

      4. **【真人化】**:
         - 拒绝AI腔 (综上所述、总体而言)。
         - 使用老师常用的口吻。

      **输入信息**:
      - 课程: ${course}
      - 学习内容: ${learningContent}
      - 课后作业: ${homework}
      - 评价维度:
      ${performanceContext}
      - 学员: ${age}岁, ${gender}
      ${modeInstruction}
      ${personalityContext}
      
      **输出目标**:
      生成 5 个不同风格的文案，并附带本节课的学习内容摘要。
    `;

    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            learningContentSummary: { type: Type.STRING, description: "本节课学习内容的简要、专业概述" },
            variations: {
                type: Type.ARRAY,
                description: "5个不同风格的反馈文案",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        style: { type: Type.STRING, description: "风格名称 (如: 鼓励型, 指导型, 专业型)" },
                        content: { type: Type.STRING, description: "完整的反馈文案内容 (务必包含 \\n\\n 双换行符以确保板块间有空行，确保文字不黏连)" }
                    },
                    required: ["style", "content"]
                }
            }
        },
        required: ["learningContentSummary", "variations"]
    };

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: systemPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.75,
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as FeedbackResult;
        } else {
            throw new Error("Empty response from AI");
        }
    } catch (error) {
        console.error("Gemini Feedback Generation Error:", error);
        throw error;
    }
};

export const generateActivityPlan = async (
  profiles: ClientProfile[],
  chatHistory: ActivityChatMessage[],
  instructions: string,
  modelName: string = "gemini-2.5-flash"
): Promise<ActivityPlan> => {
  const ai = getGeminiClient();

  const profileContext = profiles.map(p => 
    `- ${p.name} (${p.clientType}): ${p.course}, 剩余${p.remainingLessons}课时, 关注:${p.parentFocus.join(',')}`
  ).join('\n');

  const historyContext = chatHistory.length > 0 
    ? chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
    : "无历史对话";

  const systemPrompt = `
    你是一位专业的教育机构活动策划师。请根据以下学员画像和要求，策划一个具体的活动方案。
    
    **学员画像样本**:
    ${profileContext.slice(0, 3000)}
    
    **指令/要求**: ${instructions}
    
    **历史上下文**:
    ${historyContext}

    **策划要求**:
    1. 主题鲜明，有吸引力。
    2. 针对学员特点设计转化/续费钩子。
    3. 提供财务估算 (建议定价、成本、利润)。
    4. 生成SOP和话术。
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      theme: { type: Type.STRING },
      personaSummary: { type: Type.STRING },
      smartStrategy: { type: Type.STRING },
      marketOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
      successProbability: { type: Type.STRING },
      financialAnalysis: {
        type: Type.OBJECT,
        properties: {
          suggestedPrice: { type: Type.NUMBER },
          totalCost: { type: Type.NUMBER },
          profit: { type: Type.NUMBER },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              gifts: { 
                  type: Type.ARRAY, 
                  items: { 
                      type: Type.OBJECT, 
                      properties: { name: {type: Type.STRING}, price: {type: Type.NUMBER} },
                      required: ["name", "price"]
                  }
              },
              materials: { 
                  type: Type.ARRAY, 
                  items: { 
                      type: Type.OBJECT, 
                      properties: { name: {type: Type.STRING}, price: {type: Type.NUMBER} },
                      required: ["name", "price"]
                   }
              }
            },
            required: ["gifts", "materials"]
          }
        },
        required: ["suggestedPrice", "totalCost", "profit", "breakdown"]
      },
      contentDesign: {
        type: Type.OBJECT,
        properties: {
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          parentAppeal: { type: Type.STRING },
          renewalMechanism: { type: Type.STRING }
        },
        required: ["highlights", "parentAppeal", "renewalMechanism"]
      },
      operationalSOP: {
        type: Type.OBJECT,
        properties: {
          preEvent: { type: Type.ARRAY, items: { type: Type.STRING } },
          duringEvent: { type: Type.ARRAY, items: { type: Type.STRING } },
          postEvent: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["preEvent", "duringEvent", "postEvent"]
      },
      reusableTemplates: {
        type: Type.OBJECT,
        properties: {
          privateMessageTemplate: { type: Type.STRING }
        },
        required: ["privateMessageTemplate"]
      }
    },
    required: ["theme", "personaSummary", "smartStrategy", "financialAnalysis", "contentDesign", "operationalSOP", "reusableTemplates"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: systemPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ActivityPlan;
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Gemini Activity Plan Error:", error);
    throw error;
  }
};
