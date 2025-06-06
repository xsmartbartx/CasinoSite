import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EducationalCard } from "@/components/EducationalCard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

export default function Education() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Fetch all educational content
  const { 
    data: educationalContent, 
    isLoading: contentLoading 
  } = useQuery({
    queryKey: ['/api/education']
  });
  
  // If an ID is provided, fetch that specific content
  const { 
    data: specificContent, 
    isLoading: specificContentLoading 
  } = useQuery({
    queryKey: [`/api/education/${id}`],
    enabled: !!id
  });
  
  // Filter content by category
  const filteredContent = selectedTab === "all" 
    ? educationalContent 
    : educationalContent?.filter((content: any) => content.category === selectedTab);
  
  // Handle educational card click
  const handleCardClick = (contentId: number) => {
    navigate(`/education/${contentId}`);
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate("/education");
  };

    // Showing a specific article
  if (id) {
    if (specificContentLoading) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="bg-secondary border-neutral-dark">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/3 bg-neutral-dark mb-4" />
              <Skeleton className="h-4 w-full bg-neutral-dark mb-2" />
              <Skeleton className="h-4 w-full bg-neutral-dark mb-2" />
              <Skeleton className="h-4 w-3/4 bg-neutral-dark mb-8" />
              <Skeleton className="h-32 w-full bg-neutral-dark mb-4" />
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (!specificContent) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="bg-secondary border-neutral-dark">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold mb-4">Content Not Found</h2>
              <p className="text-gray-400 mb-6">The educational content you're looking for could not be found.</p>
              <Button onClick={handleBack}>Back to Education</Button>
            </CardContent>
          </Card>
        </div>
      );
    }