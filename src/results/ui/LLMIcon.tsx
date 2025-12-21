import openaiIcon from "@/assets/openai-icon.svg";
import geminiIcon from "@/assets/gemini-icon.svg";

interface LLMIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LLMIcon = ({ platform, size = "md", className = "" }: LLMIconProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  const normalizedPlatform = platform.toLowerCase();
  
  if (normalizedPlatform === 'openai' || normalizedPlatform === 'chatgpt') {
    return (
      <img 
        src={openaiIcon} 
        alt="OpenAI" 
        className={`${sizeClasses[size]} ${className}`}
      />
    );
  }
  
  if (normalizedPlatform === 'gemini') {
    return (
      <img 
        src={geminiIcon} 
        alt="Gemini" 
        className={`${sizeClasses[size]} ${className}`}
      />
    );
  }
  
  // Fallback for other platforms
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/20 flex items-center justify-center ${className}`}>
      <span className="text-xs font-bold text-primary">{platform[0]?.toUpperCase()}</span>
    </div>
  );
};
