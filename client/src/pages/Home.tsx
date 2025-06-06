import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { StatisticsSection } from "@/components/StatisticsSection";
import { EducationalCard } from "@/components/EducationalCard";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Fetch games
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/games']
  });
  
  // Fetch educational content
  const { data: educationalContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/education']
  });
  
  const handleEducationCardClick = (id: number) => {
    navigate(`/education/${id}`);
  };