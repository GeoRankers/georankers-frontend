import { getBrandLogo, getBrandName } from "@/results/data/analyticsData";

interface BrandLogoProps {
  brandName: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}

export const BrandLogo = ({ brandName, size = "md", className = "", showFallback = true }: BrandLogoProps) => {
  const logo = getBrandLogo(brandName);
  const isPrimaryBrand = brandName === getBrandName();
  
  const sizeClasses = {
    xs: "w-4 h-4 text-[8px]",
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base"
  };
  
  if (logo) {
    return (
      <img 
        src={logo} 
        alt={brandName} 
        className={`${sizeClasses[size].split(' ').slice(0, 2).join(' ')} rounded-full object-contain bg-white shadow-sm ${className}`}
        onError={(e) => { 
          if (showFallback) {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden');
          }
        }}
      />
    );
  }
  
  if (!showFallback) return null;
  
  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${
      isPrimaryBrand ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
    } ${className}`}>
      {brandName[0]?.toUpperCase()}
    </div>
  );
};
