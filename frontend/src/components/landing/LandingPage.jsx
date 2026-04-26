import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Sprout, 
  Shield, 
  BarChart3, 
  Bell, 
  Users, 
  TrendingUp,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  LogIn,
  UserPlus,
  FileText,
  AlertTriangle
} from 'lucide-react'

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-9 w-9 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Shamba Records
                </span>
                <p className="text-xs text-gray-500 -mt-1">SmartSeason</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-green-600 transition-colors">Home</Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">Dashboard</Link>
              <Link to="/fields" className="text-gray-600 hover:text-green-600 transition-colors">Fields</Link>
              <Link to="/at-risk" className="text-gray-600 hover:text-green-600 transition-colors">At Risk</Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/register"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" className="block px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg">Home</Link>
              <Link to="/dashboard" className="block px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg">Dashboard</Link>
              <Link to="/fields" className="block px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg">Fields</Link>
              <Link to="/at-risk" className="block px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg">At Risk</Link>
              <div className="pt-4 space-y-2 border-t border-gray-100 mt-2">
                <Link
                  to="/register"
                  className="block w-full px-3 py-2 bg-green-600 text-white rounded-lg text-center hover:bg-green-700"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="block w-full px-3 py-2 border border-green-600 text-green-600 rounded-lg text-center hover:bg-green-50"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                SmartSeason <span className="text-green-600">Field Monitoring</span> System
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Track crop progress across multiple fields, monitor plant health, and make data-driven decisions 
                throughout the growing season. Empowering farmers with real-time insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-center font-medium"
                >
                  Get Started Free
                </Link>
                <button 
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  Learn More
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
                <div>
                  <p className="text-2xl font-bold text-green-600">5+</p>
                  <p className="text-xs text-gray-500">Demo Farms</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">15%</p>
                  <p className="text-xs text-gray-500">Projected Yield Increase</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">10%</p>
                  <p className="text-xs text-gray-500">Expected Loss Reduction</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">8</p>
                  <p className="text-xs text-gray-500">Registered Farmers</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 shadow-2xl">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">SmartSeason Dashboard</h3>
                    <span className="text-xs text-green-600">Live Preview</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Demo Maize Field', stage: 'Growing', status: 'Active' },
                      { name: 'Demo Wheat Field', stage: 'Planted', status: 'Active' },
                      { name: 'Demo Rice Paddy', stage: 'Ready', status: 'At Risk' }
                    ].map((field, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Sprout className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{field.name}</span>
                          <span className="text-xs text-gray-500">{field.stage}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          field.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {field.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About SmartSeason */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About SmartSeason</h2>
            <div className="w-20 h-1 bg-green-600 mx-auto"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <span className="font-bold text-green-700">SmartSeason</span> is a comprehensive field monitoring 
                system designed to help farmers track crop progress across multiple fields during the growing season. 
                Our platform provides real-time insights, risk detection, and collaborative tools for farm managers and field agents.
              </p>
              <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-600">
                <p className="text-gray-700 italic">
                  "Empowering farmers with data-driven decisions for better crop management and increased yields."
                </p>
                <p className="text-sm text-gray-500 mt-2">— SmartSeason Team</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">Real-time</p>
                <p className="text-sm text-gray-600">Field Monitoring</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Bell className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">Instant</p>
                <p className="text-sm text-gray-600">Risk Alerts</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">Team</p>
                <p className="text-sm text-gray-600">Collaboration</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">15%+</p>
                <p className="text-sm text-gray-600">Yield Improvement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why SmartSeason */}
      <section className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Farmers Need SmartSeason</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Traditional farming faces challenges that SmartSeason solves with modern technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Late Risk Detection</h3>
              <p className="text-gray-600">
                Identify crop stress, pest infestations, and growth issues before they become critical.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manual Record Keeping</h3>
              <p className="text-gray-600">
                Replace paper logs with digital records that are accessible anywhere, anytime.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Poor Communication</h3>
              <p className="text-gray-600">
                Coordinate between farm managers and field agents with real-time updates and observations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started - Choose Role */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started with SmartSeason</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your role and start managing fields like a pro
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Admin Card */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-all">
              <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Farm Coordinator</h3>
              <p className="text-gray-600 text-center mb-4">Admin Access</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">View all fields and agents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Assign fields to agents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Monitor crop health across regions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Export analytics and reports</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full py-2 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition-all"
              >
                Register as Admin
              </Link>
              <p className="text-xs text-gray-400 text-center mt-2">Demo: adminshambarecords@gmail.com / Admin@123</p>
            </div>
            
            {/* Agent Card */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-all">
              <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Field Agent</h3>
              <p className="text-gray-600 text-center mb-4">Field Staff Access</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">View assigned fields</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Update crop stages</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Add observations and notes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Report issues and risks</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-all"
              >
                Register as Agent
              </Link>
              <p className="text-xs text-gray-400 text-center mt-2">Demo: agentshambarecords@gmail.com / agent123</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Impact Goals */}
      <section className="py-16 bg-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Project Goals & Expected Impact</h2>
            <div className="w-20 h-1 bg-white mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold">15%</p>
              <p className="text-sm opacity-90">Target Yield Increase</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">10%</p>
              <p className="text-sm opacity-90">Target Loss Reduction</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">50</p>
              <p className="text-sm opacity-90">Farmers by 2026</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">100%</p>
              <p className="text-sm opacity-90">Data-Driven Decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - SmartSeason Project Focus */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sprout className="h-6 w-6 text-green-500" />
                <div>
                  <span className="text-white font-bold text-lg">SmartSeason</span>
                  <p className="text-xs text-green-500">by Shamba Records</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Smart tools & data-driven solutions for modern farming. Empowering African agriculture 
                with real-time field monitoring and crop management systems.
              </p>
            </div>
            
            {/* SmartSeason Services */}
            <div>
              <h4 className="text-white font-semibold mb-4">SmartSeason Services</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-Time Field Monitoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Crop Growth Tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Risk Detection & Alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Agent Assignment System</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Observation & Notes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Data Analytics & Reports</span>
                </li>
              </ul>
            </div>
            
            {/* Contact with Map */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact & Location</h4>
              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                  <span>Mitsumi Business Park, Muthithi Road, Westlands, Nairobi, Kenya</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <a href="mailto:info@shambarecords.com" className="hover:text-white">info@shambarecords.com</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <a href="tel:+254732693963" className="hover:text-white">+254 732 693 963</a>
                </li>
              </ul>
              
              {/* Google Map */}
              <div className="mt-4">
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <iframe
                    title="Shamba Records Location - Nairobi"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.819569652598!2d36.800783!3d-1.264654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1746d8f3e9f1%3A0x8e0c2b9e5c2e5a5d!2sWestlands%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske"
                    width="100%"
                    height="150"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  <a href="https://maps.google.com/?q=Mitsumi+Business+Park+Westlands+Nairobi" target="_blank" rel="noopener noreferrer" className="hover:text-green-400">
                    View on Google Maps →
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Developer Credit */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Created for Shamba Records Software Internship Application
              </p>
              <p className="text-gray-500">Designed & Developed by</p>
              <p className="text-green-500 font-medium text-lg">Damaris Chege</p>
              <div className="flex items-center justify-center space-x-4 mt-2">
                <a href="mailto:deenyashke@gmail.com" className="text-sm hover:text-green-400">
                  deenyashke@gmail.com
                </a>
                <span className="text-gray-600">|</span>
                <a href="tel:+254708729553" className="text-sm hover:text-green-400">
                  +254 708 729 553
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage