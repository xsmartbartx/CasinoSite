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

            {/* Games Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-semibold">Casino Games</h2>
          <Link href="/games">
            <a className="text-accent-green hover:text-accent-green hover:underline text-sm font-medium flex items-center">
              View All <i className="fas fa-chevron-right ml-1 text-xs"></i>
            </a>
          </Link>
        </div>
        
        {/* Game cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gamesLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-secondary rounded-lg overflow-hidden border border-neutral-dark h-80 animate-pulse">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-6 bg-neutral-dark rounded w-1/3"></div>
                    <div className="h-4 bg-neutral-dark rounded w-16"></div>
                  </div>
                  <div className="h-40 bg-primary rounded-md mb-4"></div>
                  <div className="h-4 bg-neutral-dark rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-dark rounded w-3/4 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-dark rounded w-1/4"></div>
                    <div className="h-8 bg-neutral-dark rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))
          ) : games && games.length > 0 ? (
            games.map(game => (
              <GameCard 
                key={game.id}
                id={game.id}
                name={game.name}
                description={game.description}
                rtp={game.rtp}
                type={game.type}
                difficulty={game.difficulty}
                popular={game.popular}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-neutral-light">No games available at the moment.</p>
            </div>
          )}
        </div>
      </section>

       {/* Statistics Section (only shown if user is logged in) */}
      {user && (
        <StatisticsSection />
      )}
      
      {/* Educational Resources Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-semibold">Educational Resources</h2>
          <Link href="/education">
            <a className="text-sm text-accent-green hover:text-accent-purple flex items-center">
              View All Resources <i className="fas fa-arrow-right ml-1"></i>
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contentLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-secondary rounded-lg border border-neutral-dark overflow-hidden animate-pulse">
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-neutral-dark rounded-full mr-2"></div>
                    <div className="h-5 bg-neutral-dark rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-neutral-dark rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-dark rounded w-3/4 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-dark rounded w-1/4"></div>
                    <div className="h-4 bg-neutral-dark rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : educationalContent && educationalContent.length > 0 ? (
            educationalContent.map(content => (
              <EducationalCard
                key={content.id}
                id={content.id}
                title={content.title}
                content={content.content}
                icon={content.icon}
                readTime={content.readTime}
                onClick={handleEducationCardClick}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-neutral-light">No educational content available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}