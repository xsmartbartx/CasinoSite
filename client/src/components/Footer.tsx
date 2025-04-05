import { Link } from "wouter";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Heart, ScrollText, BookOpen, Computer, Shield, DollarSign, BookMarked, Users, Info, Mail } from "lucide-react";

export function Footer() {
    const fadeInUpVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
};

 // Current year for copyright
 const currentYear = new Date().getFullYear();

 return (
    <footer className="bg-muted/30 border-t border-border py-12 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex flex-col md:flex-row justify-between"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
        > 