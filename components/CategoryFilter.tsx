import React from 'react';
import { Flame, Play, Newspaper, Users, LayoutGrid } from 'lucide-react';

export type CategoryType = 'ALL' | 'TRENDING' | 'VIDEO' | 'NEWS' | 'POST';

interface CategoryFilterProps {
  selected: CategoryType;
  onSelect: (category: CategoryType) => void;
}

const categories = [
  { id: 'ALL' as CategoryType, label: 'NEXUS', icon: LayoutGrid },
  { id: 'TRENDING' as CategoryType, label: 'PEAK', icon: Flame },
  { id: 'VIDEO' as CategoryType, label: 'VAULT', icon: Play },
  { id: 'NEWS' as CategoryType, label: 'WIRE', icon: Newspaper },
  { id: 'POST' as CategoryType, label: 'SOCIAL', icon: Users },
];

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selected, onSelect }) => {
  return (
    <div className="w-full flex justify-center px-4 mb-12 sm:mb-20">
      <div className="nav-pill p-1.5 flex items-center gap-1 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selected === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 relative flex-shrink-0 ${
                  isActive 
                    ? 'nav-item-active' 
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                <span className="leading-none">{cat.label}</span>
                {isActive && (
                   <div className="absolute -top-1 right-2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;