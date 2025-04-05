import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EducationalCardProps {
    title: string;
    content: string;
    icon: string;
    readTime: number;
    id: number;
    onClick?: (id: number) => void;
    className?: string;
}

export function EducationalCard({
    title,
    content,
    icon,
    readTime,
    id,
    onClick,
    className
}: EducationalCardProps) {
    const handleClick = () => {
      if (onClick) onClick(id);
};

return (
    <div className={cn(
      "bg-secondary rounded-lg border border-neutral-dark overflow-hidden",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center mb-3">
          <i className={`fas ${icon} text-accent-green mr-2`}></i>
          <h3 className="font-display font-medium">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          {content}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs bg-neutral-dark px-2 py-1 rounded-full text-neutral-light">
            {readTime} min read
          </span>
          <Button 
            variant="link" 
            className="text-accent-green hover:text-accent-purple text-sm p-0"
            onClick={handleClick}
          >
            Read Article
          </Button>
        </div>
      </div>
    </div>
  );
}