import React, { useState } from 'react';
import { ClientProfile, ActivityPlan, ActivityCategory } from '../types';
import { FESTIVALS, ROUTINE_THEMES } from '../constants';
import { generateActivityPlan } from '../services/geminiService';
import { X, Sparkles, Calendar, Gift, Loader2, Copy, CheckCircle, Lightbulb, Zap } from 'lucide-react';

interface ActivityPlannerModalProps {
  profile: ClientProfile;
  onClose: () => void;
  onSaveToHistory: (summary: string) => void;
}

const ActivityPlannerModal: React.FC<ActivityPlannerModalProps> = ({ profile, onClose, onSaveToHistory }) => {
  const [category, setCategory] = useState<ActivityCategory>('FESTIVAL');
  const [selectedTheme, setSelectedTheme] = useState<string>(FESTIVALS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<ActivityPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCategoryChange = (cat: ActivityCategory) => {
      setCategory(cat);
      setSelectedTheme(cat === 'FESTIVAL' ? FESTIVALS[0] : ROUTINE_THEMES[0]);
      setPlan(null); // Reset plan when changing category
  };

  const handleGenerate = async () => {
      setIsGenerating(true);
      setError(null);
      try {
          const instructions = `活动类别: ${category}, 主题: ${selectedTheme}`;
          const result = await generateActivityPlan([profile], [], instructions);
          setPlan(result);
      } catch (err) {
          setError("策划生成失败，请重试");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleCopyScript = () => {
      if (plan) {
          navigator.clipboard.writeText(plan.reusableTemplates.privateMessageTemplate);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const handleSave = () => {
      if (plan) {
          const summary = `[${new Date().toLocaleDateString()}] 活动策划: ${plan.theme}\n方案: ${plan.contentDesign.renewalMechanism}`;
          onSaveToHistory(summary);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex justify-between items-center shrink-0">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                智能活动策划执行
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={() => handleCategoryChange('FESTIVAL')}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${category === 'FESTIVAL' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Gift size={16} /> 节日活动
                    </button>
                    <button
                        onClick={() => handleCategoryChange('ROUTINE')}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${category === 'ROUTINE' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Zap size={16} /> 日常/续费活动
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <select 
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                    >
                        {(category === 'FESTIVAL' ? FESTIVALS : ROUTINE_THEMES).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        开始策划
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm mb-4">
                    {error}
                </div>
            )}

            {/* Result */}
            {plan && (
                <div className="space-y-4 animate-fade-in">
                    {/* Theme Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
                        <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex justify-between items-center">
                            <h3 className="font-bold text-pink-800 text-lg">{plan.theme}</h3>
                            <span className="text-xs bg-white text-pink-600 px-2 py-1 rounded-full border border-pink-200 font-medium">
                                AI 定制方案
                            </span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                    <Lightbulb size={12} /> 受众分析
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                    {plan.personaSummary}
                                </p>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">🎯 心理钩子</h4>
                                    <p className="text-sm text-gray-700">{plan.smartStrategy}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">💰 续费 Offer</h4>
                                    <p className="text-sm text-red-600 font-bold">{plan.contentDesign.renewalMechanism}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Execution Steps */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            执行落地步骤 (当日)
                        </h4>
                        <ul className="space-y-2">
                            {plan.operationalSOP.duringEvent.map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-600">
                                    <span className="bg-gray-100 text-gray-500 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Script */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative group">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-gray-800">💬 私聊邀请话术</h4>
                            <button 
                                onClick={handleCopyScript}
                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                                {copied ? "已复制" : "复制"}
                            </button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {plan.reusableTemplates.privateMessageTemplate}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
             <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
                关闭
            </button>
            {plan && (
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-colors"
                >
                    保存方案摘要到档案
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPlannerModal;