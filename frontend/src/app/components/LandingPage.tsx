import { Link } from "react-router";
import { Database, Brain, BookOpen, Users, ArrowRight, CheckCircle, Sparkles, MessageSquareHeart, ShieldCheck } from "lucide-react";
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
              <span className="font-bold text-xl">SABHUKU AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-800 font-semibold hover:text-blue-600">Services</a>
              <a href="#about" className="text-gray-800 font-semibold hover:text-blue-600">About</a>
              <a href="#features" className="text-gray-800 font-semibold hover:text-blue-600">Features</a>
              <a href="/community/tutorials/" className="text-gray-800 font-semibold hover:text-blue-600">Community Tutorials</a>
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
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(135deg,_#f5f9ff_0%,_#eef4ff_45%,_#f7fbff_100%)]">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/80 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm ring-1 ring-blue-100">
                <Sparkles className="w-4 h-4" />
                AI infrastructure, local intelligence, open contribution
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 mb-6 leading-[1.02]">
                Build, share, and deploy
                <span className="text-blue-600"> AI models and datasets </span>
                with a community rooted in Africa.
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl">
                SABHUKU AI is a platform for practical AI solutions and a growing developer community. Discover models, contribute datasets, collaborate on real use cases, and build systems shaped by local context and global standards.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                <div className="rounded-2xl bg-white/85 border border-blue-100 px-4 py-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Model Hub</div>
                  <div className="text-sm text-slate-600 mt-1">Publish and discover reusable AI building blocks.</div>
                </div>
                <div className="rounded-2xl bg-white/85 border border-emerald-100 px-4 py-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Dataset Commons</div>
                  <div className="text-sm text-slate-600 mt-1">Curate data that helps teams train better systems.</div>
                </div>
                <div className="rounded-2xl bg-white/85 border border-slate-200 px-4 py-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Developer Community</div>
                  <div className="text-sm text-slate-600 mt-1">Learn, contribute, and ship together.</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200/60">
                  Start Building
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#support" className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-50 border border-gray-300">
                  Get Support
                </a>
                <a href="/community/tutorials/" className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-50 border border-gray-300">
                  Read Tutorials
                </a>
                <Link to="/login" className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-50 border border-gray-300">
                  Explore Platform
                </Link>
              </div>
            </div>
            <div className="relative z-10">
              <div className="absolute -left-6 top-8 hidden md:flex rounded-2xl bg-slate-950 text-white px-4 py-3 shadow-xl">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Community signal</div>
                  <div className="text-sm font-semibold mt-1">Models + data + builders in one place</div>
                </div>
              </div>
              <div className="absolute -right-5 bottom-8 hidden md:flex rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Built for real deployment</div>
                    <div className="text-xs text-slate-500">From experimentation to production-ready assets</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-white/70">
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

      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 mb-4">Why SABHUKU AI</p>
              <h2 className="text-4xl font-extrabold text-slate-950 mb-5">A shared home for AI solutions, local data, and the people building them.</h2>
              <p className="text-lg text-slate-600 max-w-3xl">
                We want teams to do more than just consume AI. SABHUKU AI is designed to help researchers, founders, engineers, and curious learners contribute useful assets, collaborate around real-world needs, and grow a stronger AI ecosystem across Zimbabwe, the SADC region, and beyond.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <Users className="w-6 h-6 text-orange-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">Community-led by design</h3>
                <p className="text-slate-600 mt-2">Contributors can publish datasets, share models, and help each other improve what gets built.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <Database className="w-6 h-6 text-green-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-900">Grounded in useful data</h3>
                <p className="text-slate-600 mt-2">Better local AI starts with accessible, well-described, reusable datasets.</p>
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
                  <CheckCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Curated Datasets</h4>
                    <p className="text-gray-600">Access cleaned, annotated datasets specific to Zimbabwe and SADC</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Collaborative Workspace</h4>
                    <p className="text-gray-600">Share models, datasets, and collaborate with the community</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-black-600 flex-shrink-0 mt-1" />
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

      {/* Stats Section Will show this wen the community grows
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
      */}
      {/* Support Section */}
      <section id="support" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300 mb-4">Support</p>
              <h2 className="text-4xl font-extrabold mb-5">Need help getting started, contributing, or finding the right AI approach?</h2>
              <p className="text-lg text-slate-300 max-w-2xl">
                Whether you're exploring your first dataset upload, building a local-language model, or looking for collaboration, we want support to feel human and accessible.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <MessageSquareHeart className="w-6 h-6 text-blue-300 mb-3" />
                <h3 className="text-xl font-bold">Ask the community</h3>
                <p className="text-slate-300 mt-2 mb-4">Join the Discord and get help from builders, contributors, and early users.</p>
                <a href="https://discord.gg/EytdFfRC" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-3 font-semibold hover:bg-slate-100">
                  Join Discord
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-6">
                <h3 className="text-xl font-bold">Need direct support?</h3>
                <p className="text-slate-300 mt-2">We can add a proper support form or contact workflow next if you want this section to route enquiries somewhere specific.</p>
              </div>
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
                <span className="font-bold text-white">SABHUKU AI</span>
              </div>
              <p className="text-sm">
                Empowering Zimbabwe and SADC with AI and data solutions.
              </p>
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

            <div>
              <h4 className="font-bold text-white mb-4">Socials</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://discord.gg/EytdFfRC" target="_blank" rel="noreferrer" className="hover:text-white">Discord</a></li>
                {/* <li><a href="#" className="hover:text-white">X</a></li> */}
                {/* <li><a href="#" className="hover:text-white">Instagram</a></li> */}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 SABHUKU AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
