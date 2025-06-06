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