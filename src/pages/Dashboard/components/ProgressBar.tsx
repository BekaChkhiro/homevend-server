import React from "react";

interface ProgressBarProps {
  percentage: number;
  title?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  title = "პროფილის შევსების მოწმება" 
}) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  const getProgressColor = (percent: number) => {
    if (percent < 30) return "bg-red-500";
    if (percent < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressText = (percent: number) => {
    if (percent < 30) return "დაბალი";
    if (percent < 70) return "საშუალო";
    return "მაღალი";
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{getProgressText(clampedPercentage)}</span>
          <span className="text-sm font-semibold text-gray-900">{clampedPercentage}%</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(clampedPercentage)}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};