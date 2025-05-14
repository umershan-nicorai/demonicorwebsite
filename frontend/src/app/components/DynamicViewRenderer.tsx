import React, { useId, useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import DynamicContentRenderer from './DynamicContentRenderer';
import {
  Brain,
  MessageSquare,
  BarChart3,
  Zap,
  Database,
  Bot,
  LineChart,
  Sparkles,
  ChevronRight,
  Briefcase,
  Code,
  Users,
  Shield,
  Clock,
  Globe,
  Cpu,
  Network,
  Boxes,
  Search,
  Workflow,
  Share2,
  Phone,
  Mail,
  MapPin,
  Target,
  ArrowRight
} from 'lucide-react';

interface ViewProps {
  viewId: string;
  onClose: () => void;
  dynamicViewContent?: any; // For dynamic content from chat
}

// Helper function for classNames conditional joining
const cn = (...classes: any[]) => {
  return classes.filter(Boolean).join(' ');
};

const DynamicViewRenderer: React.FC<ViewProps> = ({ viewId, onClose, dynamicViewContent }) => {
  // Function to render content based on viewId
  const renderContent = () => {
    // Check if this is a dynamic view from chat
    if (viewId === 'dynamic-view' && dynamicViewContent) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-4xl">
            <DynamicContentRenderer
              view={dynamicViewContent}
              onClose={onClose}
            />
          </div>
        </div>
      );
    }

    // Regular static views
    switch (viewId) {
      case 'what-we-do':
        return <WhatWeDoPage onClose={onClose} />;
      case 'what-weve-done':
        return <WhatWeveDonePage onClose={onClose} />;
      case 'connect':
        return <ConnectPage onClose={onClose} />;
      case 'us':
        return <AboutUsPage onClose={onClose} />;
      case 'inspiration':
        return <InspirationPage onClose={onClose} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-gray-700">Select a section from the sidebar to view content</p>
          </div>
        );
    }
  };

  return (
    <div className="relative flex-1 h-full overflow-auto bg-white pb-24">
      {/* Remove close button for dynamic views to avoid duplication */}
      {viewId !== 'dynamic-view' && (
        <div className="sticky top-0 right-0 p-4 flex justify-end z-50 bg-transparent">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm"
            aria-label="Close view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

// WHAT WE DO PAGE
const WhatWeDoPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      <AIHeroSection />
      <AIServicesSection />
      <TechStackSection />
      <AIProcessSection />
    </div>
  );
};

const AIHeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-10 pb-12">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white bg-grid-pattern"></div>
        <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-indigo-100/20 to-blue-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mb-4">
                <Cpu size={14} className="mr-2" />
                AI-Powered Solutions
              </div>
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                Transform Your Business With <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AI-Powered Solutions</span>
              </h1>
              <p className="mt-4 text-xl text-gray-600 leading-relaxed">
                We leverage cutting-edge artificial intelligence and machine learning to deliver
                powerful solutions that drive growth, efficiency, and innovation.
              </p>
              <div className="mt-8 flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md flex items-center"
                >
                  Explore Our Services
                  <ChevronRight size={18} className="ml-2" />
                </motion.button>
                
              </div>
            </motion.div>
          </div>

          <div className="flex-1 max-w-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 shadow-xl">
                {/* Nodes animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <NetworkAnimation />
                </div>

                {/* Floating element */}
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/4 left-1/4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center"
                >
                  <Brain size={32} className="text-blue-600" />
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 15, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute top-2/4 right-1/4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center"
                >
                  <Cpu size={32} className="text-indigo-600" />
                </motion.div>

                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100/50">
                  <h3 className="font-semibold text-gray-900">AI Technologies</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Machine Learning • NLP • Neural Networks • Computer Vision
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const NetworkAnimation = () => {
  return (
    <svg width="320" height="320" viewBox="0 0 320 320">
      <g className="nodes">
        {Array.from({ length: 15 }).map((_, i) => {
          const x = 160 + Math.cos(i * (Math.PI * 2) / 15) * 120;
          const y = 160 + Math.sin(i * (Math.PI * 2) / 15) * 120;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#3b82f6"
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                r: [4, 6, 4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          );
        })}

        <motion.circle
          cx="160"
          cy="160"
          r="8"
          fill="#4f46e5"
          initial={{ opacity: 0.7 }}
          animate={{
            opacity: [0.7, 1, 0.7],
            r: [8, 10, 8]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </g>

      <g className="connections" stroke="#3b82f6" strokeOpacity="0.2" strokeWidth="1">
        {Array.from({ length: 15 }).map((_, i) => {
          const x1 = 160 + Math.cos(i * (Math.PI * 2) / 15) * 120;
          const y1 = 160 + Math.sin(i * (Math.PI * 2) / 15) * 120;
          return (
            <motion.line
              key={i}
              x1="160"
              y1="160"
              x2={x1}
              y2={y1}
              initial={{ strokeOpacity: 0.1 }}
              animate={{ strokeOpacity: [0.1, 0.4, 0.1] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </g>
    </svg>
  );
};

const AIServicesSection = () => {
  const services = [
    {
      title: "AI Strategy Consulting",
      description: "We guide your organization through the AI adoption journey with strategic planning and roadmapping.",
      icon: <Brain className="w-6 h-6 text-blue-600" />,
      color: "from-blue-50 to-blue-100/50"
    },
    {
      title: "Natural Language Processing",
      description: "Build intelligent chatbots, sentiment analysis tools, and automated content generation systems.",
      icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
      color: "from-indigo-50 to-indigo-100/50"
    },
    {
      title: "Computer Vision Solutions",
      description: "Implement image recognition, object detection, and video analysis and many more for various applications.",
      icon: <Search className="w-6 h-6 text-violet-600" />,
      color: "from-violet-50 to-violet-100/50"
    },
    {
      title: "Predictive Analytics",
      description: "Forecast future trends and behaviors with our machine learning-powered predictive models.",
      icon: <LineChart className="w-6 h-6 text-blue-600" />,
      color: "from-blue-50 to-blue-100/50"
    },
    {
      title: "ML Model Development",
      description: "We build, train, and deploy custom machine learning models tailored to your specific needs.",
      icon: <Boxes className="w-6 h-6 text-indigo-600" />,
      color: "from-indigo-50 to-indigo-100/50"
    },
    {
      title: "AI Process Automation",
      description: "Automate repetitive tasks and complex workflows with intelligent AI-powered solutions.",
      icon: <Workflow className="w-6 h-6 text-violet-600" />,
      color: "from-violet-50 to-violet-100/50"
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mb-4">
            <Share2 size={14} className="mr-2" />
            Our Services
          </div>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Comprehensive AI Solutions
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We offer a wide range of AI services designed to help your business thrive
            in the era of artificial intelligence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full flex"
            >
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className={`bg-gradient-to-br ${color} p-6`}>
        <div className="flex items-center gap-4 min-h-[3rem]">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 leading-[28px] flex items-center h-full">
            <span className="block self-center">{title}</span>
          </h3>
        </div>
      </div>
      <div className="p-6 pt-4">
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

const TechStackSection = () => {
  const techItems = [
    { name: "TensorFlow", category: "Framework" },
    { name: "PyTorch", category: "Framework" },
    { name: "Scikit-learn", category: "Library" },
    { name: "BERT", category: "Model" },
    { name: "GPT", category: "Model" },
    { name: "Computer Vision", category: "Technology" },
    { name: "NLP", category: "Technology" },
    { name: "Neural Networks", category: "Technology" },
    { name: "AWS", category: "Platform" },
    { name: "Google Cloud", category: "Platform" },
    { name: "Azure", category: "Platform" },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Our Technology Stack
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We utilize cutting-edge technologies and frameworks
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {techItems.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -5, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
              className="bg-white px-4 py-2 rounded-full border border-blue-100 shadow-sm"
            >
              <span className="text-gray-900 font-medium">{tech.name}</span>
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {tech.category}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const AIProcessSection = () => {
  const processSteps = [
    {
      title: "Discovery",
      description: "We start by understanding your business needs, challenges, and goals.",
      icon: <Search className="w-6 h-6 text-white" />,
      color: "bg-blue-600"
    },
    {
      title: "Strategy",
      description: "We formulate a strategic plan to implement AI solutions tailored to your needs.",
      icon: <Briefcase className="w-6 h-6 text-white" />,
      color: "bg-indigo-600"
    },
    {
      title: "Development",
      description: "Our team builds, trains, and tests AI models and solutions.",
      icon: <Code className="w-6 h-6 text-white" />,
      color: "bg-purple-600"
    },
    {
      title: "Deployment",
      description: "We seamlessly integrate AI solutions into your existing systems and workflows.",
      icon: <Share2 className="w-6 h-6 text-white" />,
      color: "bg-violet-600"
    },
    {
      title: "Optimization",
      description: "Continuous monitoring and improvement to ensure optimal performance.",
      icon: <Zap className="w-6 h-6 text-white" />,
      color: "bg-blue-600"
    },
  ];

  return (
    <section className="py-20 bg-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/50 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/50 rounded-full filter blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Our AI Implementation Process
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A systematic approach to successfully integrating AI into your business
          </p>
        </motion.div>

        <div className="flex flex-col items-center">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex w-full max-w-3xl mb-6"
            >
              <div className="flex flex-col items-center mr-6">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>
                  {step.icon}
                </div>
                {index < processSteps.length - 1 && (
                  <div className="w-1 h-16 bg-gray-200 my-2"></div>
                )}
              </div>
              <div className="flex-1 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


// WHAT WE'VE DONE PAGE
const WhatWeveDonePage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      <CaseStudiesHero />
      <FeaturedProjects />
      <TestimonialsSection />
    </div>
  );
};
 
const CaseStudiesHero = () => {
  return (
    <section className="relative pt-10 pb-12 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-white bg-grid-pattern"></div>
        <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-purple-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-purple-100/20 rounded-full filter blur-3xl animate-float"></div>
      </div>
 
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-100 mb-4">
            <Briefcase size={14} className="mr-2" />
            Case Studies
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
            Our AI Success Stories
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Explore our portfolio of AI and ML solutions that have transformed businesses across industries.
          </p>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex justify-center"
        >
          <div className="relative w-full max-w-4xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl filter blur-xl animate-pulse" style={{ animationDuration: "4s" }}></div>
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="p-8 md:col-span-2">
                  <div className="flex items-center mb-4">
                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-600">Featured Case Study</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Predictive Maintenance</h3>
                  <p className="text-gray-600 mb-6">
                    We developed a machine learning system that predicts equipment failures for a manufacturing company,
                    reducing downtime by 37% and saving millions in maintenance costs.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">Manufacturing</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Predictive Analytics</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">IoT</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md flex items-center text-sm font-medium"
                  >
                    View Full Case Study
                    <ChevronRight size={16} className="ml-1" />
                  </motion.button>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-8">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      rotateZ: [0, 5, 0, -5, 0]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <LineChart size={44} className="text-purple-600" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
 
const FeaturedProjects = () => {
  const projects = [
    {
      title: "Healthcare AI Assistant",
      description: "Developed an AI assistant for a major healthcare provider that reduced administrative workload by 35% and improved patient satisfaction.",
      category: "Healthcare",
      tags: ["NLP", "Workflow Automation"],
      color: "blue",
      icon: <Users className="w-8 h-8" />,
      metrics: [
        { value: "35%", label: "Reduced Workload" },
        { value: "89%", label: "Patient Satisfaction" }
      ]
    },
    {
      title: "Retail Demand Forecasting",
      description: "Built predictive models for a retail chain that improved inventory management and increased sales by 22%.",
      category: "Retail",
      tags: ["Predictive Analytics", "ML"],
      color: "green",
      icon: <BarChart3 className="w-8 h-8" />,
      metrics: [
        { value: "22%", label: "Sales Increase" },
        { value: "31%", label: "Reduced Overstock" }
      ]
    },
    {
      title: "Customer Support Chatbot",
      description: "Developed an intelligent chatbot for a SaaS company that handles 70% of customer queries without human intervention.",
      category: "SaaS",
      tags: ["Chatbot", "NLP"],
      color: "yellow",
      icon: <MessageSquare className="w-8 h-8" />,
      metrics: [
        { value: "70%", label: "Query Resolution" },
        { value: "85%", label: "Faster Response" }
      ]
    },
    {
      title: "Financial Fraud Detection",
      description: "Implemented an AI fraud detection system for a financial institution that reduced fraudulent transactions by 92%.",
      category: "Finance",
      tags: ["Security", "Pattern Recognition"],
      color: "purple",
      icon: <Shield className="w-8 h-8" />,
      metrics: [
        { value: "92%", label: "Fraud Reduction" },
        { value: "$4.3M", label: "Cost Savings" }
      ]
    }
  ];
 
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-teal-600",
    yellow: "from-amber-500 to-orange-600",
    purple: "from-purple-500 to-pink-600"
  };
 
  const bgColorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-800",
    green: "bg-emerald-50 text-emerald-800",
    yellow: "bg-amber-50 text-amber-800",
    purple: "bg-purple-50 text-purple-800"
  };
 
  return (
    <section className="py-16 bg-gradient-to-b from-white relative to-purple-50">
      <div className="absolute inset-0 bg-grid-pattern"></div>
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Featured AI Projects
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our work spans across industries, showcasing the versatility and power of our AI solutions
          </p>
        </motion.div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md transition-all duration-300 flex flex-col h-full"
            >
              <div className={`bg-gradient-to-r ${colorMap[project.color]} h-48 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                <div className="absolute top-6 right-6">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center">
                    {project.icon}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[14px] leading-5 font-medium ${bgColorMap[project.color]} mb-2`}>
                    {project.category}
                  </div>
                  <h3 className="text-2xl font-bold">{project.title}</h3>
                </div>
              </div>
 
              <div className="p-6 flex flex-col flex-1">
                <p className="text-gray-600 mb-6">{project.description}</p>
 
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[14px] leading-5 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
 
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {project.metrics.map((metric, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-800">{metric.value}</div>
                      <div className="text-[14px] leading-5 text-gray-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
 
                <div className="mt-auto">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-2 bg-gray-900 text-white rounded-lg shadow-sm flex items-center justify-center text-sm font-medium"
                  >
                    View Project Details
                    <ChevronRight size={16} className="ml-1" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
 
const TestimonialsSection = () => {
  const testimonials = [
    {
      content: "NicorAI's predictive analytics solution completely transformed our inventory management. We've seen a 22% increase in sales and significantly reduced overstock issues.",
      author: "Sarah Johnson",
      title: "CTO, RetailPlus Inc.",
      image: "👩‍💼"
    },
    {
      content: "The healthcare AI assistant developed by NicorAI has revolutionized our patient management system. Administrative tasks are down by 35% and patient satisfaction is at an all-time high.",
      author: "Dr. Michael Chen",
      title: "Director of Operations, MediCare Group",
      image: "👨‍⚕️"
    },
    {
      content: "Working with NicorAI on our fraud detection system was seamless. Their AI solution reduced fraudulent transactions by 92% while minimizing false positives.",
      author: "Alex Rivera",
      title: "Head of Security, FinSecure",
      image: "👨‍💼"
    }
  ];
 
  return (
    <section className="py-20 bg-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-100/30 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-100/30 rounded-full filter blur-3xl"></div>
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.9px", lineHeight: "40px" }}>
            What Our Clients Say
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", }}>
            Success stories from organizations that have partnered with us
          </p>
        </motion.div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-purple-100 relative flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <div className="text-purple-300 text-7xl leading-none">"</div>
              </div>
              <div className="flex-1 flex flex-col min-h-[160px]">
                <p className="text-gray-600 mb-6 relative z-10" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "16px", lineHeight: "24px" }}>
                  {testimonial.content}
                </p>
                <div className="flex items-center mt-auto pt-2">
                  <div className="flex-shrink-0 mr-3 text-3xl">{testimonial.image}</div>
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
 

// CONNECT PAGE
const ConnectPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      <ContactHero />
      <ContactForm />
      <OfficeLocations />
    </div>
  );
};
 
const ContactHero = () => {
  return (
    <section className="relative pt-10 pb-16 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white bg-grid-pattern"></div>
        <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-teal-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-teal-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>
 
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-teal-50 to-blue-50 text-teal-700 border border-teal-100 mb-4">
            <MessageSquare size={14} className="mr-2" />
            Get in Touch
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
            Let's Connect and Discuss Your AI Solutions
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Ready to transform your business with AI? Reach out to our team to explore how NicorAI can help you achieve your goals.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
 
const ContactForm = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    submitted: false,
    loading: false
  });
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ ...formState, loading: true });
 
    // Simulate form submission
    setTimeout(() => {
      setFormState({ ...formState, submitted: true, loading: false });
    }, 1500);
  };
 
  return (
    <section className="py-12 relative">
      {/* Background pattern - positioned beneath the form */}
      <div className="absolute inset-0 bg-grid-pattern z-0"></div>
     
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center items-center min-h-[80vh]">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[500px]"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative z-20">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
 
                {formState.submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center"
                  >
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for reaching out. A member of our team will get back to you shortly.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
 
                    <div className="space-y-1">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
 
                    <div className="space-y-1">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        value={formState.company}
                        onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your company name"
                      />
                    </div>
 
                    <div className="space-y-1">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                        How can we help? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        rows={5}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Tell us about your project or query..."
                        required
                      ></textarea>
                    </div>
 
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={formState.loading}
                      className={`w-full py-3 px-6 ${formState.loading ? 'bg-gray-400' : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'} text-white font-medium rounded-lg shadow-md transition-all duration-300 flex items-center justify-center`}
                    >
                      {formState.loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
 
const OfficeLocations = () => {
  const locations = [
    {
      city: "Kochi",
      address: "Confident Gem, Rajagiri Valley, Kakkanad, Kochi, Kerala, India 682039",
      phone: "+91 9876543210",
      email: "nicorai@gmail.com",
      image: "🌉"
    },
    {
      city: "Thiruvananthapuram",
      address: "Sasthamangalam, Thiruvananthapuram, Kerala 695010, 8.5114381,76.9672403",
      phone: "+91 9876543210",
      email: "nicorai@gmail.com",
      image: "🗽"
    }
  ];
 
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern z-0"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-teal-100/20 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100/20 rounded-full filter blur-3xl z-0"></div>
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Our Offices
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Visit us at any of our office locations
          </p>
        </motion.div>
 
        <div className="flex flex-wrap justify-center gap-8 mt-8">
          {locations.map((location, index) => (
            <motion.div
              key={location.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 w-full max-w-xs md:w-96 relative z-20"
            >
 
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{location.city}</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-start">
                    <MapPin className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{location.address}</span>
                  </p>
                  <p className="flex items-center">
                    <Phone className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <span>{location.phone}</span>
                  </p>
                  <p className="flex items-center">
                    <Mail className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <span>{location.email}</span>
                  </p>
                </div>
                <div className="mt-6">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center text-sm font-medium transition-colors duration-300"
                    >
                      Get Directions
                      <MapPin className="h-4 w-4 ml-2" />
                    </motion.button>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


// ABOUT US PAGE
const AboutUsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      <AboutHero />
      <OurStory />
      <TeamSection />
      <CoreValues />
    </div>
  );
};
 
const AboutHero = () => {
  return (
    <section className="relative pt-10 pb-16 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white bg-grid-pattern"></div>
        <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-indigo-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-indigo-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>
 
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 mb-4">
            <Users size={14} className="mr-2" />
            About Us
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
            Pioneering Intelligent Solutions
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            At NicorAI, we are a team of passionate innovators dedicated to pushing the boundaries of what's possible with Artificial Intelligence and Immersive Technologies. We're not just building AI; we're crafting intelligent solutions that transform businesses and shape the future. Inspired by the pioneering work of Nicolas Rashevsky, we approach AI with a deep understanding of the fundamental mathematical principles that underpin its power and potential.
          </p>
          <br />
          <br />
 
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-6">
          We specialize in two core areas
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
          Cutting-edge Artificial Intelligence and immersive Augmented & Virtual Reality solutions
          </p>
          <br />
 
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-6">
          AI/ML: Custom Solutions and Development
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
          We design and develop bespoke narrow AI models precisely tailored to address unique business challenges, moving beyond gene solutions. Our services encompass AI-augmented development, enabling businesses to leverage AI in every part of their operational framework. From detailed data analysis to seamless deployment, we handle every step in the development lifecycle.
          </p>
          <br />
 
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-6">
          AR/VR: Immersive Application Development
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
          We craft immersive Augmented and Virtual Reality experiences designed to engage, educate, and transform how our clients connect with their audiences. From training simulations to virtual product demos, we use AR/VR to create innovative ways for businesses to engage their customers and stakeholders, ensuring memorable and impactful experiences.
          </p>
          <br /><br />
        </motion.div>
      </div>
    </section>
  );
};
 
 
const OurStory = () => {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-full h-full rounded-2xl bg-indigo-100/50"></div>
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-indigo-100 p-8 h-full flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    NicorAI was founded in 2019 with a vision to make artificial intelligence accessible and practical
                    for businesses of all sizes. Our team of experts combines deep technical knowledge with
                    business acumen to deliver AI solutions that drive real results.
                  </p>
                  <p>
                    We began as a small team of AI researchers and engineers passionate about the transformative
                    potential of machine learning. Today, we've grown into a leading AI consultancy with a global
                    presence, serving clients across industries.
                  </p>
                  <p>
                    What sets us apart is our client-centric approach. We don't just implement technology;
                    we partner with you to understand your business challenges and develop custom solutions
                    that address your specific needs.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl overflow-hidden text-white p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold ml-4">Our Mission</h3>
              </div>
              <p className="text-indigo-100 mb-8 text-[16px]">
                Our mission is to democratize artificial intelligence by making powerful, easy-to-use AI tools accessible and practical for businesses of all sizes. We aim to bridge the gap between innovation and real-world application, helping organizations unlock value, drive efficiency, and make smarter decisions through AI
              </p>
 
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold ml-4">Our Vision</h3>
              </div>
              <p className="text-indigo-100 text-[16px]">
                A world where AI enhances human potential, drives business innovation,solves real-world problems and
                creates solutions to our most pressing challenges.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
 
const TeamSection = () => {
  const team = [
    {
      name: "Jane Doe",
      title: "CEO & Founder",
      bio: "AI enthusiast with 15+ years of experience in machine learning and business leadership. Previously led AI initiatives at Tech Giant Inc.",
      image: "👩‍💼",
      color: "from-indigo-500 to-blue-600"
    },
    {
      name: "John Smith",
      title: "CTO",
      bio: "Former research scientist with expertise in NLP and conversational AI architectures. Published author with multiple patents in machine learning.",
      image: "👨‍💻",
      color: "from-emerald-500 to-teal-600"
    },
    {
      name: "Emily Chen",
      title: "Lead Data Scientist",
      bio: "PhD in Computer Science with specialization in predictive modeling and data analysis. Previously developed AI systems for Fortune 500 companies.",
      image: "👩‍🔬",
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "Michael Rodriguez",
      title: "AI Research Director",
      bio: "Former AI researcher at a leading tech company with expertise in deep learning and computer vision. Helped develop breakthrough AI technologies.",
      image: "👨‍🔬",
      color: "from-blue-500 to-cyan-600"
    },
    {
      name: "Sarah Johnson",
      title: "Head of Product",
      bio: "Product management expert with experience bringing AI products from concept to market. Focused on creating intuitive user experiences for complex technologies.",
      image: "👩‍💻",
      color: "from-amber-500 to-orange-600"
    },
    {
      name: "David Kim",
      title: "Business Development Director",
      bio: "Strategic partnership expert who has helped scale AI solutions across industries. Specializes in creating innovative business models around AI technologies.",
      image: "👨‍💼",
      color: "from-rose-500 to-red-600"
    }
  ];
 
  return (
    <section className="py-20 bg-gradient-to-b from-white to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Our Leadership Team
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Meet the experts behind our AI innovations
          </p>
        </motion.div>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 flex flex-col h-full"
            >
              <div className={`h-48 bg-gradient-to-r ${member.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                <div className="text-6xl">{member.image}</div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-indigo-600 font-medium mb-3">{member.title}</p>
                <p className="text-gray-600 mb-4">{member.bio}</p>
                <div className="flex space-x-3 mt-auto">
                  <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
 
const CoreValues = () => {
  const values = [
    {
      title: "Innovation",
      description: "We push the boundaries of what's possible with AI, constantly exploring new technologies and approaches.",
      icon: <Sparkles className="h-6 w-6" />,
      color: "bg-blue-50 text-blue-700 border-blue-100"
    },
    {
      title: "Integrity",
      description: "We operate with transparency and ethical standards, ensuring responsible use of AI technology.",
      icon: <Shield className="h-6 w-6" />,
      color: "bg-indigo-50 text-indigo-700 border-indigo-100"
    },
    {
      title: "Impact",
      description: "We measure our success by the tangible results we deliver for our clients and the value we create.",
      icon: <Zap className="h-6 w-6" />,
      color: "bg-purple-50 text-purple-700 border-purple-100"
    },
    {
      title: "Collaboration",
      description: "We believe in working closely with our clients, becoming true partners in their AI journey.",
      icon: <Users className="h-6 w-6" />,
      color: "bg-teal-50 text-teal-700 border-teal-100"
    }
  ];
 
  return (
    <section className="py-20 bg-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-100/50 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100/50 rounded-full filter blur-3xl"></div>
 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            Our Core Values
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The principles that guide our work and shape our culture
          </p>
        </motion.div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100"
            >
              <div className="flex items-start">
                <div className={`w-14 h-14 rounded-full ${value.color} flex items-center justify-center mr-6`}>
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100"
        >
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Join Our Team</h3>
            <p className="text-gray-700 text-center mb-8 max-w-3xl mx-auto">
              We're always looking for talented individuals who are passionate about AI and want to make a difference.
              Check out our open positions or send us your resume.
            </p>
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg shadow-md flex items-center"
              >
                View Open Positions
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
 

// INSPIRATION PAGE
const InspirationPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      <InspirationHero />
      <RashevskyStory />
      <RashevskyImpact />
      <VisionandImpact />
      <InspirationCommitment />
    </div>
  );
};

const InspirationHero = () => (
  <section className="relative pt-10 pb-16 overflow-hidden">
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-white bg-grid-pattern"></div>
      <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-purple-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float"></div>
      <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-purple-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
    </div>
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-100 mb-4">
          <Sparkles size={14} className="mr-2" />
          Our Inspiration
        </div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
          The Legacy of <span className="text-blue-600">Nicolas Rashevsky</span>
        </h1>
        <div className="flex justify-center mb-6">
          <Image
            src="/images/Nicolas_Rashevsky.png"
            alt="Nicolas Rashevsky"
            width={280}
            height={280}
            className="rounded-2xl shadow-lg border border-purple-100 bg-white object-cover"
            priority
          />
        </div>
        <p className="text-xl text-gray-700 mb-4 leading-relaxed">
          At NicorAI, we believe that true innovation is built upon a foundation of groundbreaking ideas and visionary thinkers. Our journey into the world of artificial intelligence is deeply inspired by the pioneering work of Nicolas Rashevsky, a theoretical biophysicist whose ideas were far ahead of their time. Rashevsky's work wasn't just about biology; it was a profound exploration of how mathematical principles could unlock the secrets of complex systems â€" a vision that forms the core of our approach to AI today. He was, in many ways, a founding father of the AI revolution, and his legacy fuels our mission
        </p>
      </motion.div>
    </div>
  </section>
);

const RashevskyStory = () => (
  <section className="py-16 relative">
    <div className="absolute inset-0 bg-grid-pattern z-0"></div>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8 relative z-20"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Story of Nicolas Rashevsky</h2>
        <div className="space-y-4 text-gray-700">
          <p>Nicolas Rashevsky wasn't a computer scientist in the traditional sense. Born in 1899, he was a brilliant scholar who applied the rigor of mathematics to the complexities of the human body and, in doing so, stumbled upon concepts that would become crucial to artificial intelligence. He was a polymath, straddling the worlds of mathematics, physics, and biology. In 1934, he left for Chicago and became the first professor of mathematical biophysics at the University of Chicago. He was ahead of his time, and he believed in the power of mathematics to unlock the secrets of life</p>
          <p>Rashevsky's approach was to apply mathematical modeling to biological systems, seeing patterns and structures that were previously hidden. His work on neural networks, though initially framed within the context of the human brain, laid the theoretical groundwork for the artificial neural networks that are fundamental to today's deep learning and AI systems. He co-authored the book "Mathematical Biophysics" which included the famous "Theory of the Brain" which is considered a core component of AI development, he even anticipated many technologies and challenges of the present day through his work.</p>
        </div>
      </motion.div>
    </div>
  </section>
);


const RashevskyImpact = () => (
  <section className="py-16 relative">
    <div className="absolute inset-0 bg-grid-pattern z-0"></div>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8 relative z-20"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rashevsky's Lasting Impact</h2>
        <p className='text-gray-700'>Rashevsky's insights weren't just confined to the lab. His commitment to using mathematical tools to understand and solve complex problems has become a cornerstone of our approach to AI. Like him, we believe that AI is not just about programming; it's about understanding the underlying systems and structures. This philosophy is embodied in our approach.</p><br />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Focus on Foundational Principles</h3>
            <p className="text-gray-700">We take a mathematical and systematic approach to AI, following Rashevsky's lead.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Emphasis on Systemic Understanding</h3>
            <p className="text-gray-700">We don't just build AI models; we strive to understand the underlying mechanics of what we're building, which leads to more robust and meaningful solutions.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Rigorous Training</h3>
            <p className="text-gray-700">We rigorously train your AI models on relevant datasets, using proven methodology to ensure accuracy.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Dedication to Innovation</h3>
            <p className="text-gray-700">Like Rashevsky, we're dedicated to pushing the boundaries of what's possible, exploring new frontiers in AI and ML.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Commitment to Rigorous Analysis</h3>
            <p className="text-gray-700">Our work is backed by data and mathematical precision, ensuring a scientific and methodological approach, aligning with the principles of Rashevsky's work.</p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const VisionandImpact = () => (
  <section className="py-12 relative">
    <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0"></div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-6">A Legacy of Vision and Impact</h2>
        <p className="text-xl text-gray-700 mb-4 leading-relaxed">Rashevsky's story is one of scientific exploration and groundbreaking innovation. He embodied a spirit of intellectual curiosity and interdisciplinary thinking that inspired not only many mathematicians and physicists but also many in the field of AI. We continue to follow his lead and dedicate our efforts to transforming the potential of AI to solve real problems in the business world. His legacy of combining mathematics and science is our guide.</p>
      </motion.div>
    </div>
  </section>
);

const InspirationCommitment = () => (
  <section className="py-12 relative">
    <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0"></div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Commitment</h2>
        <p className="text-xl text-gray-700 mb-4 leading-relaxed">At NicorAI, we honor Rashevsky's legacy by embracing his methodical approach and unwavering commitment to scientific thinking. By focusing on these principles, we unlock AI's transformative potential and create solutions with lasting impact. We dedicate our efforts to building systems worthy of his legacy.</p>
      </motion.div>
    </div>
  </section>
);


export default DynamicViewRenderer;