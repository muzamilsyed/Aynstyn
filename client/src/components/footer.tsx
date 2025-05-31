import { Link } from "wouter";
import aynstynLogo from "../assets/aynstyn-logo.png";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={aynstynLogo} 
                alt="Aynstyn Logo" 
                className="h-10 w-auto bg-white rounded-full p-1"
              />
              <span className="text-xl font-bold">Aynstyn</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered knowledge assessment platform that analyzes your understanding, identifies knowledge gaps, and provides personalized learning recommendations.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Home</Link></li>
              <li><Link href="/assessment" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Assessment</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/help-center" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Help Center</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">About</Link></li>
              <li><Link href="/contact-us" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/privacy-policy" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Terms & Conditions</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Policies</h3>
            <ul className="space-y-2">
              <li><Link href="/cancellation-refund" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Cancellation & Refund</Link></li>
              <li><Link href="/shipping-delivery" onClick={scrollToTop} className="text-gray-400 hover:text-white transition">Shipping & Delivery</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Aynstyn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
