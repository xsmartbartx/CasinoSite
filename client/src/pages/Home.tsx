import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { StatisticsSection } from "@/components/StatisticsSection";
import { EducationalCard } from "@/components/EducationalCard";
import { useAuth } from "@/hooks/useAuth";