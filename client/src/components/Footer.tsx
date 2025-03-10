import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary border-t border-neutral-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/">
              <a className="font-display font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-accent-green to-accent-purple">
                EduCasino
              </a>
            </Link>
            <p className="mt-2 text-sm text-gray-400 max-w-md">
              An educational platform for understanding the mathematics and probabilities behind casino games. No real money is involved.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/"><a className="text-sm text-gray-400 hover:text-white">Games</a></Link></li>
                <li><Link href="/statistics"><a className="text-sm text-gray-400 hover:text-white">Statistics</a></Link></li>
                <li><Link href="/education"><a className="text-sm text-gray-400 hover:text-white">Education</a></Link></li>
                <li><Link href="/about"><a className="text-sm text-gray-400 hover:text-white">About</a></Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/education/probability"><a className="text-sm text-gray-400 hover:text-white">Probability Theory</a></Link></li>
                <li><Link href="/education/mathematics"><a className="text-sm text-gray-400 hover:text-white">Game Mathematics</a></Link></li>
                <li><Link href="/education/rng"><a className="text-sm text-gray-400 hover:text-white">Random Number Generation</a></Link></li>
                <li><Link href="/education/responsible"><a className="text-sm text-gray-400 hover:text-white">Responsible Gaming</a></Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms"><a className="text-sm text-gray-400 hover:text-white">Terms of Service</a></Link></li>
                <li><Link href="/privacy"><a className="text-sm text-gray-400 hover:text-white">Privacy Policy</a></Link></li>
                <li><Link href="/disclaimer"><a className="text-sm text-gray-400 hover:text-white">Disclaimer</a></Link></li>
                <li><Link href="/contact"><a className="text-sm text-gray-400 hover:text-white">Contact Us</a></Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-dark flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} EduCasino. All rights reserved. For educational purposes only.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
