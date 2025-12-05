
import React, { useState, useEffect } from 'react';
import { ClientProfile, PerformanceMetric, FeedbackResult, CourseType, ClientType, TargetAudienceMode } from '../types';
import { DEFAULT_PERFORMANCE_METRICS, COURSE_OPTIONS, RATING_SCALES, RATING_SCALE_LABELS } from '../constants';
import { generateClassFeedback } from '../services/geminiService';
import { Sparkles, Copy, CheckCircle, Plus, X, RefreshCw, BookOpen, PenTool, ClipboardList, User, ChevronDown, Wand2, Save } from 'lucide-react';

interface ClassFeedbackGeneratorProps {
    profile: ClientProfile;
    onSaveToHistory: (summary: string) => void;
    onSave: () => void;
    onUpdateProfile: (updates: Partial<ClientProfile>) => void;
}

const ClassFeedbackGenerator: React.FC<ClassFeedbackGeneratorProps> = ({ profile, onSaveToHistory, onSave, onUpdateProfile }) => {
    // Identity State
    const [studentName, setStudentName] = useState('');
    const [studentAge, setStudentAge] = useState<number>(0);
    const [studentGender, setStudentGender] = useState('未知');
    const [targetMode, setTargetMode] = useState<TargetAudienceMode>(TargetAudienceMode.CHILD);

    // Form State
    const [course, setCourse] = useState<CourseType>(profile.course);
    const [learningContent, setLearningContent] = useState('');
    const [homework, setHomework] = useState('');
    const [previousFeedbackTemplate, setPreviousFeedbackTemplate] = useState('');
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    
    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<FeedbackResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [savedIndex, setSavedIndex] = useState<number | null>(null);
    const [configSaved, setConfigSaved] = useState(false);
    
    // Dropdown Positioning State
    const [showScaleMenu, setShowScaleMenu] = useState<number | null>(null); // Index of metric open menu
    const [menuPosition, setMenuPosition] = useState<{top: number, left: number}>({ top: 0, left: 0 });

    // Initialize Data from Profile or Profile Config
    useEffect(() => {
        // Identity
        const isAdult = profile.clientType === ClientType.ADULT_STUDENT || (profile.age && profile.age >= 18);
        setStudentName(isAdult ? profile.name : profile.childName || '');
        setStudentAge(isAdult ? (profile.age || 0) : (profile.childAge || 0));
        setStudentGender(isAdult ? (profile.gender || '未知') : (profile.childGender || '未知'));
        setCourse(profile.course);

        // Config Loading
        if (profile.feedbackConfig) {
            // Load saved config if available
            if (profile.feedbackConfig.targetMode) {
                setTargetMode(profile.feedbackConfig.targetMode);
            } else {
                 // Fallback auto detection
                 const age = isAdult ? (profile.age || 0) : (profile.childAge || 0);
                 if (age >= 18) setTargetMode(TargetAudienceMode.ADULT);
                 else if (age >= 12) setTargetMode(TargetAudienceMode.TEEN);
                 else setTargetMode(TargetAudienceMode.CHILD);
            }

            if (profile.feedbackConfig.previousFeedbackTemplate) {
                setPreviousFeedbackTemplate(profile.feedbackConfig.previousFeedbackTemplate);
            } else {
                setPreviousFeedbackTemplate('');
            }

            if (profile.feedbackConfig.customMetrics && profile.feedbackConfig.customMetrics.length > 0) {
                setMetrics(JSON.parse(JSON.stringify(profile.feedbackConfig.customMetrics)));
            } else {
                // Default based on current course
                const defaults = DEFAULT_PERFORMANCE_METRICS[profile.course] || [];
                setMetrics(JSON.parse(JSON.stringify(defaults)));
            }
        } else {
            // No saved config, use defaults
            const defaults = DEFAULT_PERFORMANCE_METRICS[profile.course] || [];
            setMetrics(JSON.parse(JSON.stringify(defaults)));
            
            const age = isAdult ? (profile.age || 0) : (profile.childAge || 0);
            if (age >= 18) setTargetMode(TargetAudienceMode.ADULT);
            else if (age >= 12) setTargetMode(TargetAudienceMode.TEEN);
            else setTargetMode(TargetAudienceMode.CHILD);

            setPreviousFeedbackTemplate('');
        }
    }, [profile.id]); 

    // Auto-update target mode when age changes (if user manually changes age)
    useEffect(() => {
        if (studentAge && !isNaN(studentAge) && studentAge > 0) {
            // Only auto-switch if no saved config overrides? 
            // For simplicity, let's keep the auto-switch logic active for UX
            if (studentAge >= 18) {
                setTargetMode(TargetAudienceMode.ADULT);
            } else if (studentAge >= 12) {
                setTargetMode(TargetAudienceMode.TEEN);
            } else {
                setTargetMode(TargetAudienceMode.CHILD);
            }
        }
    }, [studentAge]);

    const handleMetricChange = (index: number, field: keyof PerformanceMetric, value: any) => {
        const newMetrics = [...metrics];
        // @ts-ignore
        newMetrics[index][field] = value;
        setMetrics(newMetrics);
    };

    const addMetric = () => {
        setMetrics([...metrics, { id: Date.now().toString(), name: '', value: '' }]);
    };

    const removeMetric = (index: number) => {
        setMetrics(metrics.filter((_, i) => i !== index));
    };

    const handleOpenScaleMenu = (e: React.MouseEvent<HTMLButtonElement>, idx: number) => {
        if (showScaleMenu === idx) {
            setShowScaleMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 4,
            left: Math.max(0, rect.right - 130)
        });
        setShowScaleMenu(idx);
    };

    const applyScale = (index: number, scaleKey: keyof typeof RATING_SCALES) => {
        const scaleOptions = RATING_SCALES[scaleKey];
        const newMetrics = [...metrics];
        newMetrics[index].options = scaleOptions;
        newMetrics[index].value = scaleOptions[0];
        setMetrics(newMetrics);
        setShowScaleMenu(null);
    };

    const handleGenerate = async () => {
        if (!learningContent.trim()) {
            setError("请输入本节课的学习内容");
            return;
        }
        
        setIsGenerating(true);
        setError(null);
        try {
            const feedbackResult = await generateClassFeedback(
                profile,
                course,
                learningContent,
                metrics,
                homework,
                previousFeedbackTemplate,
                studentName,
                studentAge,
                studentGender,
                targetMode
            );
            setResult(feedbackResult);
            
            if (feedbackResult.variations.length > 0) {
                 const summary = `[${new Date().toLocaleDateString()}] 课后反馈 (${studentName}): ${feedbackResult.learningContentSummary}`;
                 onSaveToHistory(summary);
            }

        } catch (err: any) {
            setError(err.message || "生成失败，请重试");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleSaveFeedback = (text: string, index: number) => {
        const timestamp = new Date().toLocaleDateString();
        const summary = `\n[${timestamp}] 发送反馈:\n${text}`;
        onSaveToHistory(summary);
        onSave(); 
        setSavedIndex(index);
        setTimeout(() => setSavedIndex(null), 2000);
    };

    // New: Save Configuration
    const handleSaveConfig = () => {
        const isAdult = profile.clientType === ClientType.ADULT_STUDENT || (profile.age && profile.age >= 18);
        
        const updates: Partial<ClientProfile> = {
            // Update Identity if changed
            [isAdult ? 'name' : 'childName']: studentName,
            [isAdult ? 'age' : 'childAge']: studentAge,
            [isAdult ? 'gender' : 'childGender']: studentGender,
            course: course,

            // Save Config
            feedbackConfig: {
                targetMode,
                previousFeedbackTemplate,
                customMetrics: metrics
            }
        };

        onUpdateProfile(updates);
        onSave(); // Persist to LocalStorage via App

        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white p-3 border-b border-gray-200 shadow-sm flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-2 text-gray-700">
                    <PenTool size={18} className="text-purple-600" />
                    <h3 className="font-bold text-sm">智能课后反馈生成器</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSaveConfig}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${configSaved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        title="保存学员身份、科目、评价标准和模板设置 (不保存学习内容和作业)"
                    >
                        {configSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                        {configSaved ? "配置已保存" : "保存配置"}
                    </button>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                        {Object.values(TargetAudienceMode).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setTargetMode(mode)}
                                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-all ${
                                    targetMode === mode 
                                    ? 'bg-white text-purple-700 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {mode.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left: Input Form */}
                <div className="w-full md:w-1/2 p-4 overflow-y-auto custom-scrollbar border-r border-gray-200 bg-white relative">
                    <div className="space-y-4">
                        {/* Student Identity Section */}
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                             <label className="block text-xs font-bold text-purple-800 mb-2 flex items-center gap-1">
                                 <User size={12} /> 学员身份信息 (本次反馈)
                             </label>
                             <div className="flex gap-2">
                                <input 
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className="w-1/2 border border-purple-200 rounded px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                                    placeholder="姓名"
                                />
                                <input 
                                    type="number"
                                    value={studentAge || ''}
                                    onChange={(e) => setStudentAge(parseInt(e.target.value))}
                                    className="w-1/4 border border-purple-200 rounded px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                                    placeholder="年龄"
                                />
                                <select
                                    value={studentGender}
                                    onChange={(e) => setStudentGender(e.target.value)}
                                    className="w-1/4 border border-purple-200 rounded px-1 py-1.5 text-xs outline-none bg-white"
                                >
                                    <option value="男">男</option>
                                    <option value="女">女</option>
                                    <option value="未知">未知</option>
                                </select>
                             </div>
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">选择科目 (自动加载评价维度)</label>
                            <select 
                                value={course}
                                onChange={(e) => setCourse(e.target.value as CourseType)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Learning Content */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">本节课学习内容 <span className="text-red-500">*</span></label>
                            <textarea
                                value={learningContent}
                                onChange={(e) => setLearningContent(e.target.value)}
                                placeholder="例如：练习音准控制，强化节奏感，学习了《小星星》..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                            />
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="block text-xs font-bold text-gray-600 mb-2 flex justify-between items-center">
                                <span>学生表现评价 (统一标准)</span>
                                <button onClick={addMetric} className="text-purple-600 hover:text-purple-700 text-[10px] flex items-center gap-1">
                                    <Plus size={12} /> 添加维度
                                </button>
                            </label>
                            <div className="space-y-2">
                                {metrics.map((metric, idx) => (
                                    <div key={idx} className="flex gap-2 items-center relative">
                                        <input
                                            value={metric.name}
                                            onChange={(e) => handleMetricChange(idx, 'name', e.target.value)}
                                            placeholder="维度名称"
                                            className="w-1/3 text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-purple-500 outline-none"
                                        />
                                        <div className="flex-1 relative flex gap-1">
                                            {metric.options ? (
                                                <select
                                                    value={metric.value}
                                                    onChange={(e) => handleMetricChange(idx, 'value', e.target.value)}
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-purple-500 outline-none bg-white appearance-none"
                                                >
                                                    {metric.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                 <input
                                                    value={metric.value}
                                                    onChange={(e) => handleMetricChange(idx, 'value', e.target.value)}
                                                    placeholder="评价"
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-purple-500 outline-none"
                                                />
                                            )}
                                            
                                            {/* Standard Scale Trigger */}
                                            <div>
                                                <button 
                                                    onClick={(e) => handleOpenScaleMenu(e, idx)}
                                                    className={`h-full px-1.5 border rounded transition-colors ${showScaleMenu === idx ? 'bg-purple-100 text-purple-600 border-purple-300' : 'bg-gray-100 border-gray-300 hover:bg-purple-50'}`}
                                                    title="应用标准评价量表"
                                                >
                                                    <Wand2 size={12} />
                                                </button>
                                                
                                                {/* Fixed Position Dropdown using Portal-like technique (just fixed CSS) */}
                                                {showScaleMenu === idx && (
                                                    <>
                                                        <div className="fixed inset-0 z-50" onClick={() => setShowScaleMenu(null)}></div>
                                                        <div 
                                                            className="fixed w-32 bg-white border border-gray-200 shadow-xl rounded-lg z-50 py-1 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in"
                                                            style={{ top: menuPosition.top, left: menuPosition.left }}
                                                        >
                                                            <div className="px-2 py-1 text-[10px] font-bold text-gray-400 bg-gray-50">选择标准量表</div>
                                                            {Object.keys(RATING_SCALES).map((key) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => applyScale(idx, key as keyof typeof RATING_SCALES)}
                                                                    className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-purple-50 text-gray-700 truncate transition-colors"
                                                                >
                                                                    {RATING_SCALE_LABELS[key as keyof typeof RATING_SCALES]}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => removeMetric(idx)} className="text-gray-400 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Homework & Template */}
                        <div>
                             <label className="block text-xs font-bold text-gray-600 mb-1.5">课后作业 (选填)</label>
                             <input
                                value={homework}
                                onChange={(e) => setHomework(e.target.value)}
                                placeholder="例如：每天练习15分钟，复习第3小节"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                 上节课反馈模板 (选填)
                                 <span className="text-gray-400 font-normal ml-2 text-[10px]">AI将严格模仿此格式</span>
                             </label>
                             <textarea
                                value={previousFeedbackTemplate}
                                onChange={(e) => setPreviousFeedbackTemplate(e.target.value)}
                                placeholder="粘贴上节课发给家长的内容，AI会模仿语气、排版和Emoji..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px] text-gray-600"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            生成反馈文案
                        </button>
                        
                        {error && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded text-center">{error}</div>
                        )}
                    </div>
                </div>

                {/* Right: Results */}
                <div className="w-full md:w-1/2 bg-gray-50 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <ClipboardList size={48} className="mb-2 text-gray-300" />
                                <p className="text-sm font-medium">填写左侧信息，一键生成专业反馈</p>
                            </div>
                        ) : (
                            <>
                                {/* Learning Summary */}
                                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-purple-800 mb-1 flex items-center gap-1">
                                        <BookOpen size={14} /> 学习内容摘要
                                    </h4>
                                    <p className="text-sm text-gray-700">{result.learningContentSummary}</p>
                                </div>

                                {/* Variations */}
                                {result.variations.map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                                        <div className={`h-1 w-full ${
                                            item.style.includes('鼓励') ? 'bg-orange-400' :
                                            item.style.includes('指导') ? 'bg-blue-400' :
                                            item.style.includes('专业') ? 'bg-purple-400' : 'bg-gray-400'
                                        }`} />
                                        <div className="p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {item.style}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleSaveFeedback(item.content, idx)}
                                                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-all ${
                                                            savedIndex === idx 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                        title="保存到档案历史并更新数据库"
                                                    >
                                                        {savedIndex === idx ? <CheckCircle size={12}/> : <Save size={12}/>}
                                                        {savedIndex === idx ? '已保存' : '保存'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopy(item.content, idx)}
                                                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-all ${
                                                            copiedIndex === idx 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {copiedIndex === idx ? <CheckCircle size={12}/> : <Copy size={12}/>}
                                                        {copiedIndex === idx ? '已复制' : '复制'}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {item.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassFeedbackGenerator;
