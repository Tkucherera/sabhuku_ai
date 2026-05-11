import { Brain } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-white">SABHUKU AI</span>
            </div>
            <p className="text-sm">
              Empowering Zimbabwe and SADC with AI and data solutions.
            </p>SABHUKU AI
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#about" className="hover:text-white">About</a></li>
              <li><Link to="/about/our-team/" className="hover:text-white">Team</Link></li>
              <li><a href="/#support" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">License</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Socials</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://discord.gg/EytdFfRC" target="_blank" rel="noreferrer" className="hover:text-white">Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© 2026 SABHUKU AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
