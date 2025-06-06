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

    return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Authentication banner for non-logged in users */}
      {!user && (
        <div className="mb-8 p-6 bg-secondary rounded-lg border border-neutral-dark">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="font-display text-xl font-semibold mb-2">Start Your Educational Journey</h2>
              <p className="text-gray-300">Create an account to track your progress and understand game mathematics.</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/register">
                <Button className="bg-accent-green hover:bg-opacity-80 text-black font-medium py-2 px-6 rounded-md transition-colors duration-200">
                  Register
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="bg-neutral-dark hover:bg-neutral-medium text-white font-medium py-2 px-6 rounded-md transition-colors duration-200">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}