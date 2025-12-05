
import React, { useRef, useState } from 'react';
import { ClientProfile, ClientType, CourseType, PackageLevel, ClientStatus, PersonalityAnalysisResult } from '../types';
import { COURSE_OPTIONS, PACKAGE_DATA, PERSONALITY_TAGS, LEARNING_STATE_TAGS, PARENT_FOCUS_TAGS, CLIENT_STATUS_OPTIONS } from '../constants';
import TagSelector from './TagSelector';
import { User, BookOpen, MapPin, Hash, Clock, FileText, History, Calendar, Calculator, Layers, Briefcase, Smile, Image as ImageIcon, X, Trash2, Sparkles, AlertCircle, CheckCircle, XCircle, BrainCircuit, Download, FileImage, FileType, FileText as FileTextIcon, Loader2, Save, Baby, Gift, Puzzle, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ProfileFormProps {
  profile: ClientProfile;
  setProfile: (updates: Partial<ClientProfile>) => void;
  onDelete: () => void;
  onSave: () => void;
  onAnalyzePersonality: (images: string[], notes: string) => Promise<PersonalityAnalysisResult>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, setProfile, onDelete, onSave, onAnalyzePersonality }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleChange = (field: keyof ClientProfile, value: any) => {
    setProfile({ [field]: value });
  };

  const handleStatusChange = (newStatus: ClientStatus) => {
    const updates: Partial<ClientProfile> = { status: newStatus };
    if (newStatus === ClientStatus.TRIAL && profile.status !== ClientStatus.TRIAL) {
        if (!profile.trialRemainingLessons || profile.trialRemainingLessons === 0) {
            updates.trialRemainingLessons = 1;
        }
    }
    if (newStatus === ClientStatus.REGULAR && profile.status !== ClientStatus.REGULAR) {
        if (profile.remainingLessons === 0) {
            updates.remainingLessons = 16;
            updates.currentPackage = PackageLevel.STANDARD;
        }
    }
    setProfile(updates);
  };

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const promises = imageFiles.map(file => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then(images => {
        const currentImages = profile.profileScreenshots || [];
        handleChange('profileScreenshots', [...currentImages, ...images]);
    });
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(Array.from(e.dataTransfer.files));
      }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          e.preventDefault();
          processFiles(Array.from(e.clipboardData.files));
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

  const removeImage = (index: number) => {
      const currentImages = profile.profileScreenshots || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      handleChange('profileScreenshots', newImages);
  };

  const triggerPersonalityAnalysis = async () => {
      setIsAnalyzing(true);
      try {
          const result = await onAnalyzePersonality(profile.profileScreenshots || [], profile.personalityNotes || '');
          handleChange('personalityAnalysis', result); 
      } catch (e) {
          alert("分析失败，请确保提供了截图或描述");
      } finally {
          setIsAnalyzing(false);
      }
  };
  
  const handleSaveActivityToHistory = (summary: string) => {
      const currentHistory = profile.historySummary || '';
      handleChange('historySummary', currentHistory + (currentHistory ? '\n' : '') + summary);
  };

  // --- Export Functions ---

  const getFileName = (ext: string) => `学员档案_${profile.name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.${ext}`;

  const handleExportImage = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
        const canvas = await html2canvas(contentRef.current, {
            useCORS: true,
            scale: 2, // Retain quality
            backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = getFileName('png');
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Export Image Failed', err);
        alert('导出图片失败');
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
        const canvas = await html2canvas(contentRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height] 
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(getFileName('pdf'));
    } catch (err) {
        console.error('Export PDF Failed', err);
        alert('导出PDF失败');
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportWord = () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
        let personalityHtml = '';
        if (profile.personalityAnalysis) {
            let mbtiHtml = '';
            if (profile.personalityAnalysis.mbti) {
                mbtiHtml = `
                <div style="background-color: #f5f3ff; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                    <p><b>🧩 家长/学员 MBTI 类型:</b> ${profile.personalityAnalysis.mbti.type} - ${profile.personalityAnalysis.mbti.description}</p>
                    <p><b>🧠 认知风格:</b> ${profile.personalityAnalysis.mbti.cognitiveStyle}</p>
                    <p><b>🎓 沟通建议:</b> ${profile.personalityAnalysis.mbti.teachingAdvice}</p>
                </div>
                `;
            }

            personalityHtml += `
            <h3>🔮 ${profile.clientType === ClientType.PARENT ? '家长' : '学员'}心理画像与相处指南</h3>
            <p><b>性格总结:</b> ${profile.personalityAnalysis.summary}</p>
            ${mbtiHtml}
            <p><b>推荐做法 (Do's):</b> ${profile.personalityAnalysis.dos.join(', ')}</p>
            <p><b>沟通禁忌 (Don'ts):</b> ${profile.personalityAnalysis.donts.join(', ')}</p>
            <p><b>成交策略:</b> ${profile.personalityAnalysis.closingStrategy}</p>
            <br/>
            `;

            if (profile.clientType === ClientType.PARENT && profile.personalityAnalysis.childInteractionGuide) {
                const childGuide = profile.personalityAnalysis.childInteractionGuide;
                let childMbtiHtml = '';
                if (childGuide.mbti) {
                     childMbtiHtml = `
                    <div style="background-color: #fff7ed; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                        <p><b>🧩 孩子 MBTI 类型:</b> ${childGuide.mbti.type} - ${childGuide.mbti.description}</p>
                        <p><b>🧠 认知/学习风格:</b> ${childGuide.mbti.cognitiveStyle}</p>
                        <p><b>🎓 教学建议:</b> ${childGuide.mbti.teachingAdvice}</p>
                    </div>
                    `;
                }

                personalityHtml += `
                <h3>👶 与孩子相处指南</h3>
                ${childMbtiHtml}
                <p><b>孩子性格画像:</b> ${childGuide.personalityAnalysis}</p>
                <p><b>推荐奖励机制:</b> ${childGuide.rewardMechanisms.join(', ')}</p>
                <p><b>推荐玩具/IP:</b> ${childGuide.toyTypes.join(', ')}</p>
                <p><b>对孩子推荐 (Do's):</b> ${childGuide.dos.join(', ')}</p>
                <p><b>对孩子禁忌 (Don'ts):</b> ${childGuide.donts.join(', ')}</p>
                <p><b>搞定孩子必杀技:</b> ${childGuide.winningStrategy}</p>
                <br/>
                `;
            }
        }

        const historyHtml = profile.historySummary ? `
            <h3>🕒 历史互动摘要</h3>
            <p style="white-space: pre-wrap;">${profile.historySummary}</p>
        ` : '';

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${profile.name} 档案</title></head>
            <body style="font-family: 'Microsoft YaHei', sans-serif;">
                <h1>学员档案: ${profile.name}</h1>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>类型:</b> ${profile.clientType}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>状态:</b> ${profile.status}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>年龄:</b> ${profile.age || '未知'}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>职业:</b> ${profile.occupation || '未知'}</td>
                    </tr>
                     <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>居住地:</b> ${profile.address}</td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>科目:</b> ${profile.course}</td>
                    </tr>
                </table>

                <h3>📦 课程信息</h3>
                <ul>
                    <li><b>当前课包:</b> ${profile.currentPackage}</li>
                    <li><b>剩余正课:</b> ${profile.remainingLessons} 节</li>
                    <li><b>试听剩余:</b> ${profile.trialRemainingLessons || 0} 节</li>
                    <li><b>上课频率:</b> ${profile.weeklyFrequency || '未知'}</li>
                    <li><b>其他课包:</b> ${profile.otherPackages || '无'}</li>
                </ul>

                <h3>🏷 标签特征</h3>
                <p><b>性格:</b> ${profile.studentPersonality.join(', ')}</p>
                <p><b>学习状态:</b> ${profile.learningState.join(', ')}</p>
                <p><b>关注点:</b> ${profile.parentFocus.join(', ')}</p>

                ${personalityHtml}
                
                <h3>📝 其他备注</h3>
                <p>${profile.otherInfo || '无'}</p>

                ${historyHtml}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = getFileName('doc');
        link.click();
    } catch (err) {
        console.error('Export Word Failed', err);
        alert('导出Word失败');
    } finally {
        setIsExporting(false);
    }
  };


  const currentUnitPrice = PACKAGE_DATA[profile.currentPackage]?.unitPrice || 0;
  const isRegular = profile.status === ClientStatus.REGULAR;
  const isTrial = profile.status === ClientStatus.TRIAL;
  const isLead = profile.status === ClientStatus.LEAD;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col relative">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100 flex flex-col gap-3 shrink-0 z-20">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {profile.status}档案详情
            </h2>
            <div className="flex items-center gap-2">
                <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                    <button
                        onClick={() => handleChange('clientType', ClientType.PARENT)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${profile.clientType === ClientType.PARENT ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        家长
                    </button>
                    <button
                        onClick={() => handleChange('clientType', ClientType.ADULT_STUDENT)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${profile.clientType === ClientType.ADULT_STUDENT ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        成人
                    </button>
                </div>

                {/* Save Button */}
                <button 
                    onClick={onSave}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors border border-blue-600"
                    title="保存所有更改"
                >
                    <Save size={14} />
                    保存
                </button>

                {/* Export Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isExporting}
                        className="p-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                        title="导出档案"
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                    
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-fade-in">
                            <button onClick={handleExportImage} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <FileImage size={14} className="text-purple-500" /> 导出图片
                            </button>
                            <button onClick={handleExportPDF} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <FileType size={14} className="text-red-500" /> 导出 PDF
                            </button>
                            <button onClick={handleExportWord} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <FileTextIcon size={14} className="text-blue-500" /> 导出 Word
                            </button>
                        </div>
                    )}
                    {/* Backdrop to close menu */}
                    {showExportMenu && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                    )}
                </div>

                <button 
                    onClick={onDelete}
                    className="p-1.5 bg-white text-gray-400 border border-gray-200 rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                    title="删除档案"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">当前状态:</span>
            <select
                value={profile.status}
                onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
                className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer transition-colors ${
                    isRegular ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' :
                    isTrial ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' :
                    isLead ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                }`}
            >
                {CLIENT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            {isLead && (
                 <span className="text-xs text-gray-400 ml-auto">
                    添加于: {new Date(profile.addDate).toLocaleDateString()}
                 </span>
            )}
        </div>
      </div>

      <div ref={contentRef} id="profile-content" className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-white">
        {/* Basic Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {profile.clientType === ClientType.PARENT ? '家长称呼' : '学员姓名'}
                </label>
                <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="例如：王妈妈 / 李先生"
                />
            </div>
            {profile.clientType === ClientType.PARENT && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">孩子信息 (姓名/年龄/性别)</label>
                    <div className="flex gap-2">
                         <input
                            type="text"
                            value={profile.childName || ''}
                            onChange={(e) => handleChange('childName', e.target.value)}
                            className="w-1/2 border border-gray-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 text-sm"
                            placeholder="小名"
                        />
                         <input
                            type="number"
                            value={profile.childAge || ''}
                            onChange={(e) => handleChange('childAge', parseInt(e.target.value))}
                            className="w-1/4 border border-gray-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 text-sm"
                            placeholder="岁"
                        />
                         <select
                            value={profile.childGender || ''}
                            onChange={(e) => handleChange('childGender', e.target.value)}
                            className="w-1/4 border border-gray-300 rounded-lg px-1 py-2 outline-none bg-white text-sm"
                        >
                            <option value="">未知</option>
                            <option value="男">男</option>
                            <option value="女">女</option>
                        </select>
                    </div>
                </div>
            )}
        </div>

        {/* Demographics Row (Age, Gender, Occupation) */}
        <div className="grid grid-cols-3 gap-3">
            <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">
                    {profile.clientType === ClientType.PARENT ? '家长年龄' : '年龄'}
                 </label>
                 <input
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => handleChange('age', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                    placeholder="35"
                />
            </div>
            <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">性别</label>
                 <select
                    value={profile.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none bg-white"
                >
                    <option value="">未知</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                </select>
            </div>
            <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Briefcase size={12} /> 职业(选填)
                 </label>
                 <input
                    type="text"
                    value={profile.occupation || ''}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none"
                    placeholder="如: 医生/会计"
                />
            </div>
        </div>

        {/* Address */}
        <div className="relative">
             <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             <input
                type="text"
                value={profile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="居住地址 (用于分析距离抗性)"
             />
        </div>

        <hr className="border-gray-100" />

        {/* Course & Package - Conditional Rendering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {isLead ? '咨询科目' : '在读科目'}
                </label>
                <select
                    value={profile.course}
                    onChange={(e) => handleChange('course', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white"
                >
                    {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             
             {isRegular && (
                 <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> 当前课时包
                        </label>
                        <select
                            value={profile.currentPackage}
                            onChange={(e) => handleChange('currentPackage', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white text-sm"
                        >
                            {Object.keys(PACKAGE_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 剩余课时
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={profile.remainingLessons}
                                onChange={(e) => handleChange('remainingLessons', parseInt(e.target.value) || 0)}
                                className={`w-full border rounded-lg px-3 py-2 outline-none font-bold ${profile.remainingLessons < 4 ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300'}`}
                            />
                            {profile.remainingLessons < 4 && (
                                <span className="absolute right-2 top-2 text-xs text-red-500 font-medium">需续费</span>
                            )}
                        </div>
                    </div>
                 </>
             )}

             {isTrial && (
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 text-orange-600">
                        <Clock className="w-3 h-3" /> 试听剩余课时
                    </label>
                    <input
                        type="number"
                        value={profile.trialRemainingLessons || 0}
                        onChange={(e) => handleChange('trialRemainingLessons', parseInt(e.target.value) || 0)}
                        className="w-full border border-orange-200 bg-orange-50 rounded-lg px-3 py-2 outline-none font-bold text-orange-800 focus:ring-1 focus:ring-orange-500"
                    />
                 </div>
             )}

             {isLead && (
                 <div className="col-span-2 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-xs">
                     尚未报课 / 咨询阶段
                 </div>
             )}
        </div>

        {/* Regular Specific Details */}
        {isRegular && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 上课频率 (周/节)
                    </label>
                    <input
                    type="text"
                    value={profile.weeklyFrequency || ''}
                    onChange={(e) => handleChange('weeklyFrequency', e.target.value)}
                    placeholder="例如: 2 或 1-2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calculator className="w-3 h-3" /> 单价 (自动计算)
                    </label>
                    <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 font-medium">
                    ¥ {currentUnitPrice} / 节
                    </div>
                </div>
            </div>
        )}
        
        {/* Other Packages */}
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
               <Layers className="w-3 h-3" /> 其他课包/备注
            </label>
            <input
              type="text"
              value={profile.otherPackages || ''}
              onChange={(e) => handleChange('otherPackages', e.target.value)}
              placeholder="例如：还剩声乐课 10 节，吉他课 5 节"
              className="w-full border border-indigo-200 bg-indigo-50/30 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
        </div>


        <hr className="border-gray-100" />

        {/* Tags Section */}
        <div className="space-y-4">
             <TagSelector 
                label={profile.clientType === ClientType.PARENT ? "孩子性格 (多选)" : "我的性格 (多选)"}
                options={PERSONALITY_TAGS} 
                selected={profile.studentPersonality} 
                onChange={(val) => handleChange('studentPersonality', val)} 
                allowCustom
            />
            
             <TagSelector 
                label="当前学习状态 (多选)" 
                options={LEARNING_STATE_TAGS} 
                selected={profile.learningState} 
                onChange={(val) => handleChange('learningState', val)} 
                allowCustom
            />

             <TagSelector 
                label={profile.clientType === ClientType.PARENT ? "家长关注点 (多选)" : "关注重点 (多选)"}
                options={PARENT_FOCUS_TAGS} 
                selected={profile.parentFocus} 
                onChange={(val) => handleChange('parentFocus', val)} 
                allowCustom
            />
        </div>

        <hr className="border-gray-100" />
        
        {/* Personality Analysis & Image Upload */}
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-purple-600" /> 微信资料/朋友圈截图 (AI性格分析)
                </label>
                 <button 
                    onClick={triggerPersonalityAnalysis}
                    disabled={isAnalyzing}
                    title="综合分析档案详情、微信资料以及右侧的沟通记录来生成"
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded shadow-sm flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                    <Sparkles size={14} />
                    {isAnalyzing ? "深度全维分析中..." : "🔮 生成/更新性格指南 (综合)"}
                </button>
             </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Area */}
                <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    tabIndex={0}
                    className={`outline-none transition-all rounded-xl p-4 border-2 border-dashed ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                >
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[60px]">
                        {profile.profileScreenshots?.map((img, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden group">
                                <img src={img} alt="profile info" className="w-full h-full object-cover" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-14 h-14 rounded-lg border border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors cursor-pointer bg-gray-50"
                        >
                            <Smile size={18} />
                            <span className="text-[9px] mt-1">上传</span>
                        </div>
                    </div>
                    
                    <div className="text-center text-[10px] text-gray-400">
                        支持 Ctrl+V 粘贴 / 拖入图片
                    </div>
                    
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleProfileImageUpload}
                    />
                </div>
                
                {/* Personality Text Notes */}
                <div>
                     <textarea 
                        value={profile.personalityNotes || ''}
                        onChange={(e) => handleChange('personalityNotes', e.target.value)}
                        className="w-full h-full min-h-[100px] border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                        placeholder="补充备注：如个性签名、朋友圈可见范围、主要发布内容类型..."
                    />
                </div>
            </div>

            {/* Render Analysis Result Cards */}
            {profile.personalityAnalysis && (
                <>
                    {/* Parent/Adult Personality Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 shadow-sm mt-4 animate-fade-in relative">
                        <div className="flex items-center gap-2 text-purple-900 font-bold mb-3 border-b border-purple-100 pb-2">
                             <BrainCircuit size={18} />
                             {profile.clientType === ClientType.PARENT ? '家长心理画像与相处指南' : '学员心理画像与相处指南'} (AI已生成)
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div>
                                 <p className="text-gray-700 leading-relaxed font-medium">"{profile.personalityAnalysis.summary}"</p>
                                 <div className="flex flex-wrap gap-1.5 mt-2">
                                    {profile.personalityAnalysis.tags.map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-white border border-purple-200 text-purple-700 text-xs rounded-full">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* MBTI Section */}
                            {profile.personalityAnalysis.mbti && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                                            {profile.personalityAnalysis.mbti.type}
                                        </span>
                                        <span className="text-xs font-bold text-indigo-800">
                                            {profile.personalityAnalysis.mbti.description}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p><span className="font-semibold text-indigo-700">🧠 认知风格:</span> {profile.personalityAnalysis.mbti.cognitiveStyle}</p>
                                        <p><span className="font-semibold text-indigo-700">🎓 沟通建议:</span> {profile.personalityAnalysis.mbti.teachingAdvice}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                                    <div className="text-xs font-bold text-green-800 mb-1 flex items-center gap-1">
                                        <CheckCircle size={12} /> {profile.clientType === ClientType.PARENT ? '对家长推荐 (Do\'s)' : '推荐 (Do\'s)'}
                                    </div>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        {profile.personalityAnalysis.dos.slice(0, 3).map((item, i) => (
                                            <li key={i}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
                                    <div className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                                        <XCircle size={12} /> {profile.clientType === ClientType.PARENT ? '对家长禁忌 (Don\'ts)' : '禁忌 (Don\'ts)'}
                                    </div>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        {profile.personalityAnalysis.donts.slice(0, 3).map((item, i) => (
                                            <li key={i}>• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="bg-yellow-50/50 p-2.5 rounded-lg border border-yellow-100">
                                 <span className="text-xs font-bold text-yellow-800 block mb-0.5">🔥 {profile.clientType === ClientType.PARENT ? '家长成交必杀技' : '成交必杀技'}:</span>
                                 <p className="text-xs text-gray-700">{profile.personalityAnalysis.closingStrategy}</p>
                            </div>
                        </div>
                    </div>

                    {/* Child Interaction Card (Parent Only) */}
                    {profile.clientType === ClientType.PARENT && profile.personalityAnalysis.childInteractionGuide && (
                         <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 p-4 shadow-sm mt-4 animate-fade-in relative">
                            <div className="flex items-center gap-2 text-orange-900 font-bold mb-3 border-b border-orange-100 pb-2">
                                 <Baby size={18} />
                                 与孩子相处指南 (AI已生成)
                            </div>
                            
                            <div className="space-y-4 text-sm">
                                {/* Child MBTI */}
                                {profile.personalityAnalysis.childInteractionGuide.mbti && (
                                     <div className="bg-orange-100/50 border border-orange-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                                                {profile.personalityAnalysis.childInteractionGuide.mbti.type}
                                            </span>
                                            <span className="text-xs font-bold text-orange-800">
                                                {profile.personalityAnalysis.childInteractionGuide.mbti.description}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <p><span className="font-semibold text-orange-700">🧠 认知/学习:</span> {profile.personalityAnalysis.childInteractionGuide.mbti.cognitiveStyle}</p>
                                            <p><span className="font-semibold text-orange-700">🎓 教学建议:</span> {profile.personalityAnalysis.childInteractionGuide.mbti.teachingAdvice}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Child Personality */}
                                <div className="bg-white/60 p-3 rounded-lg border border-orange-100">
                                     <div className="text-xs font-bold text-orange-800 mb-1 flex items-center gap-1">
                                         <BrainCircuit size={12} /> 🧠 孩子性格画像
                                     </div>
                                     <p className="text-xs text-gray-700 leading-relaxed">
                                         {profile.personalityAnalysis.childInteractionGuide.personalityAnalysis}
                                     </p>
                                </div>

                                {/* Rewards & Toys */}
                                <div className="grid grid-cols-2 gap-3">
                                     <div className="bg-pink-50/50 p-2 rounded-lg border border-pink-100">
                                         <div className="text-xs font-bold text-pink-800 mb-1 flex items-center gap-1">
                                             <Gift size={12} /> 🎁 推荐奖励机制
                                         </div>
                                         <ul className="text-xs text-gray-600 space-y-1">
                                             {profile.personalityAnalysis.childInteractionGuide.rewardMechanisms.slice(0, 3).map((item, i) => (
                                                 <li key={i}>• {item}</li>
                                             ))}
                                         </ul>
                                     </div>
                                      <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                         <div className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                                             <Puzzle size={12} /> 🧩 推荐玩具/IP
                                         </div>
                                         <ul className="text-xs text-gray-600 space-y-1">
                                             {profile.personalityAnalysis.childInteractionGuide.toyTypes.slice(0, 3).map((item, i) => (
                                                 <li key={i}>• {item}</li>
                                             ))}
                                         </ul>
                                     </div>
                                </div>

                                {/* Do's & Don'ts */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                                        <div className="text-xs font-bold text-green-800 mb-1 flex items-center gap-1">
                                            <CheckCircle size={12} /> 对孩子推荐 (Do's)
                                        </div>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            {profile.personalityAnalysis.childInteractionGuide.dos.slice(0, 3).map((item, i) => (
                                                <li key={i}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
                                        <div className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                                            <XCircle size={12} /> 对孩子禁忌 (Don'ts)
                                        </div>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            {profile.personalityAnalysis.childInteractionGuide.donts.slice(0, 3).map((item, i) => (
                                                <li key={i}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50/50 p-2.5 rounded-lg border border-yellow-100">
                                     <span className="text-xs font-bold text-yellow-800 block mb-0.5">🚀 搞定孩子必杀技:</span>
                                     <p className="text-xs text-gray-700">{profile.personalityAnalysis.childInteractionGuide.winningStrategy}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Other Info & History */}
        <div className="grid grid-cols-1 gap-4 mt-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> 其他档案备注
                </label>
                <textarea 
                    value={profile.otherInfo}
                    onChange={(e) => handleChange('otherInfo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    placeholder="例如：奶奶接送，对老师比较客气..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <History className="w-3 h-3" /> 历史互动摘要 (AI自动更新)
                </label>
                <textarea 
                    value={profile.historySummary}
                    onChange={(e) => handleChange('historySummary', e.target.value)}
                    className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none text-gray-600"
                    rows={4}
                    placeholder="系统会自动记录每次分析后的摘要..."
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
