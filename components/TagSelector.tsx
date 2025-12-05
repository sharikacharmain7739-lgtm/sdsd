import React from 'react';

interface TagSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  allowCustom?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({ label, options, selected, onChange, allowCustom = false }) => {
  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const [customInput, setCustomInput] = React.useState('');

  const addCustom = () => {
    if (customInput && !selected.includes(customInput)) {
        onChange([...selected, customInput]);
        setCustomInput('');
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggleTag(option)}
            className={`px-3 py-1 rounded-full text-sm transition-colors border ${
              selected.includes(option)
                ? 'bg-blue-100 text-blue-700 border-blue-200 font-semibold'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        ))}
        {/* Show selected custom tags that aren't in the default options */}
        {selected.filter(s => !options.includes(s)).map(tag => (
           <button
           key={tag}
           onClick={() => toggleTag(tag)}
           className="px-3 py-1 rounded-full text-sm transition-colors border bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold"
         >
           {tag} ✕
         </button>
        ))}
      </div>
      {allowCustom && (
          <div className="flex gap-2">
              <input 
                type="text" 
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="添加其他..."
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              />
              <button onClick={addCustom} className="text-xs bg-gray-200 px-2 rounded hover:bg-gray-300">+</button>
          </div>
      )}
    </div>
  );
};

export default TagSelector;