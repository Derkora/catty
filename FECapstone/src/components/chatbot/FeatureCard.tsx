import React from 'react';
import { LucideIcon } from 'lucide-react';

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 transition-all duration-300 hover:transform hover:translate-y-[-5px] hover:shadow-lg border border-white/10">
      <div className="flex items-start">
        <div className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white mr-4">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <p className="text-blue-100/80 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
