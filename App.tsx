import React, { useState } from 'react';
import { Tab } from './types';
import Dashboard from './components/Dashboard';
import CodeViewer from './components/CodeViewer';
import BenchmarkChart from './components/BenchmarkChart';
import { LayoutDashboard, Code, BarChart3, Github } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);

  return (
    <div className="min-h-screen bg-[#0F0E17] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-monad-primary/20 bg-[#0F0E17]/90 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-monad-primary to-monad-secondary rounded-lg flex items-center justify-center shadow-lg shadow-monad-primary/20">
                <span className="font-bold text-lg">M</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Monad ZK-PriceGuard
            </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab(Tab.DASHBOARD)}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === Tab.DASHBOARD ? 'bg-monad-secondary text-monad-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}
            >
                <LayoutDashboard size={16} /> Dashboard
            </button>
            <button 
                onClick={() => setActiveTab(Tab.CODE)}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === Tab.CODE ? 'bg-monad-secondary text-monad-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}
            >
                <Code size={16} /> Code Artifacts
            </button>
            <button 
                onClick={() => setActiveTab(Tab.BENCHMARK)}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === Tab.BENCHMARK ? 'bg-monad-secondary text-monad-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}
            >
                <BarChart3 size={16} /> Benchmark
            </button>
        </nav>
        
        <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Github size={20} />
        </a>
      </header>

      {/* Mobile Nav (Simple) */}
      <div className="md:hidden flex justify-around border-b border-white/5 p-2 bg-[#0F0E17]">
            <button onClick={() => setActiveTab(Tab.DASHBOARD)} className={`p-2 ${activeTab === Tab.DASHBOARD ? 'text-monad-primary' : 'text-gray-500'}`}><LayoutDashboard size={20} /></button>
            <button onClick={() => setActiveTab(Tab.CODE)} className={`p-2 ${activeTab === Tab.CODE ? 'text-monad-primary' : 'text-gray-500'}`}><Code size={20} /></button>
            <button onClick={() => setActiveTab(Tab.BENCHMARK)} className={`p-2 ${activeTab === Tab.BENCHMARK ? 'text-monad-primary' : 'text-gray-500'}`}><BarChart3 size={20} /></button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-hidden h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto h-full">
            {activeTab === Tab.DASHBOARD && <Dashboard />}
            {activeTab === Tab.CODE && <CodeViewer />}
            {activeTab === Tab.BENCHMARK && <BenchmarkChart />}
        </div>
      </main>

    </div>
  );
}

export default App;