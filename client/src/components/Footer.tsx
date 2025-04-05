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
        <motion.div 
            className="mb-8 md:mb-0 md:max-w-sm"
            variants={fadeInUpVariants}
            transition={{ duration: 0.4 }}
        >
                        <Link href="/">
              <a className="font-display font-bold text-2xl gradient-text">
                EduCasino
              </a>
            </Link>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              An educational platform for understanding the mathematics and probabilities behind casino games. 
              All simulations use verifiable randomness and detailed statistical analysis.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-xs">No real money involved. Educational purposes only.</span>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-16"
            variants={fadeInUpVariants}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                Platform
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Games
                    </a>
                  </Link>
                </li>
                <li>
                <Link href="/statistics">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Statistics
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/education">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Education
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      About
                    </a>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Resources
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/education/probability">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Probability Theory
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/education/mathematics">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Game Mathematics
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/education/rng">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Random Number Generation
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/education/responsible">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Responsible Gaming
                    </a>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                <ScrollText className="h-4 w-4 mr-2 text-primary" />
                Legal
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/terms">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Terms of Service
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Privacy Policy
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Disclaimer
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <a className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Contact Us
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center"
          variants={fadeInUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} EduCasino. All rights reserved.
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="hidden sm:inline-block mx-2">•</span>
              <span>Made with</span>
              <Heart className="h-3 w-3 mx-1 text-destructive" />
              <span>for education</span>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex space-x-6">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>