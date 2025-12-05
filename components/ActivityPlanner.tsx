
import React, { useEffect, useRef, useState } from 'react';
import { ClientProfile, ActivityPlan, ActivityChatMessage, ActivityCostConfig, InventoryItem, ActivityStyle } from '../types';
import { Sparkles, Gift, Copy, CheckCircle, Lightbulb, TrendingUp, Brain, Heart, DollarSign, Award, Clock, MessageCircle, FileText, Upload, Trash2, Save, User, Bot, RefreshCw, Settings, Plus, Minus, X } from 'lucide-react';

interface ActivityPlannerProps {
  chatHistory: ActivityChatMessage[];
  onClearChat: () => void;
  onSaveToHistory: (summary: string) => void;
  isGenerating: boolean;
  costConfig: ActivityCostConfig;
  setCostConfig: React.Dispatch<React.SetStateAction<ActivityCostConfig>>;
}

const ActivityPlanView: React.FC<{ plan: ActivityPlan }> = ({ plan }) => {
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-3 overflow-hidden text-left w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 flex justify-between items-center">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                    <Gift size={16} /> {plan.theme}
                </h2>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-medium">AI 优化方案</span>
            </div>

            <div className="p-4 space-y-4">
                 {/* 1. Market Analysis Dashboard */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-2">
                            <Brain size={12} className="text-blue-500" /> 关键画像
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">{plan.personaSummary}</p>
                        <div className="flex flex-wrap gap-1">
                            {plan.marketOpportunities.slice(0, 2).map((opp, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-white border border-blue-100 text-blue-600 rounded text-[9px]">{opp}</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-2">
                            <TrendingUp size={12} className="text-green-500" /> 策略评估
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-black text-green-600">{plan.successProbability.split(' - ')[0]}</span>
                            <span className="text-[10px] text-gray-400">成功率预测</span>
                        </div>
                         <p className="text-xs text-gray-600 leading-tight">💡 {plan.smartStrategy}</p>
                    </div>
                </div>

                {/* New: Financial Analysis */}
                {plan.financialAnalysis && (
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-3 rounded-lg border border-emerald-100">
                        <h3 className="text-xs font-bold text-emerald-800 mb-2 uppercase flex items-center gap-1">
                            <DollarSign size={12} /> 财务与成本分析
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                             <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                                 <div className="text-[9px] text-gray-500 font-bold mb-0.5">建议售价</div>
                                 <div className="text-sm text-emerald-600 font-black">¥{plan.financialAnalysis.suggestedPrice}</div>
                             </div>
                             <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                                 <div className="text-[9px] text-gray-500 font-bold mb-0.5">总成本</div>
                                 <div className="text-sm text-gray-600 font-black">¥{plan.financialAnalysis.totalCost.toFixed(2)}</div>
                             </div>
                             <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                                 <div className="text-[9px] text-gray-500 font-bold mb-0.5">预估利润</div>
                                 <div className="text-sm text-orange-600 font-black">¥{plan.financialAnalysis.profit.toFixed(2)}</div>
                             </div>
                        </div>
                        <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border border-emerald-50">
                            <div className="flex gap-2 mb-1">
                                <span className="font-bold text-emerald-700 w-12 shrink-0">🎁 礼物:</span> 
                                <span>
                                    {plan.financialAnalysis.breakdown.gifts.map(g => `${g.name}(¥${g.price})`).join(', ') || '无'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-emerald-700 w-12 shrink-0">🛠 材料:</span> 
                                <span>
                                    {plan.financialAnalysis.breakdown.materials.map(m => `${m.name}(¥${m.price})`).join(', ') || '无'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Content Design */}
                <div className="bg-pink-50/50 p-3 rounded-lg border border-pink-100">
                     <h3 className="text-xs font-bold text-pink-800 mb-2 uppercase flex items-center gap-1">✨ 核心设计</h3>
                     <ul className="space-y-1 mb-3">
                        {plan.contentDesign.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-gray-700 flex gap-2">
                                <span className="text-pink-500 font-bold">•</span> {h}
                            </li>
                        ))}
                    </ul>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="bg-white p-2 rounded border border-pink-100">
                            <div className="text-[10px] text-gray-500 font-bold mb-0.5 flex items-center gap-1"><Heart size={10}/> 家长价值</div>
                            <div className="text-xs text-gray-700">{plan.contentDesign.parentAppeal}</div>
                         </div>
                         <div className="bg-white p-2 rounded border border-pink-100">
                            <div className="text-[10px] text-gray-500 font-bold mb-0.5 flex items-center gap-1"><Award size={10}/> 续费钩子</div>
                            <div className="text-xs text-red-600 font-bold">{plan.contentDesign.renewalMechanism}</div>
                         </div>
                    </div>
                </div>

                {/* 3. SOP */}
                <div className="border border-gray-100 rounded-lg p-3">
                     <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1"><Clock size={12}/> 落地 SOP</h3>
                     <div className="space-y-2">
                         {['preEvent', 'duringEvent', 'postEvent'].map((phase, idx) => (
                             <div key={phase} className="flex gap-2 text-xs">
                                 <div className={`w-16 shrink-0 font-bold ${idx===0?'text-purple-600':idx===1?'text-pink-600':'text-blue-600'}`}>
                                     {idx===0?'📅 预热':idx===1?'🔥 当天':'🚀 跟进'}
                                 </div>
                                 <div className="text-gray-600 flex-1">
                                     {/* @ts-ignore */}
                                     {plan.operationalSOP[phase].join(' → ')}
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>

                {/* 4. Scripts */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1"><MessageCircle size={12}/> 话术模板</h3>
                        <button 
                            onClick={() => handleCopy(plan.reusableTemplates.privateMessageTemplate, 'private')}
                            className="text-[10px] bg-white border px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-gray-50"
                        >
                            {copiedText === 'private' ? <CheckCircle size={10} className="text-green-500"/> : <Copy size={10}/>} 复制私聊
                        </button>
                     </div>
                     <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap leading-relaxed">
                         {plan.reusableTemplates.privateMessageTemplate}
                     </p>
                </div>
            </div>
        </div>
    );
};

const ActivityPlanner: React.FC<ActivityPlannerProps> = ({ 
    chatHistory,
    onClearChat,
    onSaveToHistory,
    isGenerating,
    costConfig,
    setCostConfig
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', price: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', price: '' });

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [chatHistory, isGenerating]);

  const handleSaveLastPlan = () => {
      const lastPlanMessage = [...chatHistory].reverse().find(m => m.plan);
      if (lastPlanMessage?.plan) {
          const plan = lastPlanMessage.plan;
          const summary = `[${new Date().toLocaleDateString()}] 活动策划 (AI优化): ${plan.theme}\n建议售价: ¥${plan.financialAnalysis?.suggestedPrice || '?'}\n总成本: ¥${plan.financialAnalysis?.totalCost.toFixed(2) || '?'}`;
          onSaveToHistory(summary);
      }
  };

  const addItem = (type: 'gifts' | 'materials') => {
      const input = type === 'gifts' ? newGift : newMaterial;
      if (!input.name || !input.price) return;
      const newItem: InventoryItem = { name: input.name, price: parseFloat(input.price) };
      setCostConfig(prev => ({
          ...prev,
          [type]: [...prev[type], newItem]
      }));
      if (type === 'gifts') setNewGift({ name: '', price: '' });
      else setNewMaterial({ name: '', price: '' });
  };

  const removeItem = (type: 'gifts' | 'materials', index: number) => {
      setCostConfig(prev => ({
          ...prev,
          [type]: prev[type].filter((_, i) => i !== index)
      }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
        {/* Chat Header */}
        <div className="bg-white p-3 border-b border-gray-200 shadow-sm flex justify-between items-center shrink-0 z-10">
            <div className="flex items-center gap-2 text-gray-700">
                <Sparkles size={18} className="text-pink-500" />
                <h3 className="font-bold text-sm">活动策划智能优化助手</h3>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`flex items-center gap-1 text-xs border px-3 py-1.5 rounded-lg transition-colors shadow-sm font-medium ${showConfig ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'}`}
                >
                    <Settings size={14} /> 成本设置
                </button>
                <button 
                    onClick={onClearChat}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
                    title="清空会话"
                >
                    <Trash2 size={16} />
                </button>
                <button 
                    onClick={handleSaveLastPlan}
                    className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-600 font-medium"
                >
                    <Save size={14} /> 保存方案
                </button>
            </div>
        </div>
        
        {/* Config Panel */}
        {showConfig && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-fade-in shrink-0 overflow-y-auto max-h-[300px] custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                        <DollarSign size={16} /> 财务与库存配置
                    </h3>
                    <button onClick={() => setShowConfig(false)} className="text-indigo-400 hover:text-indigo-700">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <label className="block text-xs font-bold text-gray-500 mb-1">最低单价 (Floor Price)</label>
                        <div className="flex items-center">
                            <span className="text-gray-400 text-sm mr-1">¥</span>
                            <input 
                                type="number" 
                                value={costConfig.floorPrice}
                                onChange={(e) => setCostConfig(p => ({ ...p, floorPrice: parseFloat(e.target.value) || 0 }))}
                                className="w-full text-sm font-bold text-indigo-700 outline-none border-b border-gray-200 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                         <label className="block text-xs font-bold text-gray-500 mb-1">成本上限比例 (Budget Cap)</label>
                         <div className="flex items-center">
                            <input 
                                type="number" 
                                value={costConfig.budgetCapPercent}
                                onChange={(e) => setCostConfig(p => ({ ...p, budgetCapPercent: parseFloat(e.target.value) || 0 }))}
                                className="w-full text-sm font-bold text-indigo-700 outline-none border-b border-gray-200 focus:border-indigo-500"
                            />
                            <span className="text-gray-400 text-sm ml-1">%</span>
                        </div>
                         <div className="text-[10px] text-gray-400 mt-1">
                             最大成本: ¥{(costConfig.floorPrice * costConfig.budgetCapPercent / 100).toFixed(1)}
                         </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-2">活动风格偏好</label>
                    <div className="flex gap-2">
                        {['RITUAL', 'FUN', 'SKILL', 'STAGE'].map((style) => (
                            <button
                                key={style}
                                onClick={() => setCostConfig(p => ({ ...p, preferredStyle: style as ActivityStyle }))}
                                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                    costConfig.preferredStyle === style 
                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-indigo-50'
                                }`}
                            >
                                {style === 'RITUAL' ? '仪式感' : style === 'FUN' ? '趣味性' : style === 'SKILL' ? '技能提升' : '舞台展示'}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Gifts Inventory */}
                     <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-600 mb-2">🎁 礼物库</label>
                        <ul className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                            {costConfig.gifts.map((item, i) => (
                                <li key={i} className="flex justify-between text-xs p-1 bg-gray-50 rounded">
                                    <span>{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">¥{item.price}</span>
                                        <button onClick={() => removeItem('gifts', i)} className="text-gray-400 hover:text-red-500"><X size={10}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-1">
                            <input 
                                placeholder="名称" 
                                className="w-2/3 text-xs border rounded px-1 py-0.5" 
                                value={newGift.name} 
                                onChange={e => setNewGift(p => ({ ...p, name: e.target.value }))}
                            />
                            <input 
                                placeholder="¥" 
                                type="number" 
                                className="w-1/4 text-xs border rounded px-1 py-0.5" 
                                value={newGift.price} 
                                onChange={e => setNewGift(p => ({ ...p, price: e.target.value }))}
                            />
                            <button onClick={() => addItem('gifts')} className="text-indigo-600"><Plus size={16}/></button>
                        </div>
                     </div>

                     {/* Materials Inventory */}
                     <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-600 mb-2">🛠 材料库</label>
                         <ul className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                            {costConfig.materials.map((item, i) => (
                                <li key={i} className="flex justify-between text-xs p-1 bg-gray-50 rounded">
                                    <span>{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">¥{item.price}</span>
                                        <button onClick={() => removeItem('materials', i)} className="text-gray-400 hover:text-red-500"><X size={10}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-1">
                            <input 
                                placeholder="名称" 
                                className="w-2/3 text-xs border rounded px-1 py-0.5" 
                                value={newMaterial.name} 
                                onChange={e => setNewMaterial(p => ({ ...p, name: e.target.value }))}
                            />
                            <input 
                                placeholder="¥" 
                                type="number" 
                                className="w-1/4 text-xs border rounded px-1 py-0.5" 
                                value={newMaterial.price} 
                                onChange={e => setNewMaterial(p => ({ ...p, price: e.target.value }))}
                            />
                             <button onClick={() => addItem('materials')} className="text-indigo-600"><Plus size={16}/></button>
                        </div>
                     </div>
                </div>
            </div>
        )}

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6" ref={scrollRef}>
            {chatHistory.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-gray-400 opacity-60">
                    <Upload size={48} className="mb-4 text-gray-300" />
                    <h3 className="text-sm font-bold text-gray-500 mb-1">请上传您的活动草稿</h3>
                    <p className="text-xs max-w-xs text-center leading-relaxed mb-4">
                        直接粘贴图片/文本，或上传PDF文件。<br/>
                        AI将结合全校档案为您深度优化方案。
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-[10px] text-indigo-700 max-w-xs">
                        💡 提示: 点击上方 <Settings size={10} className="inline"/> <b>成本设置</b>，AI将自动为您计算成本并推荐符合预算的礼物组合。
                    </div>
                </div>
            )}

            {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Text Bubble */}
                        {msg.content && (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                }`}
                            >
                                {msg.content}
                            </div>
                        )}
                        
                        {/* Render Attached Files (User) */}
                        {msg.files && msg.files.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {msg.files.map((f, i) => (
                                    <div key={i} className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                                         {/* Simple check if base64 is pdf-like or just show icon */}
                                        <img src={`data:image/jpeg;base64,${f}`} className="w-full h-full object-cover opacity-80" alt="file" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Render Plan Dashboard (Model) */}
                        {msg.plan && <ActivityPlanView plan={msg.plan} />}
                    </div>
                </div>
            ))}

            {isGenerating && (
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                         <Bot size={16} />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                        <RefreshCw className="animate-spin text-pink-500 w-4 h-4" />
                        <span className="text-xs text-gray-500 font-medium">AI 正在进行财务测算与方案优化...</span>
                    </div>
                 </div>
            )}
        </div>
    </div>
  );
};

export default ActivityPlanner;
