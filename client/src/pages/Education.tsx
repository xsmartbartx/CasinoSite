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

        return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button 
          variant="outline" 
          className="mb-6 border-neutral-dark text-neutral-light hover:text-white"
          onClick={handleBack}
        >
          <i className="fas fa-arrow-left mr-2"></i> Back to All Resources
        </Button>
        
        <Card className="bg-secondary border-neutral-dark">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <i className={`fas ${specificContent.icon} text-accent-green text-2xl mr-3`}></i>
              <h1 className="font-display text-2xl font-semibold">{specificContent.title}</h1>
            </div>
            
            <div className="flex items-center mb-6 text-neutral-light text-sm">
              <span className="mr-4">
                <i className="far fa-clock mr-1"></i> {specificContent.readTime} min read
              </span>
              <span>
                <i className="far fa-folder mr-1"></i> 
                {specificContent.category === 'probability' && 'Probability Theory'}
                {specificContent.category === 'expected_value' && 'Expected Value'}
                {specificContent.category === 'rng' && 'Random Number Generation'}
              </span>
            </div>
            
            <div className="prose prose-invert max-w-none">
              {/* Article content - in a real app, this would be formatted markdown or HTML */}
              <p className="mb-4">
                {specificContent.content}
              </p>
              
              {specificContent.category === 'probability' && (
                <>
                  <h2>Basic Probability Concepts</h2>
                  <p>
                    Probability is the measure of the likelihood that an event will occur. It is quantified as a number between 0 and 1, where 0 indicates impossibility and 1 indicates certainty.
                  </p>
                  <p>
                    The basic formula for probability is:
                  </p>
                  <div className="bg-neutral-dark p-3 rounded-md my-4">
                    <div className="font-mono text-center">
                      P(Event) = Number of favorable outcomes / Total number of possible outcomes
                    </div>
                  </div>
                  <h3>Example with a Deck of Cards</h3>
                  <p>
                    When drawing a single card from a standard 52-card deck:
                  </p>
                  <ul>
                    <li>Probability of drawing an Ace: 4/52 = 1/13 ≈ 7.7%</li>
                    <li>Probability of drawing a Heart: 13/52 = 1/4 = 25%</li>
                    <li>Probability of drawing a Face Card (J, Q, K): 12/52 = 3/13 ≈ 23.1%</li>
                  </ul>
                  <h3>Probability in Casino Games</h3>
                  <p>
                    Casino games are designed using precise probability calculations to ensure the house maintains an edge while keeping players engaged with the possibility of winning.
                  </p>
                </>
              )}