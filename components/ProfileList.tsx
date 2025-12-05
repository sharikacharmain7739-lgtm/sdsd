
import React, { useState } from 'react';
import { ClientProfile, ClientType, ClientStatus } from '../types';
import { Search, UserPlus, User, Baby, Layers, Filter, Download, FileText } from 'lucide-react';

interface ProfileListProps {
  profiles: ClientProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const ProfileList: React.FC<ProfileListProps> = ({ profiles, selectedId, onSelect, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ClientStatus>(ClientStatus.REGULAR);

  // Filter by search term AND active tab
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = 
      p.name.includes(searchTerm) || 
      (p.childName && p.childName.includes(searchTerm)) ||
      p.course.includes(searchTerm);
    
    return matchesSearch && p.status === activeTab;
  });

  // Specific Sorting Logic based on Status
  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    if (activeTab === ClientStatus.REGULAR) {
      // Regular: Fewest remaining lessons first (Ascending)
      return (a.remainingLessons || 0) - (b.remainingLessons || 0);
    } 
    else if (activeTab === ClientStatus.TRIAL) {
      // Trial: Fewest trial lessons first (Ascending) - urgency to convert
      return (a.trialRemainingLessons || 0) - (b.trialRemainingLessons || 0);
    }
    else {
      // Lead & Churned: Most recent Add Date first (Descending)
      return (b.addDate || 0) - (a.addDate || 0);
    }
  });

  const getTabLabel = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.REGULAR: return '正课';
      case ClientStatus.TRIAL: return '试听';
      case ClientStatus.LEAD: return '咨询';
      case ClientStatus.CHURNED: return '流失';
      default: return status;
    }
  };

  const handleExportAll = () => {
    if (profiles.length === 0) {
        alert("暂无档案可导出");
        return;
    }

    let htmlBody = `<h1 style="text-align: center; color: #1e3a8a;">全校学员档案汇总</h1><p style="text-align: center; color: #666;">导出日期: ${new Date().toLocaleDateString()}</p><hr/>`;

    const statuses = [ClientStatus.REGULAR, ClientStatus.TRIAL, ClientStatus.LEAD, ClientStatus.CHURNED];

    statuses.forEach(status => {
        const groupProfiles = profiles.filter(p => p.status === status);
        if (groupProfiles.length === 0) return;

        htmlBody += `<h2 style="background-color: #f3f4f6; padding: 10px; border-left: 5px solid #2563eb; margin-top: 30px; color: #1f2937;">${getTabLabel(status)}学员 (${groupProfiles.length}人)</h2>`;
        
        groupProfiles.forEach((p, index) => {
             const isParent = p.clientType === ClientType.PARENT;
             
             // Construct AI Analysis HTML if available
             let aiHtml = '';
             if (p.personalityAnalysis) {
                aiHtml = `
                    <div style="background-color: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; margin-top: 5px; font-size: 12px;">
                        <p><b>🧠 性格总结:</b> ${p.personalityAnalysis.summary}</p>
                        ${p.personalityAnalysis.mbti ? `<p><b>MBTI:</b> ${p.personalityAnalysis.mbti.type} (${p.personalityAnalysis.mbti.description})</p>` : ''}
                        <p><b>建议 (Do's):</b> ${p.personalityAnalysis.dos.join(', ')}</p>
                        <p><b>成交必杀技:</b> ${p.personalityAnalysis.closingStrategy}</p>
                    </div>
                `;
             }

             htmlBody += `
                <div style="margin-bottom: 20px; page-break-inside: avoid; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
                    <h3 style="margin-bottom: 5px; color: #111;">${index + 1}. ${p.name} <span style="font-size: 12px; font-weight: normal; color: #666;">(${p.course})</span></h3>
                    
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr>
                            <td style="width: 50%;"><b>类型:</b> ${p.clientType}</td>
                            <td style="width: 50%;"><b>孩子:</b> ${isParent ? `${p.childName} (${p.childAge}岁 ${p.childGender||''})` : '无'}</td>
                        </tr>
                        <tr>
                            <td><b>职业:</b> ${p.occupation || '-'}</td>
                            <td><b>居住地:</b> ${p.address || '-'}</td>
                        </tr>
                        <tr>
                            <td><b>课包:</b> ${p.currentPackage}</td>
                            <td>
                                <b>剩余课时:</b> 
                                <span style="${p.status === ClientStatus.REGULAR && p.remainingLessons < 4 ? 'color: red; font-weight: bold;' : ''}">
                                    ${p.remainingLessons}节
                                </span> 
                                ${p.status === ClientStatus.TRIAL ? `(试听余: ${p.trialRemainingLessons})` : ''}
                            </td>
                        </tr>
                    </table>

                    <p style="font-size: 12px; margin: 5px 0;"><b>标签:</b> ${[...p.studentPersonality, ...p.learningState, ...p.parentFocus].join(', ')}</p>
                    ${p.otherPackages ? `<p style="font-size: 12px; margin: 5px 0; color: #4f46e5;"><b>其他课包:</b> ${p.otherPackages}</p>` : ''}
                    
                    ${aiHtml}
                </div>
             `;
        });
    });
    
    const fullHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>全校学员档案汇总</title></head>
        <body style="font-family: 'Microsoft YaHei', sans-serif;">
            ${htmlBody}
        </body>
        </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `全校学员档案汇总_${new Date().toLocaleDateString().replace(/\//g, '-')}.doc`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名、孩子或课程..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>
        
        {/* Status Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {Object.values(ClientStatus).map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === status 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {getTabLabel(status)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
            <button 
                onClick={onAdd}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <UserPlus size={16} />
                新增档案
            </button>
            <button 
                onClick={handleExportAll}
                className="px-4 flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 py-2 rounded-lg transition-all shadow-sm"
                title="导出全校档案 (Word)"
            >
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sortedProfiles.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm flex flex-col items-center">
             <Filter size={32} className="mb-2 opacity-20" />
             <p>暂无{getTabLabel(activeTab)}档案</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedProfiles.map(profile => (
              <div 
                key={profile.id}
                onClick={() => onSelect(profile.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedId === profile.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold ${selectedId === profile.id ? 'text-blue-800' : 'text-gray-800'}`}>
                    {profile.name}
                  </h3>
                  
                  {/* Status Specific Badge */}
                  {activeTab === ClientStatus.REGULAR && (
                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.remainingLessons < 4 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                        余 {profile.remainingLessons} 节
                     </span>
                  )}
                  {activeTab === ClientStatus.TRIAL && (
                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600`}>
                        试听余 {profile.trialRemainingLessons || 0}
                     </span>
                  )}
                  {activeTab === ClientStatus.LEAD && (
                      <span className="text-[10px] text-gray-400">
                          {new Date(profile.addDate).toLocaleDateString()}
                      </span>
                  )}
                  {activeTab === ClientStatus.CHURNED && (
                      <span className="text-[10px] text-gray-400">已流失</span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 mb-1">
                  {profile.clientType === ClientType.PARENT ? (
                    <>
                      <Baby size={12} />
                      <span>{profile.childName}</span>
                    </>
                  ) : (
                    <>
                      <User size={12} />
                      <span>成人</span>
                    </>
                  )}
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{profile.course}</span>
                </div>

                {profile.otherPackages && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                        <Layers size={10} />
                        <span>{profile.otherPackages}</span>
                    </div>
                )}

                {profile.historySummary && !profile.otherPackages && (
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">
                    {profile.historySummary.split('\n').pop()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileList;
