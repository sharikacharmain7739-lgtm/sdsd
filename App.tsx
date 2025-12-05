
import React, { useState, useEffect } from 'react';
import { ClientProfile, ClientType, CourseType, PackageLevel, AnalysisResult, ClientStatus, PersonalityAnalysisResult, InputPerspective, FeedbackResult } from './types';
import ProfileForm from './components/ProfileForm';
import ProfileList from './components/ProfileList';
import ClassFeedbackGenerator from './components/ClassFeedbackGenerator';
import { analyzeInteraction, analyzePersonalityFromImages } from './services/geminiService';
import { Upload, Sparkles, MessageSquare, AlertCircle, RefreshCw, XCircle, Send, PlusCircle, X, CheckCircle, UserCircle, PenTool, Calendar, FileText, Copy, Brain, ClipboardCheck } from 'lucide-react';

// Mock Data
const MOCK_PROFILES: ClientProfile[] = [
  {
    id: '1',
    name: '陈妈妈',
    clientType: ClientType.PARENT,
    status: ClientStatus.REGULAR,
    age: 35,
    gender: '女',
    occupation: '会计',
    childName: '轩轩',
    childAge: 6,
    childGender: '男',
    address: '阳光花园一期',
    course: CourseType.PIANO,
    currentPackage: PackageLevel.STANDARD,
    remainingLessons: 3,
    weeklyFrequency: '2',
    otherPackages: '声乐课剩余 5 节',
    studentPersonality: ['外向活泼', '容易分心'],
    learningState: ['瓶颈期', '需家长督促'],
    parentFocus: ['兴趣培养', '注重服务'],
    otherInfo: '平时比较忙，一般晚上回复',
    historySummary: '[10/12] 家长反馈练习时间少，建议制定时间表。\n[10/25] 孩子回课有进步，家长很高兴。',
    addDate: Date.now() - 100000000,
    profileScreenshots: [],
    personalityNotes: '',
    personalityAnalysis: {
        summary: "典型的责任心强、关注细节的家长。",
        tags: ["严谨", "负责", "焦虑"],
        communicationStyle: "注重逻辑和结果，喜欢直接反馈",
        mbti: {
            type: "ESTJ",
            description: "总经理型 - 注重效率与规则",
            cognitiveStyle: "偏好具体事实(S)和逻辑判断(T)，希望看到清晰的练习计划。",
            teachingAdvice: "给她看详细的课程大纲和阶段性成果数据，不要谈空泛的理念。"
        },
        dos: ["提供数据支持", "按时反馈", "指令清晰"],
        donts: ["迟到", "含糊其辞", "随意更改计划"],
        closingStrategy: "展示课程的长期规划和性价比分析",
        childInteractionGuide: {
            personalityAnalysis: "活泼好动，坐不住",
            mbti: {
                type: "ESFP",
                description: "表演者型 - 天生的艺人",
                cognitiveStyle: "喜欢动手操作，活在当下(S)，反感枯燥理论。",
                teachingAdvice: "使用游戏化教学，多给上台展示机会，减少长时间说教。"
            },
            rewardMechanisms: ["积分兑换礼物"],
            toyTypes: ["奥特曼"],
            dos: ["多鼓励", "游戏化教学"],
            donts: ["长时间说教"],
            winningStrategy: "带他玩5分钟游戏再开始上课"
        }
    }
  },
  {
    id: '2',
    name: '李先生',
    clientType: ClientType.ADULT_STUDENT,
    status: ClientStatus.REGULAR,
    age: 28,
    gender: '男',
    occupation: '程序员',
    address: '科技园',
    course: CourseType.GUITAR,
    currentPackage: PackageLevel.PREMIUM,
    remainingLessons: 12,
    weeklyFrequency: '1',
    studentPersonality: ['专注力高', '内向害羞'],
    learningState: ['兴趣浓厚'],
    parentFocus: ['提升气质'],
    otherInfo: '',
    historySummary: '',
    addDate: Date.now() - 50000000,
    profileScreenshots: []
  },
  {
    id: '3',
    name: '张女士',
    clientType: ClientType.PARENT,
    status: ClientStatus.TRIAL,
    age: 32,
    gender: '女',
    occupation: '',
    childName: '小宝',
    childAge: 5,
    childGender: '女',
    address: '御景湾',
    course: CourseType.UKULELE,
    currentPackage: PackageLevel.STANDARD,
    remainingLessons: 0,
    trialRemainingLessons: 2,
    weeklyFrequency: '1',
    otherPackages: '',
    studentPersonality: ['需要鼓励'],
    learningState: ['体验良好', '对比价格'],
    parentFocus: ['价格敏感'],
    otherInfo: '第一次试听很开心，但觉得价格偏高',
    historySummary: '[11/01] 第一次试听结束，孩子很喜欢老师。',
    addDate: Date.now() - 2000000,
    profileScreenshots: []
  },
  {
    id: '4',
    name: '刘爸爸',
    clientType: ClientType.PARENT,
    status: ClientStatus.LEAD,
    age: 40,
    gender: '男',
    occupation: '企业主',
    childName: '浩浩',
    childAge: 8,
    childGender: '男',
    address: '未知',
    course: CourseType.PIANO,
    currentPackage: PackageLevel.STANDARD,
    remainingLessons: 0,
    trialRemainingLessons: 0,
    studentPersonality: [],
    learningState: ['初次接触'],
    parentFocus: ['考级证书'],
    otherInfo: '朋友圈咨询，想了解考级路线',
    historySummary: '',
    addDate: Date.now(),
    profileScreenshots: []
  }
];

const NEW_PROFILE_TEMPLATE: ClientProfile = {
  id: '',
  name: '',
  clientType: ClientType.PARENT,
  status: ClientStatus.REGULAR,
  age: undefined,
  gender: '',
  occupation: '',
  childName: '',
  childAge: 6,
  childGender: undefined,
  address: '',
  course: CourseType.PIANO,
  currentPackage: PackageLevel.STANDARD,
  remainingLessons: 16,
  weeklyFrequency: '1',
  studentPersonality: [],
  learningState: [],
  parentFocus: [],
  otherInfo: '',
  historySummary: '',
  addDate: Date.now(),
  profileScreenshots: [],
  personalityNotes: '',
};

type AnalysisTab = 'COMMUNICATION' | 'FEEDBACK';

interface UploadedFile {
    type: 'image' | 'pdf';
    data: string; // base64
}

function App() {
  const [showToast, setShowToast] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  // Profile State
  const [profiles, setProfiles] = useState<ClientProfile[]>(() => {
    const saved = localStorage.getItem('EDU_CONSULT_PROFILES');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse profiles", e);
        return MOCK_PROFILES;
      }
    }
    return MOCK_PROFILES;
  });
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(profiles.length > 0 ? profiles[0].id : null);

  // Analysis State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // New State: Input Perspective & Active Tab
  const [inputPerspective, setInputPerspective] = useState<InputPerspective>('PARENT');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('COMMUNICATION');

  const handleSaveData = () => {
      localStorage.setItem('EDU_CONSULT_PROFILES', JSON.stringify(profiles));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
  };
  
  const handleCopyText = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopyFeedback(id);
      setTimeout(() => setCopyFeedback(null), 2000);
  };

  const getSelectedProfile = () => profiles.find(p => p.id === selectedProfileId) || null;

  const handleProfileUpdate = (updates: Partial<ClientProfile>) => {
    if (!selectedProfileId) return;
    setProfiles(prev => prev.map(p => 
      p.id === selectedProfileId ? { ...p, ...updates } : p
    ));
  };

  const handleAddProfile = () => {
    const newId = Date.now().toString();
    const newProfile = { ...NEW_PROFILE_TEMPLATE, id: newId, name: '新学员' };
    setProfiles([newProfile, ...profiles]);
    setSelectedProfileId(newId);
    setResult(null);
    clearInputs();
  };

  const handleDeleteProfile = () => {
    const profile = getSelectedProfile();
    if (!profile) return;
    
    if (window.confirm(`确定要删除学员 "${profile.name}" 的档案吗？此操作无法撤销。`)) {
        const newProfiles = profiles.filter(p => p.id !== profile.id);
        setProfiles(newProfiles);
        localStorage.setItem('EDU_CONSULT_PROFILES', JSON.stringify(newProfiles)); // Auto save on delete
        setSelectedProfileId(null);
        clearInputs();
        setResult(null);
    }
  };

  const clearInputs = () => {
    setUploadedFiles([]);
    setTextInput('');
    setError(null);
    setInputPerspective('PARENT');
  };

  const processInputFiles = (files: File[]) => {
      const validFiles = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
      if (validFiles.length === 0) return;

      const promises = validFiles.map(file => {
        return new Promise<UploadedFile>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
              resolve({
                  type: file.type === 'application/pdf' ? 'pdf' : 'image',
                  data: reader.result as string
              });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(newFiles => {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setResult(null); 
        setError(null);
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processInputFiles(Array.from(e.target.files));
        e.target.value = ''; // Reset
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          e.preventDefault();
          processInputFiles(Array.from(e.clipboardData.files));
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processInputFiles(Array.from(e.dataTransfer.files));
      }
  };
  
  const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
      } else if (e.type === "dragleave") {
          setDragActive(false);
      }
  };

  const removeUploadedFile = (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    const currentProfile = getSelectedProfile();
    if (!currentProfile) return;
    if (uploadedFiles.length === 0 && !textInput.trim() && (!currentProfile.profileScreenshots?.length)) {
        setError("请至少输入文字、上传聊天截图或上传档案资料图");
        return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
        const base64Images = uploadedFiles.filter(f => f.type === 'image').map(img => img.data.split(',')[1]);
        
        // Pass inputPerspective to service
        const analysis = await analyzeInteraction(base64Images, textInput, currentProfile, inputPerspective);
        setResult(analysis);

        // Auto-update History and Tags
        const dateStr = new Date().toLocaleDateString();
        const perspectiveLabel = inputPerspective === 'PARENT' ? '家长消息' : '顾问/老师主动';
        const newHistoryEntry = `[${dateStr}] (${perspectiveLabel}) ${analysis.interactionSummary}`;
        
        const updatedProfile = {
            ...currentProfile,
            historySummary: currentProfile.historySummary 
                ? `${currentProfile.historySummary}\n${newHistoryEntry}`
                : newHistoryEntry
        };

        // Merge suggested tags if any
        if (analysis.profileUpdateSuggestion) {
            if (analysis.profileUpdateSuggestion.learningState) {
                updatedProfile.learningState = [...new Set([...updatedProfile.learningState, ...analysis.profileUpdateSuggestion.learningState])];
            }
            if (analysis.profileUpdateSuggestion.parentFocus) {
                 updatedProfile.parentFocus = [...new Set([...updatedProfile.parentFocus, ...analysis.profileUpdateSuggestion.parentFocus])];
            }
            if (analysis.profileUpdateSuggestion.studentPersonality) {
                 updatedProfile.studentPersonality = [...new Set([...updatedProfile.studentPersonality, ...analysis.profileUpdateSuggestion.studentPersonality])];
            }
        }

        handleProfileUpdate(updatedProfile);

    } catch (err: any) {
        setError(err.message || "分析失败，请稍后重试");
    } finally {
        setIsAnalyzing(false);
    }
  };
  
  const handleSaveToHistory = (summary: string) => {
    const currentProfile = getSelectedProfile();
    if (!currentProfile) return;
    
    const updatedProfile = {
        ...currentProfile,
        historySummary: currentProfile.historySummary 
            ? `${currentProfile.historySummary}\n${summary}`
            : summary
    };
    handleProfileUpdate(updatedProfile);
  };
  

  const handleAnalyzePersonality = async (images: string[], notes: string): Promise<PersonalityAnalysisResult> => {
       const currentProfile = getSelectedProfile();
       if (!currentProfile) throw new Error("No profile selected");

       const profileImagesBase64 = images.map(img => img.split(',')[1]);
       // Gather context from the Chat Analysis panel (selectedImages + textInput)
       const chatImagesBase64 = uploadedFiles.filter(f => f.type === 'image').map(img => img.data.split(',')[1]);
       
       return await analyzePersonalityFromImages(
           profileImagesBase64, 
           notes, 
           chatImagesBase64,
           textInput,
           currentProfile
        );
  };

  const selectedProfile = getSelectedProfile();

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800 overflow-hidden font-sans relative">
      {/* Toast Notification */}
      {showToast && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle size={16} className="text-green-400" />
              数据保存成功
          </div>
      )}

      {/* Header */}
      <header className="bg-white border-b z-20 shadow-sm shrink-0 h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
             <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Sparkles size={18} />
             </div>
             <div>
                <h1 className="text-lg font-bold leading-none">EduConsult AI</h1>
                <p className="text-[10px] text-gray-500 font-medium">智能教务沟通助手</p>
             </div>
        </div>
        {/* API Key Modal Removed - Handled by Backend */}
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: List (20% or 280px) */}
        <div className="w-72 flex-shrink-0 z-10 shadow-md">
            <ProfileList 
                profiles={profiles} 
                selectedId={selectedProfileId} 
                onSelect={(id) => {
                    setSelectedProfileId(id);
                    setResult(null);
                    clearInputs();
                }}
                onAdd={handleAddProfile}
            />
        </div>

        {/* Middle: Profile Details (35%) */}
        <div className="w-1/3 min-w-[350px] border-r border-gray-200 bg-gray-50 p-4 overflow-hidden">
            {selectedProfile ? (
                 <ProfileForm 
                    profile={selectedProfile} 
                    setProfile={handleProfileUpdate} 
                    onDelete={handleDeleteProfile}
                    onAnalyzePersonality={handleAnalyzePersonality}
                    onSave={handleSaveData}
                 />
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                    请选择或新建学员
                </div>
            )}
        </div>

        {/* Right: Analysis & Chat (Rest) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedProfile ? (
                <>
                  <div className="p-2 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                      <div className="flex bg-gray-200 p-1 rounded-lg">
                          <button
                             onClick={() => setActiveTab('COMMUNICATION')}
                             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'COMMUNICATION' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              <MessageSquare size={14} /> 沟通分析
                          </button>
                          <button
                             onClick={() => setActiveTab('FEEDBACK')}
                             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'FEEDBACK' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              <ClipboardCheck size={14} /> 课后反馈
                          </button>
                      </div>

                      {selectedProfile.remainingLessons < 4 && selectedProfile.status === ClientStatus.REGULAR && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse mr-2">
                              <AlertCircle size={14} />
                              续费预警生效中
                          </div>
                      )}
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                        {/* 1. COMMUNICATION VIEW */}
                        {activeTab === 'COMMUNICATION' && (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {result && (
                                    <div className="space-y-6 animate-fade-in">
                                        {/* Key Insights */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-sm font-bold text-gray-500 uppercase">情绪与核心诉求</div>
                                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">
                                                    {result.emotionalTone}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {result.keyConcerns.map((k, i) => (
                                                    <span key={i} className="px-2 py-1 bg-yellow-50 border border-yellow-100 text-yellow-700 text-sm rounded-md">{k}</span>
                                                ))}
                                            </div>
                                            {result.suggestedPackage && (
                                                <div className="text-sm bg-indigo-50 text-indigo-800 p-2 rounded-lg border border-indigo-100 flex items-center gap-2">
                                                    <Sparkles size={14} />
                                                    推荐方案：<span className="font-bold">{result.suggestedPackage}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reply Suggestions */}
                                        {result.replySuggestions && (
                                            <div>
                                                <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                    <MessageSquare size={16} className="text-blue-500" />
                                                    智能回复建议 (点击复制)
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 hover:border-blue-300 transition-colors relative group">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded">详细版 (深度沟通)</div>
                                                            <button 
                                                                onClick={() => handleCopyText(result.replySuggestions.detailed, 'detailed')}
                                                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-all ${copyFeedback === 'detailed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                            >
                                                                {copyFeedback === 'detailed' ? <CheckCircle size={12}/> : <Copy size={12}/>}
                                                                {copyFeedback === 'detailed' ? '已复制' : '复制'}
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.replySuggestions.detailed}</p>
                                                    </div>
                                                    
                                                    <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4 hover:border-green-300 transition-colors relative group">
                                                         <div className="flex justify-between items-center mb-2">
                                                            <div className="text-xs font-bold text-green-800 bg-green-50 px-2 py-1 rounded">简短版 (高效回复)</div>
                                                            <button 
                                                                onClick={() => handleCopyText(result.replySuggestions.brief, 'brief')}
                                                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-all ${copyFeedback === 'brief' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                            >
                                                                {copyFeedback === 'brief' ? <CheckCircle size={12}/> : <Copy size={12}/>}
                                                                {copyFeedback === 'brief' ? '已复制' : '复制'}
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.replySuggestions.brief}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Strategies */}
                                        <div className="grid gap-4">
                                            <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <Brain size={16} className="text-purple-500" />
                                                心理学策略分析
                                            </div>
                                            {result.strategies.map((strategy, idx) => (
                                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                                    <div className={`h-1 w-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-bold text-gray-800">{strategy.title}</h4>
                                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-gray-100 text-gray-500 rounded">
                                                                {strategy.principle}
                                                            </span>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm leading-relaxed relative group">
                                                            {strategy.content}
                                                            <button 
                                                                onClick={() => handleCopyText(strategy.content, `strat-${idx}`)}
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-50 transition-all flex items-center gap-1"
                                                            >
                                                                {copyFeedback === `strat-${idx}` ? <CheckCircle size={10} className="text-green-500"/> : <Copy size={10}/>}
                                                                复制
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {!result && !isAnalyzing && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                        <MessageSquare size={48} className="mb-2" />
                                        <p>上传聊天截图或输入文字开始分析</p>
                                    </div>
                                )}

                                {isAnalyzing && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <RefreshCw className="animate-spin w-8 h-8 text-blue-500 mb-4" />
                                        <p className="text-gray-500 font-medium">AI正在分析心理画像与生成策略...</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* 2. FEEDBACK GENERATOR VIEW */}
                        {activeTab === 'FEEDBACK' && (
                            <ClassFeedbackGenerator 
                                profile={selectedProfile}
                                onSaveToHistory={handleSaveToHistory}
                                onSave={handleSaveData}
                                onUpdateProfile={handleProfileUpdate}
                            />
                        )}

                        {error && activeTab !== 'FEEDBACK' && <div className="mx-6 mb-2 bg-red-50 text-red-600 p-3 rounded-xl text-center text-sm">{error}</div>}
                  </div>

                  {/* Input Area (Shared Sticky Bottom - Hidden for Feedback Tab) */}
                  {activeTab !== 'FEEDBACK' && (
                  <div 
                    className={`p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors ${dragActive ? 'bg-blue-50 border-blue-300' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                        {/* Thumbnail Preview List */}
                        {uploadedFiles.length > 0 && (
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg border border-gray-200 overflow-hidden group bg-gray-50 flex items-center justify-center">
                                        {file.type === 'image' ? (
                                            <img src={file.data} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-red-500">
                                                <FileText size={24} />
                                                <span className="text-[8px] uppercase font-bold mt-1">PDF</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => removeUploadedFile(idx)}
                                            className="absolute top-0 right-0 bg-black/50 hover:bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Input Perspective Toggle (Only for Communication Tab) */}
                        {activeTab === 'COMMUNICATION' && (
                            <div className="flex justify-start mb-2">
                            <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                                <button 
                                    onClick={() => setInputPerspective('PARENT')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${inputPerspective === 'PARENT' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <UserCircle size={14} />
                                    分析家长消息
                                </button>
                                <button 
                                    onClick={() => setInputPerspective('TEACHER')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${inputPerspective === 'TEACHER' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <PenTool size={14} />
                                    老师提问/润色
                                </button>
                            </div>
                            </div>
                        )}

                        <div className="flex gap-2 items-end">
                            {/* File Upload Trigger */}
                            <div className="relative shrink-0">
                                <input 
                                    type="file" 
                                    multiple
                                    accept="image/*,application/pdf" 
                                    onChange={handleFileUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${uploadedFiles.length > 0 ? 'border-blue-500 bg-blue-50 text-blue-500' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500'}`}>
                                    {uploadedFiles.length > 0 ? <span className="text-xs font-bold">+{uploadedFiles.length}</span> : <Upload size={20} />}
                                </div>
                            </div>

                            {/* Text Area */}
                            <div className="flex-1 relative">
                                <textarea 
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder={inputPerspective === 'PARENT' ? "输入家长消息..." : "输入老师的问题或草稿..."}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 pr-12 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-12 min-h-[48px] max-h-32 text-sm leading-relaxed custom-scrollbar"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAnalyze();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleAnalyze}
                                    disabled={
                                        (uploadedFiles.length === 0 && !textInput.trim() && !selectedProfile.profileScreenshots?.length) || isAnalyzing
                                    }
                                    className={`absolute right-2 bottom-2 p-1.5 rounded-lg text-white transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                  </div>
                  )}
                </>
            ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                            <PlusCircle size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">开始您的咨询工作</h2>
                        <p className="text-gray-500 max-w-xs mx-auto">请在左侧选择一位学员，或点击"新增学员档案"开始工作。</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;
