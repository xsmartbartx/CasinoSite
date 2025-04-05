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