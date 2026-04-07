import { Link } from "react-router";
import { Database, Brain, BookOpen, Globe, BarChart3, Users, ArrowRight, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-xl">SADC AI Hub</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-700 hover:text-blue-600">Services</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600">About</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 px-4 py-2">
                Login
              </Link>
              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                🇿🇼 Powering Zimbabwe & SADC with AI
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                AI Models & Data Solutions for <span className="text-blue-600">Southern Africa</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Advanced AI model development, comprehensive data warehousing, learning resources, and training platforms tailored for Zimbabwe and the SADC region.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  Start Building
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 border border-gray-300">
                  Explore Platform
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1650357519740-c888919621f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx6aW1iYWJ3ZSUyMGxhbmRzY2FwZSUyMG1vZGVybnxlbnwxfHx8fDE3NzU1ODA3NjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Zimbabwe landscape"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What We Do</h2>
            <p className="text-xl text-gray-600">Comprehensive AI and data solutions for the SADC region</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Model Development</h3>
              <p className="text-gray-600">
                Custom AI models trained on African data, optimized for local languages and contexts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Data Warehousing</h3>
              <p className="text-gray-600">
                Secure, scalable data infrastructure for Zimbabwe and SADC regional data.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Learning Resources</h3>
              <p className="text-gray-600">
                Educational content, tutorials, and documentation for AI practitioners.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Training Programs</h3>
              <p className="text-gray-600">
                Hands-on training and workshops to build AI expertise across the region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Platform Features</h2>
              <p className="text-lg text-gray-600 mb-8">
                Access cutting-edge tools designed specifically for African data and AI challenges.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Pre-trained Models</h4>
                    <p className="text-gray-600">Browse and deploy models trained on SADC regional data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Curated Datasets</h4>
                    <p className="text-gray-600">Access cleaned, annotated datasets specific to Zimbabwe and SADC</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Collaborative Workspace</h4>
                    <p className="text-gray-600">Share models, datasets, and collaborate with the community</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Training Resources</h4>
                    <p className="text-gray-600">Interactive tutorials and courses on AI and machine learning</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1717501219263-9aa2d6a768d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3NzU1NTY3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="AI neural network"
                className="w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">AI Models</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Datasets</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Learning Courses</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Community Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join our community and start building AI solutions for Africa today.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700">
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-white">SADC AI Hub</span>
              </div>
              <p className="text-sm">
                Empowering Zimbabwe and SADC with AI and data solutions.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Models</a></li>
                <li><a href="#" className="hover:text-white">Datasets</a></li>
                <li><a href="#" className="hover:text-white">Learning</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
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
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 SADC AI Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
