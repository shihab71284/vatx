import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator, 
  Receipt, 
  TrendingUp, 
  History, 
  FileText, 
  Settings, 
  ChevronRight, 
  Plus, 
  Download, 
  PieChart as PieChartIcon,
  BarChart3,
  Percent,
  DollarSign,
  Briefcase,
  User,
  Building2,
  ArrowRightLeft,
  ShieldCheck,
  Ship,
  Search,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Send,
  Bot,
  MessageSquare,
  Trash2,
  Printer,
  Copy,
  Save,
  Pencil,
  Layout,
  ClipboardCheck,
  Truck,
  Anchor,
  UserPlus,
  Users,
  Bell,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Coins,
  Cpu,
  Fingerprint,
  Ticket,
  Shield,
  FileSearch,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Toggle({ label, checked, onChange, description, compact }: { 
  label: string, 
  checked: boolean, 
  onChange: (val: boolean) => void, 
  description?: string,
  compact?: boolean
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", !compact && "p-4 bg-zinc-50 rounded-2xl border border-zinc-100")}>
      <div className="space-y-0.5">
        <p className={cn("font-bold text-zinc-900", compact ? "text-xs" : "text-sm")}>{label}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
          checked ? "bg-brand-600" : "bg-zinc-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function SectionGuide({ title, steps }: { title: string, steps: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-black text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-all"
      >
        <Bot size={16} /> {isOpen ? 'গাইড বন্ধ করুন' : 'কিভাবে ব্যবহার করবেন? (গাইড)'}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 bg-brand-50 rounded-3xl border border-brand-100 space-y-4">
              <h4 className="font-bold text-brand-900 flex items-center gap-2">
                <Sparkles size={18} /> {title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-brand-800 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Tab = 'dashboard' | 'vat' | 'tax' | 'tariff' | 'manifest' | 'reports' | 'blog' | 'tools' | 'ai' | 'invoice' | 'history' | 'notices' | 'rebate' | 'hscode' | 'subscription' | 'crypto-tax' | 'blockchain-verify' | 'tokenized-cert';

interface TaxNotice {
  id: number;
  title: string;
  link: string;
  category: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [vatHistory, setVatHistory] = useState<any[]>([]);
  const [taxHistory, setTaxHistory] = useState<any[]>([]);
  const [notices, setNotices] = useState<TaxNotice[]>([]);
  const [showNoticesDropdown, setShowNoticesDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchNotices();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      setNotices(data);
    } catch (err) {
      console.error('Failed to fetch notices', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const [vatRes, taxRes] = await Promise.all([
        fetch('/api/history/vat'),
        fetch('/api/history/tax')
      ]);
      const vatData = await vatRes.json();
      const taxData = await taxRes.json();
      setVatHistory(vatData);
      setTaxHistory(taxData);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-zinc-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-zinc-100 z-50 hidden md:flex flex-col">
        <div className="p-8 flex items-center gap-3">
          <div className="w-11 h-11 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-200 rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight font-display">VATX.BD</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Compliance</span>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="pb-4">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Main Menu</p>
            <NavItem 
              icon={<BarChart3 size={18} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <NavItem 
              icon={<Receipt size={18} />} 
              label="VAT Calculator" 
              active={activeTab === 'vat'} 
              onClick={() => setActiveTab('vat')} 
            />
            <NavItem 
              icon={<Calculator size={18} />} 
              label="Tax Calculator" 
              active={activeTab === 'tax'} 
              onClick={() => setActiveTab('tax')} 
            />
          </div>

          <div className="py-4 border-t border-zinc-50">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Business Tools</p>
            <NavItem 
              icon={<Ship size={18} />} 
              label="Tariff Calculator" 
              active={activeTab === 'tariff'} 
              onClick={() => setActiveTab('tariff')} 
            />
            <NavItem 
              icon={<ClipboardCheck size={18} />} 
              label="Manifest & Cargo" 
              active={activeTab === 'manifest'} 
              onClick={() => setActiveTab('manifest')} 
            />
            <NavItem 
              icon={<Receipt size={18} />} 
              label="Invoice Generator" 
              active={activeTab === 'invoice'} 
              onClick={() => setActiveTab('invoice')} 
            />
          </div>

          <div className="py-4 border-t border-zinc-50">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Intelligence</p>
            <NavItem 
              icon={<Sparkles size={18} />} 
              label="AI Tax Advisor" 
              active={activeTab === 'ai'} 
              onClick={() => setActiveTab('ai')} 
            />
            <NavItem 
              icon={<TrendingUp size={18} />} 
              label="Tax Rebate Planner" 
              active={activeTab === 'rebate'} 
              onClick={() => setActiveTab('rebate')} 
            />
            <NavItem 
              icon={<Search size={18} />} 
              label="HS Code Finder" 
              active={activeTab === 'hscode'} 
              onClick={() => setActiveTab('hscode')} 
            />
          </div>

          <div className="py-4 border-t border-zinc-50">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Resources</p>
            <NavItem 
              icon={<FileText size={18} />} 
              label="Tax Blog" 
              active={activeTab === 'blog'} 
              onClick={() => setActiveTab('blog')} 
            />
            <NavItem 
              icon={<Bell size={18} />} 
              label="Tax Notices" 
              active={activeTab === 'notices'} 
              onClick={() => setActiveTab('notices')} 
            />
            <NavItem 
              icon={<History size={18} />} 
              label="History" 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
            />
          </div>

          <div className="py-4 border-t border-zinc-50">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Web3 & Blockchain</p>
            <NavItem 
              icon={<Coins size={18} />} 
              label="Crypto Tax Advisory" 
              active={activeTab === 'crypto-tax'} 
              onClick={() => setActiveTab('crypto-tax')} 
            />
            <NavItem 
              icon={<Fingerprint size={18} />} 
              label="Blockchain Verify" 
              active={activeTab === 'blockchain-verify'} 
              onClick={() => setActiveTab('blockchain-verify')} 
            />
            <NavItem 
              icon={<Ticket size={18} />} 
              label="Compliance NFTs" 
              active={activeTab === 'tokenized-cert'} 
              onClick={() => setActiveTab('tokenized-cert')} 
            />
          </div>
        </nav>

        <div className="p-8">
          <button 
            onClick={() => setActiveTab('subscription')}
            className={cn(
              "w-full p-4 rounded-2xl flex flex-col gap-3 transition-all duration-300 group",
              activeTab === 'subscription' ? "bg-zinc-900 text-white" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-900"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <ShieldCheck size={20} className={activeTab === 'subscription' ? "text-brand-400" : "text-zinc-400"} />
              <div className="px-2 py-0.5 bg-brand-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-full">Pro</div>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold">Manage Plan</p>
              <p className={cn("text-[10px]", activeTab === 'subscription' ? "text-zinc-400" : "text-zinc-500")}>Upgrade for AI features</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-72 p-8 lg:p-12 min-h-screen">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Compliance Platform</span>
              <div className="w-1 h-1 rounded-full bg-zinc-300" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">v2.4.0</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight font-display capitalize">{activeTab}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all text-sm shadow-sm"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <AnimatePresence>
                {showSearchResults && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSearchResults(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-[#F3F4F6] bg-[#F9FAFB]">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Search Results</p>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {searchResults.length > 0 ? (
                          searchResults.map((result, idx) => (
                            <button
                              key={`${result.type}-${result.id}-${idx}`}
                              onClick={() => {
                                if (result.type === 'notice') {
                                  window.open(result.link, '_blank');
                                } else {
                                  setActiveTab(result.type as Tab);
                                }
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-4 hover:bg-gray-50 transition-all border-b border-[#F3F4F6] last:border-0 flex items-center gap-3"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                result.type === 'blog' && "bg-blue-50 text-blue-600",
                                result.type === 'client' && "bg-purple-50 text-purple-600",
                                result.type === 'notice' && "bg-emerald-50 text-emerald-600",
                                result.type === 'invoice' && "bg-amber-50 text-amber-600"
                              )}>
                                {result.type === 'blog' && <FileText size={16} />}
                                {result.type === 'client' && <Users size={16} />}
                                {result.type === 'notice' && <Bell size={16} />}
                                {result.type === 'invoice' && <Receipt size={16} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#111827] line-clamp-1">{result.title}</p>
                                <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">{result.type}</p>
                              </div>
                              <ChevronRight size={14} className="ml-auto text-[#D1D5DB]" />
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-sm text-[#6B7280] italic">No results found for "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNoticesDropdown(!showNoticesDropdown)}
                className="p-2 text-[#6B7280] hover:bg-white hover:shadow-sm rounded-lg transition-all relative"
              >
                <Bell size={20} />
                {notices.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8F9FA]" />
                )}
              </button>
              
              <AnimatePresence>
                {showNoticesDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] z-[60] overflow-hidden"
                  >
                    <div className="p-4 border-bottom border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
                      <h4 className="font-bold text-sm">Latest Tax Notices</h4>
                      <button onClick={() => setActiveTab('notices')} className="text-xs text-[#10B981] font-bold hover:underline">View All</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notices.length > 0 ? (
                        notices.slice(0, 5).map((notice) => (
                          <a 
                            key={notice.id} 
                            href={notice.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-4 hover:bg-gray-50 transition-all border-b border-[#F3F4F6] last:border-0"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full uppercase">{notice.category}</span>
                              <span className="text-[10px] text-[#9CA3AF]">{new Date(notice.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-medium text-[#374151] line-clamp-2">{notice.title}</p>
                          </a>
                        ))
                      ) : (
                        <div className="p-8 text-center text-[#6B7280] text-sm italic">No new notices</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="p-2 text-[#6B7280] hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <Settings size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white font-bold">
              S
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard vatHistory={vatHistory} taxHistory={taxHistory} />}
            {activeTab === 'vat' && <VATCalculator onComplete={fetchHistory} />}
            {activeTab === 'tax' && <TaxCalculator onComplete={fetchHistory} />}
            {activeTab === 'tariff' && <TariffCalculator />}
            {activeTab === 'rebate' && <TaxRebatePlanner />}
            {activeTab === 'hscode' && <HSCodeFinder />}
            {activeTab === 'manifest' && <ManifestView />}
            {activeTab === 'reports' && <ReportsView vatHistory={vatHistory} taxHistory={taxHistory} />}
            {activeTab === 'ai' && <AIAssistant />}
            {activeTab === 'invoice' && <InvoiceGenerator />}
            {activeTab === 'blog' && <BlogView />}
            {activeTab === 'tools' && <ToolsView setActiveTab={setActiveTab} />}
            {activeTab === 'history' && <HistoryView vatHistory={vatHistory} taxHistory={taxHistory} />}
            {activeTab === 'notices' && <NoticesView notices={notices} onRefresh={fetchNotices} />}
            {activeTab === 'subscription' && <SubscriptionView />}
            {activeTab === 'crypto-tax' && <CryptoTaxAdvisory />}
            {activeTab === 'blockchain-verify' && <BlockchainVerification />}
            {activeTab === 'tokenized-cert' && <TokenizedCertificates />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        active 
          ? "bg-brand-50 text-brand-700 shadow-sm" 
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      <span className={cn(
        "transition-colors duration-200",
        active ? "text-brand-600" : "text-zinc-400 group-hover:text-zinc-600"
      )}>
        {icon}
      </span>
      {label}
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full"
        />
      )}
    </button>
  );
}

function Dashboard({ vatHistory, taxHistory }: { vatHistory: any[], taxHistory: any[] }) {
  const totalVat = vatHistory.reduce((sum, r) => sum + r.vatAmount, 0);
  const totalTax = taxHistory.reduce((sum, r) => sum + r.totalTaxLiability, 0);

  return (
    <div className="space-y-10">
      <SectionGuide 
        title="ড্যাশবোর্ড ব্যবহার নির্দেশিকা"
        steps={[
          "আপনার ব্যবসার মোট ভ্যাট এবং ট্যাক্স পেমেন্টের সারাংশ এক নজরে দেখুন।",
          "সাম্প্রতিক লেনদেন এবং ক্যালকুলেশন হিস্ট্রি চেক করুন।",
          "আপনার সাবস্ক্রিপশন স্ট্যাটাস এবং প্রো ফিচারের অ্যাক্সেস নিশ্চিত করুন।",
          "চার্ট এবং গ্রাফের মাধ্যমে আপনার ট্যাক্স কমপ্লায়েন্সের ট্রেন্ড বিশ্লেষণ করুন।"
        ]}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Receipt size={22} />} 
          label="Total VAT Liability" 
          value={`৳${totalVat.toLocaleString()}`} 
          trend="+12.5%" 
          color="bg-brand-500" 
        />
        <StatCard 
          icon={<Calculator size={22} />} 
          label="Total Income Tax" 
          value={`৳${totalTax.toLocaleString()}`} 
          trend="+5.2%" 
          color="bg-zinc-900" 
        />
        <StatCard 
          icon={<TrendingUp size={22} />} 
          label="Compliance Score" 
          value="98%" 
          trend="Perfect" 
          color="bg-brand-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neo-card p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold font-display mb-8 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-500" />
            Liability Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={[
                    { name: 'VAT', value: totalVat },
                    { name: 'Income Tax', value: totalTax },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#18181b" />
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">VAT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-900" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Income Tax</span>
            </div>
          </div>
        </div>

        <div className="neo-card p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold font-display mb-8 flex items-center gap-2">
            <History size={20} className="text-brand-500" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[...vatHistory, ...taxHistory]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl group hover:bg-white hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      item.vatAmount !== undefined ? "bg-brand-50 text-brand-600" : "bg-zinc-100 text-zinc-900"
                    )}>
                      {item.vatAmount !== undefined ? <Receipt size={18} /> : <Calculator size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-900">{item.vatAmount !== undefined ? 'VAT Calculation' : 'Tax Calculation'}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-zinc-900">৳{(item.vatAmount || item.totalTaxLiability).toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string, trend: string, color: string }) {
  return (
    <div className="neo-card p-8 rounded-[2.5rem] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      <div className="flex justify-between items-start relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:rotate-12", color)}>
          {icon}
        </div>
        <span className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
          trend.startsWith('+') ? "bg-brand-50 text-brand-600" : "bg-zinc-100 text-zinc-600"
        )}>
          {trend}
        </span>
      </div>
      <div className="mt-6 relative z-10">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-bold font-display tracking-tight text-zinc-900">{value}</h4>
      </div>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-zinc-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
}

function VATCalculator({ onComplete }: { onComplete: () => void }) {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('15');
  const [includeVAT, setIncludeVAT] = useState(false);
  const [isExport, setIsExport] = useState(false);
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [otherCharges, setOtherCharges] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vat/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          rate: parseFloat(rate),
          includeVAT,
          isExport,
          isReverseCharge,
          otherCharges: parseFloat(otherCharges) || 0
        })
      });
      const data = await res.json();
      setResult(data);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveCalculation = async () => {
    if (!result || !label.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/history/vat/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      onComplete();
      setLabel('');
      alert('Calculation saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionGuide 
        title="ভ্যাট ক্যালকুলেটর গাইড"
        steps={[
          "পণ্যের নিট মূল্য (Net Amount) লিখুন।",
          "প্রযোজ্য ভ্যাট রেট (৫%, ৭.৫%, ১৫%, ২০%) নির্বাচন করুন।",
          "যদি দামের মধ্যে ভ্যাট অন্তর্ভুক্ত থাকে তবে 'Amount includes VAT' অপশনটি চালু করুন।",
          "এক্সপোর্ট বা রিভার্স চার্জ প্রযোজ্য হলে সংশ্লিষ্ট টগলটি অন করুন।",
          "অন্যান্য খরচ (শিপিং বা সার্ভিস চার্জ) থাকলে তা যোগ করুন।",
          "'Calculate VAT' বাটনে ক্লিক করে ফলাফল দেখুন এবং রেফারেন্স হিসেবে সেভ করুন।"
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neo-card p-10 rounded-[2.5rem] space-y-8">
        <div>
          <h3 className="text-2xl font-bold font-display mb-2">Input Details</h3>
          <p className="text-sm text-zinc-500">Enter your transaction values below</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Base Amount (৳)</label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">VAT Rate (%)</label>
            <div className="grid grid-cols-4 gap-3">
              {['5', '7.5', '15', '20'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRate(r)}
                  className={cn(
                    "py-3 rounded-xl font-bold transition-all border text-xs",
                    rate === r 
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-200" 
                      : "bg-white text-zinc-500 border-zinc-100 hover:border-brand-500 hover:text-brand-600"
                  )}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Toggle 
              label="Amount includes VAT" 
              checked={includeVAT} 
              onChange={setIncludeVAT} 
              description="Calculate VAT from total price"
            />
            <div className="grid grid-cols-2 gap-4">
              <Toggle 
                label="Export" 
                checked={isExport} 
                onChange={setIsExport} 
                compact
              />
              <Toggle 
                label="Reverse" 
                checked={isReverseCharge} 
                onChange={setIsReverseCharge} 
                compact
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#374151] mb-2">Other Charges (Shipping, Service, etc.)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">৳</div>
              <input 
                type="number" 
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <button 
            onClick={calculate}
            disabled={!amount || loading}
            className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calculator size={20} />}
            Calculate VAT
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-card p-10 rounded-[2.5rem] bg-zinc-900 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold font-display">Calculation Result</h3>
                  <div className="px-3 py-1 bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Verified</div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                    <span className="text-zinc-400 text-sm">Net Amount</span>
                    <span className="text-xl font-bold">৳{result.netAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                    <span className="text-zinc-400 text-sm">VAT Amount ({result.rate}%)</span>
                    <span className="text-xl font-bold text-brand-400">৳{result.vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Total Amount</span>
                    <span className="text-4xl font-bold font-display">৳{result.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-zinc-800 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Save as Reference</label>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Office Supplies"
                        className="flex-1 px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium transition-all text-sm"
                      />
                      <button 
                        onClick={saveCalculation}
                        disabled={saving || !label.trim()}
                        className="btn-primary bg-brand-500 hover:bg-brand-600 px-8"
                      >
                        {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="neo-card p-10 rounded-[2.5rem] border-dashed border-2 border-zinc-200 flex flex-col items-center justify-center text-center py-32 bg-zinc-50/30">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300 mb-6">
                <Receipt size={40} />
              </div>
              <h3 className="text-xl font-bold text-zinc-400">No Calculation Yet</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-[200px]">Enter transaction details to see the breakdown</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}

function ResultRow({ label, value, highlight, large }: { label: string, value: number, highlight?: boolean, large?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn("text-sm", highlight ? "text-emerald-400 font-bold" : "text-gray-400")}>{label}</span>
      <span className={cn("font-mono", large ? "text-3xl font-bold" : "text-xl font-medium")}>
        ৳{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

function TaxCalculator({ onComplete }: { onComplete: () => void }) {
  const [income, setIncome] = useState('');
  const [entityType, setEntityType] = useState<'individual' | 'corporate'>('individual');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tax/income/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalIncome: parseFloat(income),
          entityType
        })
      });
      const data = await res.json();
      setResult(data);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveCalculation = async () => {
    if (!result || !label.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/history/tax/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      onComplete();
      setLabel('');
      alert('Calculation saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionGuide 
        title="ট্যাক্স ক্যালকুলেটর গাইড"
        steps={[
          "আপনার বার্ষিক আয়ের তথ্য (Salary, Business, etc.) লিখুন।",
          "আপনার বিনিয়োগ এবং খরচের তথ্য দিন যা ট্যাক্স রেয়াত পেতে সাহায্য করবে।",
          "'Calculate Tax' বাটনে ক্লিক করে আপনার মোট ট্যাক্স লায়াবিলিটি দেখুন।",
          "ফলাফলটি সেভ করে রাখুন ভবিষ্যতের রেফারেন্সের জন্য।"
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="neo-card p-10 rounded-[2.5rem] space-y-8">
        <div>
          <h3 className="text-2xl font-bold font-display mb-2">Tax Parameters</h3>
          <p className="text-sm text-zinc-500">Configure your income profile</p>
        </div>

        <div className="space-y-6">
          <div className="flex p-1.5 bg-zinc-100 rounded-2xl">
            <button 
              onClick={() => setEntityType('individual')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm",
                entityType === 'individual' ? "bg-white shadow-sm text-brand-600" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <User size={18} /> Individual
            </button>
            <button 
              onClick={() => setEntityType('corporate')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm",
                entityType === 'corporate' ? "bg-white shadow-sm text-blue-600" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Building2 size={18} /> Corporate
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Annual Gross Income (৳)</label>
            <input 
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0.00"
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none font-medium transition-all"
            />
          </div>

          <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100 flex gap-4">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-900">Tax Year 2024-25</p>
              <p className="text-xs text-brand-700/70 mt-1 leading-relaxed">Calculations follow the latest NBR directives for the current financial year.</p>
            </div>
          </div>

          <button 
            onClick={calculate}
            disabled={!income || loading}
            className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calculator size={20} />}
            Calculate Tax
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-card p-10 rounded-[2.5rem] bg-zinc-900 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold font-display">Tax Liability</h3>
                  <div className="px-3 py-1 bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">FY 2024-25</div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                    <span className="text-zinc-400 text-sm">Taxable Income</span>
                    <span className="text-xl font-bold">৳{result.taxableIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                    <span className="text-zinc-400 text-sm">Effective Rate</span>
                    <span className="text-xl font-bold text-brand-400">{result.effectiveRate}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Total Payable</span>
                    <span className="text-4xl font-bold font-display">৳{result.totalTaxLiability.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-zinc-800 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Save as Reference</label>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. FY 2024 Final"
                        className="flex-1 px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium transition-all text-sm"
                      />
                      <button 
                        onClick={saveCalculation}
                        disabled={saving || !label.trim()}
                        className="btn-primary bg-brand-500 hover:bg-brand-600 px-8"
                      >
                        {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider font-medium">
                    * Estimate based on standard progressive slabs. Actual liability may vary based on investments and exemptions.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="neo-card p-10 rounded-[2.5rem] border-dashed border-2 border-zinc-200 flex flex-col items-center justify-center text-center py-32 bg-zinc-50/30">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300 mb-6">
                <Calculator size={40} />
              </div>
              <h3 className="text-xl font-bold text-zinc-400">No Calculation Yet</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-[200px]">Enter your annual income to see your tax liability</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}

function HistoryView({ vatHistory, taxHistory }: { vatHistory: any[], taxHistory: any[] }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#F3F4F6] overflow-hidden">
      <div className="p-8 border-b border-[#F3F4F6] flex justify-between items-center">
        <h3 className="text-xl font-bold">Calculation History</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-bold hover:bg-white transition-all">
            Filter
          </button>
          <button className="px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-bold hover:bg-white transition-all">
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F9FAFB] text-[#6B7280] text-xs font-bold uppercase tracking-wider">
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4">Label</th>
              <th className="px-8 py-4">Type</th>
              <th className="px-8 py-4">Base Amount</th>
              <th className="px-8 py-4">Liability</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {[...vatHistory, ...taxHistory]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((item, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-8 py-5 text-sm font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-[#111827]">
                    {item.label || <span className="text-[#9CA3AF] font-normal italic">Untitled</span>}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.vatAmount !== undefined ? "bg-emerald-500" : "bg-blue-500"
                      )} />
                      <span className="text-sm font-bold">{item.vatAmount !== undefined ? 'VAT' : 'Income Tax'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-mono text-[#6B7280]">
                    ৳{(item.baseAmount || item.totalIncome).toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold">
                    ৳{(item.vatAmount || item.totalTaxLiability).toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                      Calculated
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-[#6B7280] hover:text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TariffCalculator() {
  const [csvUrl, setCsvUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vTrBZSeQ-YGYBGz66IrcqooOmJ9ErQdDRj3iYqbgRw4hNRvjurOctn7lC83w4LCRtKQdhxsoXhYSEWf/pub?gid=2081232822&single=true&output=csv');
  const [tariffData, setTariffData] = useState<any[]>([]);
  const [status, setStatus] = useState<{ msg: string; type: 'info' | 'error' | 'success' | null }>({ msg: '', type: null });
  const [searchInput, setSearchInput] = useState('');
  const [assessableValue, setAssessableValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTariffData = async () => {
    if (!csvUrl.trim()) {
      setStatus({ msg: "Please enter a valid CSV URL.", type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Loading tariff data...", type: 'info' });
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Failed to load CSV. Ensure the link is public.");
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);
      setTariffData(parsedData);
      setStatus({ msg: `Loaded ${parsedData.length} tariff entries successfully!`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatus({ msg: "Error: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: any[] = [];

    const hsIndex = headers.indexOf('hs') !== -1 ? headers.indexOf('hs') :
                    headers.indexOf('hscode') !== -1 ? headers.indexOf('hscode') : -1;
    const descIndex = headers.findIndex(h => h.includes('desc') || h.includes('tarriff'));
    const cdIndex = headers.indexOf('cd');
    const sdIndex = headers.indexOf('sd');
    const vatIndex = headers.indexOf('vat');
    const aitIndex = headers.indexOf('ait');
    const rdIndex = headers.indexOf('rd');
    const atIndex = headers.indexOf('at');

    if (hsIndex === -1 || descIndex === -1) {
      throw new Error("CSV must contain 'hs' and 'desc' columns.");
    }

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      if (row.length < Math.max(hsIndex, descIndex, cdIndex, sdIndex, vatIndex, aitIndex, rdIndex, atIndex) + 1) continue;

      const hs = (row[hsIndex] || '').replace(/"/g, '').trim();
      const desc = (row[descIndex] || '').replace(/"/g, '').trim();
      if (!hs || !desc) continue;

      data.push({
        hs,
        desc,
        cd: parseFloat(row[cdIndex]?.trim()) || 0,
        sd: parseFloat(row[sdIndex]?.trim()) || 0,
        vat: parseFloat(row[vatIndex]?.trim()) || 0,
        ait: parseFloat(row[aitIndex]?.trim()) || 0,
        rd: parseFloat(row[rdIndex]?.trim()) || 0,
        at: parseFloat(row[atIndex]?.trim()) || 0
      });
    }
    return data;
  };

  const calculate = () => {
    const input = searchInput.trim().toLowerCase();
    const av = parseFloat(assessableValue);

    if (!input) {
      alert("Please enter HS Code or Tariff Description.");
      return;
    }
    if (isNaN(av) || av <= 0) {
      alert("Please enter a valid Assessable Value.");
      return;
    }

    let item = null;
    const cleanInput = input.replace(/\s/g, '');

    if (/^\d+$/.test(cleanInput)) {
      item = tariffData.find(d => d.hs.replace(/\s/g, '') === cleanInput);
    }

    if (!item) {
      item = tariffData.find(d =>
        d.desc.toLowerCase().includes(input) ||
        input.includes(d.hs.toLowerCase())
      );
    }

    if (!item) {
      setResult({ error: "No matching tariff found." });
      return;
    }

    const cdRate = item.cd || 0;
    const sdVal = item.sd || 0;
    const vatRate = item.vat || 0;
    const aitRate = item.ait || 0;
    const rdRate = item.rd || 0;
    const atRate = item.at || 0;

    const cdAmount = (cdRate / 100) * av;
    const sdAmount = (sdVal > 100) ? sdVal : (sdVal / 100) * av;
    const customsValue = av + cdAmount + sdAmount;
    const vatAmount = (vatRate / 100) * customsValue;
    const aitAmount = (aitRate / 100) * customsValue;
    const rdAmount = (rdRate / 100) * customsValue;
    const atAmount = (atRate / 100) * customsValue;

    const totalTax = cdAmount + sdAmount + vatAmount + aitAmount + rdAmount + atAmount;
    const totalPayable = av + totalTax;

    setResult({
      ...item,
      cdAmount,
      sdAmount,
      vatAmount,
      aitAmount,
      rdAmount,
      atAmount,
      totalTax,
      totalPayable,
      av
    });
  };

  return (
    <div className="space-y-8">
      <SectionGuide 
        title="ট্যারিফ ক্যালকুলেটর গাইড"
        steps={[
          "পণ্যের এইচএস কোড (HS Code) লিখুন।",
          "পণ্যের মূল্য এবং কারেন্সি নির্বাচন করুন।",
          "সিস্টেম স্বয়ংক্রিয়ভাবে সিডি (CD), আরডি (RD), এসডি (SD), ভ্যাট (VAT) ইত্যাদি হিসাব করবে।",
          "আমদানির ক্ষেত্রে মোট শুল্কের পরিমাণ এক নজরে দেখে নিন।"
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-6">
        <h3 className="text-xl font-bold mb-4">Tariff Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-2">CSV Data Source URL</label>
            <div className="flex gap-2">
              <input 
                type="url" 
                value={csvUrl}
                onChange={(e) => setCsvUrl(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none text-sm"
                placeholder="Enter Google Sheets CSV URL"
              />
              <button 
                onClick={loadTariffData}
                disabled={loading}
                className="px-6 py-3 bg-[#10B981] text-white rounded-2xl font-bold text-sm hover:bg-[#059669] transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load'}
              </button>
            </div>
          </div>

          {status.msg && (
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3 text-sm font-medium",
              status.type === 'error' ? "bg-red-50 text-red-600 border border-red-100" : 
              status.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
              "bg-blue-50 text-blue-600 border border-blue-100"
            )}>
              {status.type === 'error' ? <AlertCircle size={18} /> : 
               status.type === 'success' ? <CheckCircle2 size={18} /> : <FileText size={18} />}
              {status.msg}
            </div>
          )}

          <div className="h-px bg-[#F3F4F6] my-6" />

          <div>
            <label className="block text-sm font-bold text-[#374151] mb-2">Search HS Code or Description</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={tariffData.length === 0}
                className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none font-medium disabled:opacity-50"
                placeholder="e.g., 48119021 or Paper"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#374151] mb-2">Assessable Value (BDT)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">৳</div>
              <input 
                type="number" 
                value={assessableValue}
                onChange={(e) => setAssessableValue(e.target.value)}
                disabled={tariffData.length === 0}
                className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none font-medium disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
          </div>

          <button 
            onClick={calculate}
            disabled={tariffData.length === 0 || !searchInput || !assessableValue}
            className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-[#059669] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Calculator size={20} /> Calculate Duties
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {result ? (
          result.error ? (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h4 className="font-bold text-red-900">No Match Found</h4>
              <p className="text-sm text-red-700 mt-2">We couldn't find a tariff entry matching your search.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111827] text-white p-8 rounded-3xl shadow-xl space-y-6"
            >
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-1">HS Code: {result.hs}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{result.desc}</p>
              </div>

              <div className="space-y-3">
                <TariffRow label={`CD (${result.cd}%)`} value={result.cdAmount} />
                <TariffRow label={`SD (${result.sd > 100 ? 'Fixed' : result.sd + '%'})`} value={result.sdAmount} />
                <TariffRow label={`VAT (${result.vat}%)`} value={result.vatAmount} />
                <TariffRow label={`AIT (${result.ait}%)`} value={result.aitAmount} />
                <TariffRow label={`RD (${result.rd}%)`} value={result.rdAmount} />
                <TariffRow label={`AT (${result.at}%)`} value={result.atAmount} />
                
                <div className="h-px bg-white/10 my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-400 font-bold">Total Duties</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">৳{result.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Payable</span>
                  <span className="text-xl font-medium font-mono">৳{result.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-sm">
                  <Download size={16} /> Export
                </button>
                <button className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-all text-sm">
                  <Plus size={16} /> Save Record
                </button>
              </div>
            </motion.div>
          )
        ) : (
          <div className="h-full bg-white border-2 border-dashed border-[#E5E7EB] rounded-3xl flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
              <Ship size={32} />
            </div>
            <h4 className="font-bold text-[#374151]">Ready to Calculate</h4>
            <p className="text-sm text-[#6B7280] mt-2 max-w-[200px]">Load tariff data and enter HS code to see duty breakdown.</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

function TariffRow({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-mono">৳{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  );
}

function BlogView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Tax News' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        setNewPost({ title: '', content: '', category: 'Tax News' });
        setShowForm(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Tax & VAT Information Blog</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-[#10B981] text-white rounded-2xl font-bold shadow-lg hover:bg-[#059669] transition-all flex items-center gap-2"
        >
          <Plus size={20} /> {showForm ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6]"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#374151] mb-2">Title</label>
              <input 
                type="text" 
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#374151] mb-2">Category</label>
              <select 
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none"
              >
                <option>Tax News</option>
                <option>VAT Updates</option>
                <option>Compliance Tips</option>
                <option>Regulatory Changes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#374151] mb-2">Content</label>
              <textarea 
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none min-h-[150px]"
                required
              />
            </div>
            <button type="submit" className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-bold shadow-lg hover:bg-[#059669] transition-all">
              Publish Post
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            layout
            className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase">
                {post.category}
              </span>
              <span className="text-xs text-[#6B7280]">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h4 className="text-xl font-bold mb-4">{post.title}</h4>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6 line-clamp-3">
              {post.content}
            </p>
            <div className="flex items-center justify-between pt-6 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#10B981]">
                  {post.author[0]}
                </div>
                <span className="text-xs font-bold text-[#374151]">{post.author}</span>
              </div>
              <button className="text-[#10B981] text-sm font-bold flex items-center gap-1 hover:underline">
                Read More <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ToolsView({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold">Additional Compliance Tools</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard 
          icon={<ArrowRightLeft size={24} />}
          title="Currency Converter"
          description="Real-time exchange rates for international transactions."
          color="emerald"
        />
        <ToolCard 
          icon={<FileText size={24} />}
          title="Tax Calendar"
          description="Never miss a deadline with our automated tax alerts."
          color="blue"
        />
        <ToolCard 
          icon={<Building2 size={24} />}
          title="Company Search"
          description="Verify BIN and TIN numbers of business partners."
          color="purple"
        />
        <ToolCard 
          icon={<ShieldCheck size={24} />}
          title="Audit Assistant"
          description="Prepare for tax audits with our automated checklist."
          color="orange"
        />
        <ToolCard 
          icon={<Receipt size={24} />}
          title="Invoice Generator"
          description="Create VAT-compliant invoices for your customers."
          color="pink"
          onClick={() => setActiveTab('invoice')}
        />
        <ToolCard 
          icon={<TrendingUp size={24} />}
          title="Profit Estimator"
          description="Calculate net profit after all tax deductions."
          color="indigo"
        />
      </div>
    </div>
  );
}

function ToolCard({ icon, title, description, color, onClick }: { icon: React.ReactNode, title: string, description: string, color: string, onClick?: () => void }) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] hover:shadow-md transition-all group cursor-pointer"
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110", colors[color])}>
        {icon}
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#10B981] opacity-0 group-hover:opacity-100 transition-all">
        Launch Tool <ChevronRight size={16} />
      </div>
    </div>
  );
}

function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I'm your AI Tax Advisor. I can help you understand Bangladesh's tax laws, VAT regulations, and customs duties. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are an expert Tax and VAT consultant for Bangladesh. You provide accurate information based on the National Board of Revenue (NBR) regulations. Be professional, concise, and helpful. If you're unsure about a specific legal detail, advise the user to consult a certified tax professional.",
        },
      });

      const aiText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my knowledge base. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <SectionGuide 
        title="এআই ট্যাক্স অ্যাডভাইজার গাইড"
        steps={[
          "ট্যাক্স বা ভ্যাট সংক্রান্ত যেকোনো প্রশ্ন টাইপ করুন।",
          "আমাদের এআই সহকারী আপনাকে এনবিআর (NBR) আইন অনুযায়ী সঠিক তথ্য দেবে।",
          "জটিল হিসাব বা আইনের ব্যাখ্যা সহজভাবে বুঝে নিন।",
          "এটি আপনার ব্যক্তিগত ট্যাক্স কনসালট্যান্ট হিসেবে কাজ করবে।"
        ]}
      />
      <div className="h-[calc(100vh-300px)] flex flex-col bg-white rounded-3xl shadow-sm border border-[#F3F4F6] overflow-hidden">
      <div className="p-6 border-b border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold">AI Tax Advisor</h3>
            <p className="text-xs text-[#6B7280]">Powered by Gemini AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-bold text-[#10B981]">Online</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FA]"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-[80%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
              msg.role === 'ai' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
            )}>
              {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.role === 'ai' ? "bg-white text-[#1A1A1A] border border-[#E5E7EB]" : "bg-[#10B981] text-white"
            )}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] flex gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-[#F3F4F6]">
        <div className="relative flex items-center gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about tax slabs, VAT exemptions, or customs duties..."
            className="flex-1 px-6 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-4 bg-[#10B981] text-white rounded-2xl shadow-lg hover:bg-[#059669] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-[#6B7280] mt-4">
          AI can make mistakes. Consider checking important legal information with the NBR or a professional tax advisor.
        </p>
      </div>
    </div>
  </div>
  );
}

const PRODUCT_CATEGORIES = [
  { name: 'Standard Goods/Services', rate: 15 },
  { name: 'IT Enabled Services', rate: 5 },
  { name: 'Construction Services', rate: 7.5 },
  { name: 'Essential Commodities', rate: 0 },
  { name: 'Export Items', rate: 0 },
  { name: 'Other (Manual)', rate: 15 }
];

function InvoiceGenerator() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editClientForm, setEditClientForm] = useState({ name: '', address: '', bin: '' });
  const [invoice, setInvoice] = useState({
    number: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    recurring: 'none',
    seller: { name: '', address: '', bin: '' },
    buyer: { name: '', address: '', bin: '' },
    items: [{ id: 1, desc: '', category: 'Standard Goods/Services', qty: 1, price: 0, vatRate: 15 }]
  });

  useEffect(() => {
    fetchTemplates();
    fetchClients();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/invoice/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveClient = async () => {
    if (!invoice.buyer.name.trim()) {
      alert("Please enter a client name.");
      return;
    }
    if (!confirm(`Are you sure you want to save "${invoice.buyer.name}" as a new client?`)) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: invoice.buyer.name,
          address: invoice.buyer.address,
          bin: invoice.buyer.bin
        })
      });
      if (res.ok) {
        alert("Client saved successfully!");
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateClient = async () => {
    if (!editClientForm.name.trim()) {
      alert("Please enter a client name.");
      return;
    }
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClientForm)
      });
      if (res.ok) {
        alert("Client updated successfully!");
        setEditingClient(null);
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectClient = (c: any) => {
    setInvoice({
      ...invoice,
      buyer: { name: c.name, address: c.address, bin: c.bin }
    });
  };

  const deleteClient = async (id: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name.");
      return;
    }
    try {
      const res = await fetch('/api/invoice/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          sellerName: invoice.seller.name,
          sellerAddress: invoice.seller.address,
          sellerBin: invoice.seller.bin,
          buyerName: invoice.buyer.name,
          buyerAddress: invoice.buyer.address,
          buyerBin: invoice.buyer.bin,
          items: invoice.items
        })
      });
      if (res.ok) {
        setTemplateName('');
        setShowTemplateModal(false);
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTemplate = (t: any) => {
    setInvoice({
      ...invoice,
      seller: { name: t.sellerName, address: t.sellerAddress, bin: t.sellerBin },
      buyer: { name: t.buyerName, address: t.buyerAddress, bin: t.buyerBin },
      items: t.items.map((item: any, idx: number) => ({ ...item, id: Date.now() + idx }))
    });
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await fetch(`/api/invoice/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: Date.now(), desc: '', category: 'Standard Goods/Services', qty: 1, price: 0, vatRate: 15 }]
    });
  };

  const removeItem = (id: number) => {
    if (invoice.items.length === 1) return;
    setInvoice({
      ...invoice,
      items: invoice.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id: number, field: string, value: any) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'category') {
            const category = PRODUCT_CATEGORIES.find(c => c.name === value);
            if (category && value !== 'Other (Manual)') {
              updatedItem.vatRate = category.rate;
            }
          }
          return updatedItem;
        }
        return item;
      })
    });
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalVat = invoice.items.reduce((sum, item) => sum + (item.qty * item.price * (item.vatRate / 100)), 0);
  const total = subtotal + totalVat;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <SectionGuide 
        title="ইনভয়েস জেনারেটর গাইড"
        steps={[
          "বিক্রেতা (Seller) এবং ক্রেতার (Buyer) তথ্য পূরণ করুন।",
          "ইনভয়েস আইটেমগুলো (Description, Qty, Price) যোগ করুন।",
          "ভ্যাট হার এবং ডিসকাউন্ট প্রযোজ্য হলে তা উল্লেখ করুন।",
          "'Generate Invoice' বাটনে ক্লিক করে প্রফেশনাল পিডিএফ ডাউনলোড বা প্রিন্ট করুন।"
        ]}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h3 className="text-3xl font-bold font-display">Invoice Studio</h3>
          <p className="text-sm text-zinc-500 mt-1">Create VAT-compliant professional invoices</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowTemplateModal(true)}
            className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-2xl font-bold shadow-sm hover:bg-zinc-50 transition-all flex items-center gap-2 text-sm"
          >
            <Layout size={18} className="text-brand-500" /> Templates
          </button>
          <button 
            onClick={() => setShowClientModal(true)}
            className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-2xl font-bold shadow-sm hover:bg-zinc-50 transition-all flex items-center gap-2 text-sm"
          >
            <Users size={18} className="text-blue-500" /> Clients
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-3 btn-primary flex items-center gap-2 text-sm"
          >
            <Printer size={18} /> Print Invoice
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-6">
                  <Layout size={32} />
                </div>
                <h4 className="text-2xl font-bold font-display">Save Template</h4>
                <p className="text-sm text-zinc-500 mt-2">Reuse these business details for future invoices</p>
              </div>
              
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Template Name</label>
                <input 
                  type="text" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Retainer"
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none font-medium transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveTemplate}
                  className="flex-1 py-4 btn-primary text-sm"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showClientModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full space-y-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-2xl font-bold font-display">{editingClient ? 'Edit Client' : 'Client Directory'}</h4>
                  <p className="text-sm text-zinc-500 mt-1">Manage your customer database</p>
                </div>
                <button 
                  onClick={() => { setShowClientModal(false); setEditingClient(null); }} 
                  className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                {editingClient ? (
                  <div className="space-y-6 bg-zinc-50 p-8 rounded-3xl border border-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Client Name</label>
                        <input 
                          type="text"
                          value={editClientForm.name}
                          onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">BIN / TIN</label>
                        <input 
                          type="text"
                          value={editClientForm.bin}
                          onChange={(e) => setEditClientForm({ ...editClientForm, bin: e.target.value })}
                          className="w-full px-5 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Address</label>
                      <textarea 
                        value={editClientForm.address}
                        onChange={(e) => setEditClientForm({ ...editClientForm, address: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setEditingClient(null)}
                        className="flex-1 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-50 transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={updateClient}
                        className="flex-1 py-4 btn-primary text-sm"
                      >
                        Update Client
                      </button>
                    </div>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                    <Users size={48} className="text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No clients saved yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {clients.map(c => (
                      <div key={c.id} className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-400 font-bold text-lg border border-zinc-100">
                            {c.name[0]}
                          </div>
                          <div>
                            <h5 className="font-bold text-zinc-900">{c.name}</h5>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{c.address}</p>
                            {c.bin && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md">BIN: {c.bin}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => { selectClient(c); setShowClientModal(false); }}
                            className="p-2.5 bg-white text-zinc-600 rounded-xl hover:text-brand-600 border border-zinc-100 shadow-sm transition-all"
                            title="Select Client"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => { setEditingClient(c); setEditClientForm({ name: c.name, address: c.address, bin: c.bin }); }}
                            className="p-2.5 bg-white text-zinc-600 rounded-xl hover:text-blue-600 border border-zinc-100 shadow-sm transition-all"
                            title="Edit Client"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => deleteClient(c.id)}
                            className="p-2.5 bg-white text-zinc-600 rounded-xl hover:text-red-600 border border-zinc-100 shadow-sm transition-all"
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {!editingClient && (
                <button 
                  onClick={() => setShowClientModal(false)}
                  className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all text-sm"
                >
                  Close Directory
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-8 print:hidden">
          {templates.length > 0 && (
            <div className="neo-card p-8 rounded-[2rem] space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Layout size={16} className="text-brand-500" />
                Quick Templates
              </div>
              <div className="flex flex-wrap gap-3">
                {templates.map(t => (
                  <div key={t.id} className="group relative">
                    <button 
                      onClick={() => loadTemplate(t)}
                      className="px-5 py-2.5 bg-zinc-50 text-zinc-700 border border-zinc-100 rounded-xl text-xs font-bold hover:bg-white hover:shadow-lg hover:shadow-zinc-200/50 transition-all flex items-center gap-2"
                    >
                      <Copy size={14} className="text-zinc-400" /> {t.name}
                    </button>
                    <button 
                      onClick={() => deleteTemplate(t.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 group-hover:scale-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="neo-card p-10 rounded-[2.5rem] space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoice.number}
                  onChange={(e) => setInvoice({ ...invoice, number: e.target.value })}
                  className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Issue Date</label>
                <input 
                  type="date" 
                  value={invoice.date}
                  onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                  className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Frequency</label>
                <select 
                  value={invoice.recurring}
                  onChange={(e) => setInvoice({ ...invoice, recurring: e.target.value })}
                  className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all appearance-none"
                >
                  <option value="none">One-time Invoice</option>
                  <option value="weekly">Weekly Recurring</option>
                  <option value="monthly">Monthly Recurring</option>
                  <option value="yearly">Yearly Recurring</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-zinc-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                    <Building2 size={16} />
                  </div>
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Seller Details</h4>
                </div>
                <div className="space-y-4">
                  <input 
                    placeholder="Business Name"
                    value={invoice.seller.name}
                    onChange={(e) => setInvoice({ ...invoice, seller: { ...invoice.seller, name: e.target.value }})}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                  />
                  <textarea 
                    placeholder="Business Address"
                    value={invoice.seller.address}
                    onChange={(e) => setInvoice({ ...invoice, seller: { ...invoice.seller, address: e.target.value }})}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all min-h-[100px]"
                  />
                  <input 
                    placeholder="BIN (Business Identification Number)"
                    value={invoice.seller.bin}
                    onChange={(e) => setInvoice({ ...invoice, seller: { ...invoice.seller, bin: e.target.value }})}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <User size={16} />
                    </div>
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Buyer Details</h4>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={saveClient}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                      title="Save this buyer as a client"
                    >
                      <UserPlus size={14} /> Save
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      placeholder="Customer Name"
                      value={invoice.buyer.name}
                      onChange={(e) => setInvoice({ ...invoice, buyer: { ...invoice.buyer, name: e.target.value }})}
                      className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all pr-12"
                    />
                    {clients.length > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <select 
                          onChange={(e) => {
                            const client = clients.find(c => c.id === parseInt(e.target.value));
                            if (client) selectClient(client);
                          }}
                          className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer"
                        >
                          <option value="">Select Client</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="w-8 h-8 bg-white border border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 pointer-events-none">
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    )}
                  </div>
                  <textarea 
                    placeholder="Customer Address"
                    value={invoice.buyer.address}
                    onChange={(e) => setInvoice({ ...invoice, buyer: { ...invoice.buyer, address: e.target.value }})}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all min-h-[100px]"
                  />
                  <input 
                    placeholder="BIN / TIN"
                    value={invoice.buyer.bin}
                    onChange={(e) => setInvoice({ ...invoice, buyer: { ...invoice.buyer, bin: e.target.value }})}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-100" />

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Line Items</h4>
                <button 
                  onClick={addItem}
                  className="text-xs font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {invoice.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-start p-6 bg-zinc-50/50 border border-zinc-100 rounded-3xl group transition-all hover:bg-white hover:shadow-lg hover:shadow-zinc-200/30">
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</label>
                      <input 
                        placeholder="Item name or service"
                        value={item.desc}
                        onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Category</label>
                      <select 
                        value={item.category}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all appearance-none"
                      >
                        {PRODUCT_CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">Qty</label>
                      <input 
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-center focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right block">Price</label>
                      <input 
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-right focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">VAT</label>
                      <select 
                        value={item.vatRate}
                        onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                        className="w-full px-2 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all appearance-none text-center"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={7.5}>7.5%</option>
                        <option value={10}>10%</option>
                        <option value={15}>15%</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-center pt-8">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="w-10 h-10 bg-white text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-zinc-100 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1 print:col-span-3">
          <div className="neo-card p-10 rounded-[2.5rem] bg-white sticky top-8 print:static print:shadow-none print:border-none print:p-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-2xl print:hidden" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-2xl font-black text-brand-600 tracking-tighter font-display">VATX.BD</h2>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-black">Tax Compliance</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold uppercase text-zinc-900 font-display">Invoice</h3>
                  <p className="text-xs text-zinc-500 mt-1">#{invoice.number}</p>
                  <p className="text-xs text-zinc-500">{invoice.date}</p>
                  {invoice.recurring !== 'none' && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-black rounded uppercase tracking-widest">
                      {invoice.recurring}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-3">From</h4>
                  <p className="text-sm font-bold text-zinc-900">{invoice.seller.name || 'Your Business'}</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed whitespace-pre-wrap">{invoice.seller.address || 'Your Address'}</p>
                  {invoice.seller.bin && <p className="text-[10px] text-brand-600 font-black mt-2 uppercase tracking-widest">BIN: {invoice.seller.bin}</p>}
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-3">To</h4>
                  <p className="text-sm font-bold text-zinc-900">{invoice.buyer.name || 'Customer Name'}</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed whitespace-pre-wrap">{invoice.buyer.address || 'Customer Address'}</p>
                  {invoice.buyer.bin && <p className="text-[10px] text-blue-600 font-black mt-2 uppercase tracking-widest">BIN/TIN: {invoice.buyer.bin}</p>}
                </div>
              </div>

              <div className="space-y-4 mb-12">
                <div className="grid grid-cols-12 gap-4 pb-3 border-b border-zinc-100 text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Total</div>
                </div>
                {invoice.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 text-sm items-center">
                    <div className="col-span-6">
                      <p className="font-bold text-zinc-900">{item.desc || 'Item Description'}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">{item.category}</p>
                    </div>
                    <div className="col-span-2 text-center text-zinc-500 font-medium">{item.qty}</div>
                    <div className="col-span-4 text-right font-bold text-zinc-900">৳{(item.qty * item.price).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Subtotal</span>
                  <span className="text-sm font-bold text-zinc-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Total VAT</span>
                  <span className="text-sm font-bold text-brand-600">৳{totalVat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm font-black text-zinc-900 uppercase tracking-widest">Grand Total</span>
                  <span className="text-3xl font-bold text-brand-600 font-display">৳{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-16 pt-12 border-t border-zinc-100 text-center">
                <p className="text-[10px] text-zinc-300 uppercase font-black tracking-[0.3em]">Thank you for your business</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManifestView() {
  const [activeSubTab, setActiveSubTab] = useState<'igm' | 'checklist' | 'declaration'>('igm');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <SectionGuide 
        title="মেনিফেস্ট গাইড"
        steps={[
          "আপনার কার্গো বা শিপিং মেনিফেস্টের তথ্য আপলোড বা এন্ট্রি করুন।",
          "বিল অফ লেডিং (B/L) এবং কন্টেইনার নম্বর ট্র্যাক করুন।",
          "কাস্টমস ক্লিয়ারেন্সের স্ট্যাটাস আপডেট করুন।",
          "আপনার সমস্ত শিপমেন্টের একটি সুশৃঙ্খল তালিকা বজায় রাখুন।"
        ]}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold">Manifest & Cargo Declaration</h3>
          <p className="text-sm text-[#6B7280]">Compliance tools for Bangladesh Customs (Asycuda World)</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-[#F3F4F6] shadow-sm">
          <button 
            onClick={() => setActiveSubTab('igm')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeSubTab === 'igm' ? "bg-[#10B981] text-white shadow-md" : "text-[#6B7280] hover:bg-gray-50"
            )}
          >
            IGM/EGM Guide
          </button>
          <button 
            onClick={() => setActiveSubTab('checklist')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeSubTab === 'checklist' ? "bg-[#10B981] text-white shadow-md" : "text-[#6B7280] hover:bg-gray-50"
            )}
          >
            Checklist
          </button>
          <button 
            onClick={() => setActiveSubTab('declaration')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all",
              activeSubTab === 'declaration' ? "bg-[#10B981] text-white shadow-md" : "text-[#6B7280] hover:bg-gray-50"
            )}
          >
            Cargo Declaration
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'igm' && (
          <motion.div 
            key="igm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Anchor size={20} />
                </div>
                <h4 className="text-lg font-bold">Import General Manifest (IGM)</h4>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                The IGM must be submitted electronically to Bangladesh Customs before the arrival of the vessel or aircraft.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h5 className="text-xs font-bold text-blue-700 uppercase mb-1">Submission Timeline</h5>
                  <ul className="text-xs text-blue-600 space-y-1 list-disc ml-4">
                    <li>Sea: 24 hours before arrival at the first port of call.</li>
                    <li>Air: Immediately upon departure from the last airport.</li>
                    <li>Land: Upon arrival at the border station.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#374151] uppercase">Key Requirements</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {['Vessel/Flight Details', 'Port of Loading/Discharge', 'Consignee & Notifier Info', 'Container & Seal Numbers', 'Description of Goods', 'Gross Weight & Measurement'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <h4 className="text-lg font-bold">Export General Manifest (EGM)</h4>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                The EGM is submitted after the departure of the vessel or aircraft to confirm the goods actually exported.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h5 className="text-xs font-bold text-emerald-700 uppercase mb-1">Submission Timeline</h5>
                  <ul className="text-xs text-emerald-600 space-y-1 list-disc ml-4">
                    <li>Sea: Within 24 hours of vessel departure.</li>
                    <li>Air: Within 12 hours of flight departure.</li>
                    <li>Land: Immediately after crossing the border.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#374151] uppercase">Key Requirements</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {['Export Bill of Entry Ref', 'Shipping Bill Details', 'Final Destination Port', 'Container Loading List', 'Vessel Departure Confirmation', 'Authorized Agent Signature'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'checklist' && (
          <motion.div 
            key="checklist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-10 rounded-3xl shadow-sm border border-[#F3F4F6]"
          >
            <h4 className="text-xl font-bold mb-6">Cargo Declaration Necessaries (Checklist)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h5 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Mandatory Documents</h5>
                <div className="space-y-4">
                  {[
                    { title: 'Bill of Lading / Airway Bill', desc: 'Proof of contract of carriage and ownership.' },
                    { title: 'Commercial Invoice', desc: 'Detailed list of goods and their value.' },
                    { title: 'Packing List', desc: 'Breakdown of contents in each package.' },
                    { title: 'Certificate of Origin', desc: 'Proof of where the goods were manufactured.' },
                    { title: 'Import/Export Permit (IRC/ERC)', desc: 'Valid registration with the NBR/Commerce Ministry.' }
                  ].map((doc, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-[#F3F4F6] hover:border-blue-200 transition-all">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h6 className="text-sm font-bold">{doc.title}</h6>
                        <p className="text-xs text-[#6B7280]">{doc.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h5 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Additional Requirements</h5>
                <div className="space-y-4">
                  {[
                    { title: 'Insurance Cover Note', desc: 'Required for assessment of assessable value.' },
                    { title: 'Letter of Credit (L/C)', desc: 'Bank document for payment and compliance.' },
                    { title: 'Proforma Invoice', desc: 'Initial quote used for L/C opening.' },
                    { title: 'VAT Registration Certificate', desc: 'Proof of being a registered VAT payer.' },
                    { title: 'Special Permits (L/A, NOC)', desc: 'Required for restricted or controlled items.' }
                  ].map((doc, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-[#F3F4F6] hover:border-emerald-200 transition-all">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 6}
                      </div>
                      <div>
                        <h6 className="text-sm font-bold">{doc.title}</h6>
                        <p className="text-xs text-[#6B7280]">{doc.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'declaration' && (
          <motion.div 
            key="declaration"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-10 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-8"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold">Cargo Declaration (Bill of Entry) Helper</h4>
              <span className="text-xs font-bold text-[#6B7280]">Asycuda World Format</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#374151] uppercase">Customs Office</label>
                <select className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none text-sm">
                  <option>Chittagong Customs House (301)</option>
                  <option>Dhaka Customs House (101)</option>
                  <option>Mongla Customs House (401)</option>
                  <option>ICD Kamalapur (302)</option>
                  <option>Benapole Land Port (501)</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#374151] uppercase">Declaration Type</label>
                <select className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none text-sm">
                  <option>IM4 - Import for Home Consumption</option>
                  <option>EX1 - Export</option>
                  <option>IM7 - Warehousing</option>
                  <option>TR - Transit</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-[#F3F4F6]" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#374151] uppercase">Manifest Number</label>
                <input placeholder="e.g., 2024/1234" className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none text-sm" />
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#374151] uppercase">Line Number</label>
                <input placeholder="e.g., 0045" className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none text-sm" />
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#374151] uppercase">B/L or AWB No</label>
                <input placeholder="e.g., COSU6123456" className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none text-sm" />
              </div>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Important Note for Declarants</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Ensure all HS Codes match the current FY 2025-26 Tariff Schedule. Any discrepancy between the Manifest and the Cargo Declaration may lead to physical examination (Red Channel) or penalties under the Customs Act.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="px-8 py-4 bg-[#10B981] text-white rounded-2xl font-bold shadow-lg hover:bg-[#059669] transition-all flex items-center gap-2">
                <ClipboardCheck size={20} /> Validate Declaration Data
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportsView({ vatHistory, taxHistory }: { vatHistory: any[], taxHistory: any[] }) {
  const totalVat = vatHistory.reduce((sum, h) => sum + (h.result?.vatAmount || 0), 0);
  const totalIncomeTax = taxHistory.reduce((sum, h) => sum + (h.result?.taxLiability || 0), 0);
  
  const complianceScore = Math.min(100, (vatHistory.length + taxHistory.length) * 10);
  
  const combinedHistory = [
    ...vatHistory.map(h => ({ ...h, type: 'VAT' })),
    ...taxHistory.map(h => ({ ...h, type: 'Income Tax' }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const monthlyData = combinedHistory.reduce((acc: any[], h) => {
    const month = new Date(h.timestamp).toLocaleString('default', { month: 'short' });
    const existing = acc.find(d => d.month === month);
    const value = h.type === 'VAT' ? (h.result?.vatAmount || 0) : (h.result?.taxLiability || 0);
    
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ month, value });
    }
    return acc;
  }, []).slice(-6);

  const typeDistribution = [
    { name: 'VAT', value: totalVat },
    { name: 'Income Tax', value: totalIncomeTax }
  ];

  const COLORS = ['#10B981', '#3B82F6'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Compliance & Tax Reports</h3>
          <p className="text-sm text-[#6B7280]">Summary of your tax activities and compliance status</p>
        </div>
        <button className="px-6 py-3 bg-white border border-[#E5E7EB] text-[#374151] rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
          <FileText size={20} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Total VAT Collected</span>
          </div>
          <p className="text-3xl font-black text-[#111827]">৳{totalVat.toLocaleString()}</p>
          <p className="text-xs text-[#6B7280]">Based on {vatHistory.length} calculations</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-2">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Income Tax</span>
          </div>
          <p className="text-3xl font-black text-[#111827]">৳{totalIncomeTax.toLocaleString()}</p>
          <p className="text-xs text-[#6B7280]">Based on {taxHistory.length} calculations</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-2">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <ClipboardCheck size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Compliance Score</span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-[#111827]">{complianceScore}%</p>
            <span className="text-xs font-bold text-emerald-500 mb-1">Good</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${complianceScore}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-6">
          <h4 className="text-lg font-bold">Tax Liability Trend</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-6">
          <h4 className="text-lg font-bold">Tax Distribution</h4>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {typeDistribution.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-bold text-[#374151]">{d.name}</span>
                  <span className="text-xs text-[#6B7280]">৳{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] space-y-6">
        <h4 className="text-lg font-bold">Compliance Checklist Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'VAT Return Filed (Current Month)', status: vatHistory.length > 0 },
            { label: 'Income Tax Assessment Completed', status: taxHistory.length > 0 },
            { label: 'BIN/TIN Information Updated', status: true },
            { label: 'Recent Invoice Generation', status: true },
            { label: 'Customs Tariff Compliance Check', status: true },
            { label: 'E-Return Submission Ready', status: complianceScore > 70 }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <span className="text-sm font-medium text-[#374151]">{item.label}</span>
              {item.status ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Completed</span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full uppercase">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoticesView({ notices, onRefresh }: { notices: TaxNotice[], onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<number, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const categories = ['All', ...new Set(notices.map(n => n.category))];

  const fetchSummary = async (id: number) => {
    if (summaries[id] || loadingSummaries[id]) return;
    
    setLoadingSummaries(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/notices/summarize/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.summary) {
        setSummaries(prev => ({ ...prev, [id]: data.summary }));
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/notices/refresh', { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesFilter = filter === 'All' || n.category === filter;
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-zinc-900 tracking-tighter font-display">Regulatory Notices</h2>
        <p className="text-zinc-500 max-w-xl mx-auto text-lg">Stay updated with the latest circulars, SROs, and compliance updates from the National Board of Revenue (NBR).</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={clsx(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === cat ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-12 pr-6 py-3.5 bg-zinc-100 border-none rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none text-sm transition-all"
            />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3.5 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
            title="Refresh from NBR"
          >
            <ArrowRightLeft size={20} className={cn(isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <motion.div 
              key={notice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neo-card p-8 rounded-[2.5rem] group hover:border-brand-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-48 shrink-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      notice.category === 'VAT' ? "bg-emerald-50 text-emerald-600" :
                      notice.category === 'Income Tax' ? "bg-blue-50 text-blue-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {notice.category}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-400">
                    {new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold text-zinc-900 group-hover:text-brand-600 transition-colors">{notice.title}</h3>
                  
                  <AnimatePresence>
                    {summaries[notice.id] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm text-zinc-700 leading-relaxed italic">
                          <div className="flex items-center gap-2 text-brand-600 mb-2 font-black text-[10px] uppercase tracking-widest">
                            <Sparkles size={14} /> AI Summary
                          </div>
                          {summaries[notice.id]}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <button 
                      onClick={() => fetchSummary(notice.id)}
                      disabled={loadingSummaries[notice.id]}
                      className="inline-flex items-center gap-2 text-xs font-black text-brand-600 uppercase tracking-widest hover:gap-3 transition-all disabled:opacity-50"
                    >
                      {loadingSummaries[notice.id] ? (
                        <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      ) : <Sparkles size={16} />}
                      AI Summarize
                    </button>
                    <a 
                      href={notice.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-all"
                    >
                      View Original <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
              <Search size={40} />
            </div>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No notices found matching your search</p>
          </div>
        )}
      </div>

      <div className="neo-card p-10 rounded-[2.5rem] bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 bg-brand-500/20 text-brand-400 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles size={32} />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-bold font-display">AI-Powered Compliance Monitoring</h4>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
              Our system automatically monitors NBR portals and official gazettes every 2 hours. Use the <span className="text-brand-400 font-bold">AI Summarize</span> feature to quickly understand the impact of new regulations on your specific business sector.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxRebatePlanner() {
  const [income, setIncome] = useState('');
  const [currentInvestment, setCurrentInvestment] = useState('');
  const [result, setResult] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', url: '', description: '' });
  const [isAddingPartner, setIsAddingPartner] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/investment-partners');
      const data = await res.json();
      setPartners(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addPartner = async () => {
    if (!newPartner.name || !newPartner.url) return;
    setIsAddingPartner(true);
    try {
      const res = await fetch('/api/investment-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });
      if (res.ok) {
        setNewPartner({ name: '', url: '', description: '' });
        fetchPartners();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingPartner(false);
    }
  };

  const deletePartner = async (id: number) => {
    try {
      await fetch(`/api/investment-partners/${id}`, { method: 'DELETE' });
      fetchPartners();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateRebate = () => {
    const inc = parseFloat(income);
    const inv = parseFloat(currentInvestment) || 0;

    if (isNaN(inc) || inc <= 0) {
      alert("Please enter a valid annual income.");
      return;
    }

    // Bangladesh Tax Rebate Logic (Simplified)
    // Max Investment allowed for rebate: 20% of total income or 1 Crore (whichever is less)
    const maxInvestmentAllowed = Math.min(inc * 0.20, 10000000);
    
    // Rebate is usually 15% of the actual investment (if within limits)
    const actualInvestmentForRebate = Math.min(inv, maxInvestmentAllowed);
    const rebateAmount = actualInvestmentForRebate * 0.15;
    
    const potentialMaxRebate = maxInvestmentAllowed * 0.15;
    const additionalInvestmentNeeded = Math.max(0, maxInvestmentAllowed - inv);

    // Generate suggestions
    const suggestions = [];
    if (additionalInvestmentNeeded > 0) {
      suggestions.push({
        title: "DPS (Deposit Pension Scheme)",
        description: "Invest up to ৳60,000 annually in a bank DPS to get full rebate on this amount.",
        impact: "High"
      });
      suggestions.push({
        title: "Savings Certificates (Sanchaypatra)",
        description: "One of the safest ways to invest. Purchase 5-year Bangladesh Sanchaypatra.",
        impact: "Very High"
      });
      suggestions.push({
        title: "Listed Stocks & Mutual Funds",
        description: "Invest in the capital market through a BO account. Dividends are also tax-exempt up to ৳50,000.",
        impact: "Medium"
      });
      suggestions.push({
        title: "Life Insurance Premiums",
        description: "Premiums paid for life insurance of self, spouse, or children are eligible for rebate.",
        impact: "High"
      });
    }

    setResult({
      maxInvestmentAllowed,
      actualInvestmentForRebate,
      rebateAmount,
      potentialMaxRebate,
      additionalInvestmentNeeded,
      gap: potentialMaxRebate - rebateAmount,
      suggestions
    });
  };

  return (
    <div className="space-y-8">
      <SectionGuide 
        title="ট্যাক্স রিবেট প্ল্যানার গাইড"
        steps={[
          "আপনার মোট আয় এবং বর্তমান বিনিয়োগের তথ্য দিন।",
          "সিস্টেম আপনাকে জানাবে আপনি সর্বোচ্চ কত টাকা ট্যাক্স রেয়াত পেতে পারেন।",
          "আমাদের ভেরিফাইড পার্টনারদের মাধ্যমে বিনিয়োগ করে ট্যাক্স সাশ্রয় করুন।",
          "আপনার ট্যাক্স প্ল্যানিং আরও উন্নত করতে এআই পরামর্শ নিন।"
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6]">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <TrendingUp className="text-[#10B981]" />
          Rebate Parameters
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-2">Annual Taxable Income (BDT)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">৳</div>
              <input 
                type="number" 
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#374151] mb-2">Current Investment (BDT)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">৳</div>
              <input 
                type="number" 
                value={currentInvestment}
                onChange={(e) => setCurrentInvestment(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none font-medium"
                placeholder="DPS, Savings, Stocks, etc."
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs text-emerald-700 leading-relaxed">
              <strong>Tip:</strong> In Bangladesh, you can get a tax rebate of up to 15% on your investments. Common eligible sectors include DPS, Life Insurance, Savings Certificates, and Listed Stocks.
            </p>
          </div>

          <button 
            onClick={calculateRebate}
            className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-bold shadow-lg hover:bg-[#059669] transition-all flex items-center justify-center gap-2"
          >
            <Calculator size={20} /> Plan My Rebate
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {result ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] text-white p-8 rounded-3xl shadow-xl space-y-8"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-emerald-400">Rebate Summary</h3>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Optimized
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Rebate</p>
                <p className="text-2xl font-bold font-mono">৳{result.rebateAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Max Potential</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">৳{result.potentialMaxRebate.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Allowable Investment Limit</span>
                <span className="font-mono">৳{result.maxInvestmentAllowed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Investment Gap</span>
                <span className="font-mono text-amber-400">৳{result.additionalInvestmentNeeded.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Tax Savings Opportunity</span>
                <span className="font-mono text-emerald-400">৳{result.gap.toLocaleString()}</span>
              </div>
            </div>

            {result.gap > 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-xs text-amber-200 leading-relaxed">
                  <AlertCircle size={14} className="inline mr-1 mb-0.5" />
                  You are missing out on <strong>৳{result.gap.toLocaleString()}</strong> in tax savings. Invest an additional <strong>৳{result.additionalInvestmentNeeded.toLocaleString()}</strong> before the tax year ends to maximize your rebate.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <p className="text-xs text-emerald-200 leading-relaxed">
                  <CheckCircle2 size={14} className="inline mr-1 mb-0.5" />
                  Congratulations! You have maximized your tax rebate for this income level.
                </p>
              </div>
            )}

            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Sparkles size={16} /> Rebate Suggestions
                </h4>
                <div className="space-y-3">
                  {result.suggestions.map((s: any, i: number) => (
                    <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-white">{s.title}</p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md uppercase font-bold">{s.impact}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Building2 size={16} /> Investment Partners
                </h4>
                <button 
                  onClick={() => setShowPartnerModal(true)}
                  className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all"
                >
                  Manage
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {partners.map((p) => (
                  <a 
                    key={p.id}
                    href={p.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex flex-col gap-1"
                  >
                    <p className="text-[10px] font-bold text-white">{p.name}</p>
                    <p className="text-[8px] text-gray-400">{p.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full bg-white border-2 border-dashed border-[#E5E7EB] rounded-3xl flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
              <TrendingUp size={32} />
            </div>
            <h4 className="font-bold text-[#374151]">Plan Your Savings</h4>
            <p className="text-sm text-[#6B7280] mt-2 max-w-[200px]">Calculate how much you can save on taxes through smart investments.</p>
            <button 
              onClick={() => setShowPartnerModal(true)}
              className="mt-6 text-xs font-bold text-brand-600 hover:underline flex items-center gap-2"
            >
              <Plus size={14} /> Manage Investment Partners
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPartnerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Investment Partners</h3>
                  <p className="text-sm text-zinc-500">Add or remove verified financial institutions</p>
                </div>
                <button onClick={() => setShowPartnerModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Partner Name</label>
                      <input 
                        type="text"
                        value={newPartner.name}
                        onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                        placeholder="e.g. MetLife"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Website URL</label>
                      <input 
                        type="text"
                        value={newPartner.url}
                        onChange={(e) => setNewPartner({ ...newPartner, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Description</label>
                    <input 
                      type="text"
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      placeholder="e.g. Life Insurance & Savings"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                    />
                  </div>
                  <button 
                    onClick={addPartner}
                    disabled={isAddingPartner || !newPartner.name || !newPartner.url}
                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Partner
                  </button>
                </div>

                <div className="h-px bg-zinc-100" />

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {partners.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{p.name}</p>
                        <p className="text-xs text-zinc-500">{p.url}</p>
                      </div>
                      <button 
                        onClick={() => deletePartner(p.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

function HSCodeFinder() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchHSCode = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hscode/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionGuide 
        title="এইচএস কোড ফাইন্ডার গাইড"
        steps={[
          "আপনার পণ্যের নাম বা বিবরণ (Description) লিখুন।",
          "এআই সার্চ ইঞ্জিন আপনাকে সবচেয়ে সঠিক এইচএস কোডটি খুঁজে দেবে।",
          "কোডের সাথে সংশ্লিষ্ট শুল্কের হারগুলোও দেখে নিন।",
          "ভুল এইচএস কোড ব্যবহারের ঝুঁকি এড়ান।"
        ]}
      />
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6]">
        <h3 className="text-xl font-bold mb-6">AI-Powered HS Code Finder</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchHSCode()}
              placeholder="Search by product name (e.g., 'solar panel', 'electric motor')..."
              className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none font-medium"
            />
          </div>
          <button 
            onClick={searchHSCode}
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-[#10B981] text-white rounded-2xl font-bold shadow-lg hover:bg-[#059669] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Searching...' : <><Search size={20} /> Find Codes</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {results.length > 0 ? (
          results.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-[#F3F4F6] hover:border-[#10B981] transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold font-mono">
                      {item.hsCode}
                    </span>
                    <span className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">Bangladesh Customs Tariff</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#111827] mb-2">{item.description}</h4>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  <DutyBadge label="CD" value={item.cd} />
                  <DutyBadge label="SD" value={item.sd} />
                  <DutyBadge label="VAT" value={item.vat} />
                  <DutyBadge label="AIT" value={item.ait} />
                  <DutyBadge label="RD" value={item.rd} />
                  <DutyBadge label="AT" value={item.at} />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-[#F3F4F6] flex justify-between items-center">
                <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-widest">Data provided by AI Advisor</p>
                <button className="text-sm font-bold text-[#10B981] hover:underline flex items-center gap-1">
                  Use in Calculator <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))
        ) : !loading && query && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <Search size={40} />
            </div>
            <h4 className="text-lg font-bold text-[#374151]">No results yet</h4>
            <p className="text-[#6B7280] max-w-xs mx-auto mt-2">Try searching for a specific product category or item name.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DutyBadge({ label, value }: { label: string, value: number }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-[#6B7280] mb-1">{label}</p>
      <div className="w-12 h-12 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex items-center justify-center font-bold text-sm text-[#111827]">
        {value}%
      </div>
    </div>
  );
}

function CryptoTaxAdvisory() {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Welcome to the Web3 Crypto Tax Advisory. I am your Bloomberg-level expert on blockchain taxation. How can I assist you with your digital asset compliance today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, { role: 'user', text: userMsg }].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are a world-class Web3 and Blockchain Tax Expert with Bloomberg-level insights. Provide detailed, professional advice on crypto taxation, DeFi, NFTs, and cross-border digital asset compliance. Use technical terminology accurately."
        }
      });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I apologize, but I couldn't process that request." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to the advisory network. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <SectionGuide 
        title="ক্রিপ্টো ট্যাক্স অ্যাডভাইজরি গাইড"
        steps={[
          "আপনার ক্রিপ্টোকারেন্সি বা ডিজিটাল অ্যাসেট সংক্রান্ত যেকোনো ট্যাক্স প্রশ্ন নিচে লিখুন।",
          "আমাদের এআই অ্যাডভাইজার ব্লুমবার্গ-লেভেল এক্সপার্ট হিসেবে আপনাকে পরামর্শ দেবে।",
          "DeFi স্ট্যাকিং, NFT ক্যাপিটাল গেইনস বা ক্রস-বর্ডার ট্রানজ্যাকশন সম্পর্কে বিস্তারিত জানতে পারবেন।",
          "পরামর্শগুলো সাধারণ নির্দেশিকা হিসেবে ব্যবহার করুন এবং জটিল ক্ষেত্রে পেশাদার পরামর্শ নিন।"
        ]}
      />
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter font-display">Crypto Tax Advisory</h2>
          <p className="text-zinc-500">Bloomberg-level insights for digital asset compliance.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
          <Zap size={14} className="animate-pulse" /> Live Web3 Node
        </div>
      </div>

      <div className="neo-card h-[600px] flex flex-col overflow-hidden rounded-[2.5rem]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-zinc-900 text-white rounded-tr-none shadow-xl" 
                  : "bg-zinc-100 text-zinc-900 rounded-tl-none border border-zinc-200"
              )}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 p-5 rounded-3xl rounded-tl-none border border-zinc-200 flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-4">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about DeFi yield, NFT capital gains, or cross-chain tax..."
            className="flex-1 px-6 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 outline-none text-sm transition-all"
          />
          <button 
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockchainVerification() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [manualHash, setManualHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'manual'>('upload');
  const [historySearch, setHistorySearch] = useState('');
  const [isAutoChecking, setIsAutoChecking] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/blockchain/history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    setIsAutoChecking(true);
    
    try {
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHash(hashHex);

      // Auto-check if already exists
      const res = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileHash: hashHex,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          checkOnly: true // We can add this flag to server if we want to avoid auto-anchoring, 
                         // but current server logic is fine as it returns existing if found.
        })
      });
      const data = await res.json();
      if (data.anchored === false) {
        // It was already there, so we show the result immediately
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAutoChecking(false);
    }
  };

  const verifyOnChain = async (targetHash: string, name?: string, size?: number) => {
    if (!targetHash || verifying) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileHash: targetHash,
          fileName: name || 'Manual Entry',
          fileSize: size || 0
        })
      });
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const filteredHistory = history.filter(h => 
    h.fileName.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.txHash.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.fileHash.toLowerCase().includes(historySearch.toLowerCase())
  );

  const downloadHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "blockchain_verification_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      <SectionGuide 
        title="ব্লকচেইন ভেরিফিকেশন গাইড"
        steps={[
          "আপনার ট্যাক্স ডকুমেন্ট বা ইনভয়েস ফাইলটি (PDF, Image) ড্রপ করুন বা আপলোড করুন।",
          "সিস্টেম স্বয়ংক্রিয়ভাবে ফাইলের SHA-256 ক্রিপ্টোগ্রাফিক ফিঙ্গারপ্রিন্ট তৈরি করবে এবং এটি আগে থেকেই ভেরিফাইড কি না তা পরীক্ষা করবে।",
          "যদি ফাইলটি নতুন হয়, তবে 'Verify & Anchor' বাটনে ক্লিক করে এটি ব্লকচেইনে সিকিউরলি অ্যাঙ্কর করুন।",
          "ভবিষ্যতে যেকোনো সময় একই ফাইল আপলোড করে বা হ্যাশ কোড দিয়ে এর সত্যতা যাচাই করতে পারবেন।"
        ]}
      />
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <Zap size={14} className="animate-pulse" /> Decentralized Trust Engine
        </div>
        <h2 className="text-5xl font-black text-zinc-900 tracking-tighter font-display">Blockchain Verification</h2>
        <p className="text-zinc-500 max-w-xl mx-auto text-lg">Anchor your critical documents to the Ethereum blockchain for immutable proof of integrity.</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-zinc-100 rounded-2xl shadow-inner">
          <button 
            onClick={() => { setActiveSubTab('upload'); setResult(null); }}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeSubTab === 'upload' ? "bg-white text-zinc-900 shadow-lg" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <FileText size={18} /> File Upload
          </button>
          <button 
            onClick={() => { setActiveSubTab('manual'); setResult(null); }}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeSubTab === 'manual' ? "bg-white text-zinc-900 shadow-lg" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <Fingerprint size={18} /> Manual Hash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="neo-card p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            {activeSubTab === 'upload' ? (
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Anchor Document</h3>
                  {file && (
                    <button 
                      onClick={() => { setFile(null); setHash(''); setResult(null); }}
                      className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all cursor-pointer group relative overflow-hidden",
                    file ? "border-brand-500 bg-brand-50/30" : "border-zinc-200 bg-zinc-50/50 hover:border-brand-500"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <div className={cn(
                    "w-24 h-24 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-6 transition-all duration-700",
                    file ? "bg-brand-500 text-white rotate-0 scale-110" : "bg-white text-zinc-400 group-hover:rotate-12 group-hover:scale-110"
                  )}>
                    {isAutoChecking ? (
                      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                    ) : file ? <Check size={48} className="stroke-[3]" /> : <FileSearch size={48} />}
                  </div>
                  <p className="text-xl font-black text-zinc-900">{file ? file.name : 'Drop file here'}</p>
                  <p className="text-sm text-zinc-400 mt-2 font-medium">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, or Image (Max 10MB)'}
                  </p>
                </div>

                {hash && !result && !isAutoChecking && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6 bg-zinc-900 text-white rounded-3xl space-y-4 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Fingerprint size={100} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 relative z-10">Cryptographic Hash Generated</p>
                      </div>
                      <p className="text-xs font-mono break-all leading-relaxed relative z-10 text-zinc-300">{hash}</p>
                    </div>
                    <button 
                      onClick={() => verifyOnChain(hash, file?.name, file?.size)}
                      disabled={verifying}
                      className="w-full py-6 bg-brand-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/30 hover:bg-brand-700 hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {verifying ? (
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      ) : <Fingerprint size={24} />}
                      Anchor on Blockchain
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold">Manual Verification</h3>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Enter SHA-256 Hash</label>
                  <div className="relative">
                    <textarea 
                      value={manualHash}
                      onChange={(e) => setManualHash(e.target.value)}
                      placeholder="Paste the 64-character hex hash here..."
                      className="w-full px-8 py-6 bg-zinc-50 border border-zinc-100 rounded-3xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none font-mono text-sm min-h-[150px] transition-all resize-none"
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-mono text-zinc-300">
                      {manualHash.length}/64
                    </div>
                  </div>
                  <button 
                    onClick={() => verifyOnChain(manualHash)}
                    disabled={verifying || manualHash.length < 64}
                    className="w-full py-6 bg-zinc-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:translate-y-[-2px] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {verifying ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : <Search size={24} />}
                    Verify Document Hash
                  </button>
                </div>
              </div>
            )}
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="neo-card p-10 rounded-[2.5rem] bg-emerald-50 border-emerald-100 space-y-8 relative overflow-hidden shadow-2xl shadow-emerald-500/10"
            >
              <div className="absolute top-0 right-0 p-10 text-emerald-200/30">
                <ShieldCheck size={150} />
              </div>
              <div className="flex items-center gap-6 text-emerald-600 relative z-10">
                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-2xl font-black tracking-tight">Verification Successful</h4>
                  <p className="text-sm text-emerald-700 font-medium mt-1">Immutable proof of integrity confirmed.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 relative z-10">
                <ResultDetail label="Status" value={result.anchored ? "Newly Anchored" : "Previously Verified"} color="text-emerald-700" />
                <ResultDetail label="Network" value={result.data.network} />
                <ResultDetail label="Timestamp" value={new Date(result.data.createdAt).toLocaleString()} />
                <div className="pt-6 space-y-3">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Blockchain Transaction Hash</p>
                  <div className="p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 font-mono text-xs break-all leading-relaxed shadow-inner">
                    {result.data.txHash}
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4 relative z-10">
                <button className="flex-1 py-4 bg-white text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                  <Download size={18} /> Download Certificate
                </button>
                <button className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                  <ExternalLink size={18} /> View on Explorer
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <History size={24} className="text-brand-500" />
              Verification Log
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={downloadHistory}
                className="p-2.5 bg-white border border-zinc-100 text-zinc-400 rounded-xl hover:text-brand-500 hover:border-brand-500 transition-all shadow-sm"
                title="Export History"
              >
                <Download size={18} />
              </button>
              <span className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                {history.length} Records
              </span>
            </div>
          </div>

          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                placeholder="Search by filename, hash, or transaction..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar px-1">
            {filteredHistory.length > 0 ? filteredHistory.map((h, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="neo-card p-6 rounded-[2rem] flex items-center gap-6 group hover:border-brand-500/30 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-all duration-700 group-hover:rotate-6 shadow-inner">
                  <Shield size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-zinc-900 truncate group-hover:text-brand-600 transition-colors">{h.fileName}</p>
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-400 rounded text-[8px] font-black uppercase tracking-widest shrink-0">
                      {(h.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">{h.txHash}</p>
                      <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{h.network}</p>
                    </div>
                    <p className="text-[9px] text-zinc-300 font-mono truncate">Hash: {h.fileHash}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end text-emerald-600 mb-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold">{new Date(h.createdAt).toLocaleDateString()}</p>
                  <p className="text-[9px] text-zinc-300 mt-0.5">{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-32 bg-zinc-50/50 rounded-[3rem] border-2 border-dashed border-zinc-200">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-200 shadow-xl">
                  <Fingerprint size={48} />
                </div>
                <h4 className="text-xl font-black text-zinc-400">No Records Found</h4>
                <p className="text-sm text-zinc-400 mt-2 max-w-[250px] mx-auto font-medium">Try adjusting your search or upload a new document to verify.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultDetail({ label, value, color = "text-zinc-900" }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-emerald-100/50 last:border-0">
      <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs font-bold", color)}>{value}</span>
    </div>
  );
}

function TokenizedCertificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [minting, setMinting] = useState(false);
  const [address, setAddress] = useState('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);

  useEffect(() => {
    fetchCerts();
  }, []);

  const fetchCerts = async () => {
    try {
      const res = await fetch('/api/blockchain/certificates');
      const data = await res.json();
      setCerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const mintCert = async (type: string) => {
    if (!address || address.length < 42) {
      alert("Please enter a valid wallet address first.");
      return;
    }
    setMinting(true);
    try {
      const res = await fetch('/api/blockchain/certificates/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: address, certType: type })
      });
      if (res.ok) {
        fetchCerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMinting(false);
    }
  };

  const handleUpdateAddress = () => {
    if (tempAddress.startsWith('0x') && tempAddress.length === 42) {
      setAddress(tempAddress);
      setIsEditingAddress(false);
    } else {
      alert("Please enter a valid Ethereum-style address (0x...)");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      <SectionGuide 
        title="কমপ্লায়েন্স এনএফটি (SBT) গাইড"
        steps={[
          "প্রথমে আপনার ওয়ালেট অ্যাড্রেসটি নিশ্চিত করুন। আপনি চাইলে অ্যাড্রেসটি পরিবর্তন করতে পারেন।",
          "আপনার ট্যাক্স কমপ্লায়েন্স স্ট্যাটাস অনুযায়ী সঠিক সার্টিফিকেট টাইপ নির্বাচন করুন।",
          "'Mint SBT Certificate' বাটনে ক্লিক করে আপনার ডিজিটাল সার্টিফিকেট তৈরি করুন।",
          "এটি একটি Soulbound Token (SBT) হিসেবে আপনার ওয়ালেটে ইস্যু করা হবে যা ট্রান্সফার করা যায় না।",
          "আপনার পোর্টফোলিওতে থাকা এনএফটি-টি যেকোনো থার্ড-পার্টিকে আপনার ট্যাক্স ক্লিয়ারেন্সের প্রমাণ হিসেবে দেখাতে পারবেন।"
        ]}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-zinc-900 tracking-tighter font-display">Compliance NFTs</h2>
          <p className="text-zinc-500 max-w-xl text-lg">Tokenized tax compliance certificates issued as Soulbound Tokens (SBTs) for immutable proof of standing.</p>
        </div>
        
        <div className="p-6 bg-zinc-900 text-white rounded-[2rem] shadow-2xl space-y-4 min-w-[300px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Cpu size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Wallet</p>
                <p className="text-xs font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsEditingAddress(true); setTempAddress(address); }}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <Pencil size={14} />
            </button>
          </div>

          {isEditingAddress && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
              <input 
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono focus:border-brand-500 outline-none"
                placeholder="0x..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingAddress(false)}
                  className="flex-1 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateAddress}
                  className="flex-1 py-2 bg-brand-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-600"
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'VAT Compliance', desc: 'Verified VAT standing for FY 2025-26', icon: <Percent size={24} />, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
          { title: 'Tax Clearance', desc: 'Full individual income tax clearance', icon: <ShieldCheck size={24} />, color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
          { title: 'Export Merit', desc: 'Certified export-oriented business status', icon: <Ship size={24} />, color: 'bg-purple-500', glow: 'shadow-purple-500/20' }
        ].map((item, i) => (
          <div key={i} className="neo-card p-10 rounded-[2.5rem] space-y-8 group hover:scale-[1.02] transition-all relative overflow-hidden">
            <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10", item.color, item.glow)}>
              {item.icon}
            </div>
            <div className="space-y-3 relative z-10">
              <h3 className="text-2xl font-bold">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
            <button 
              onClick={() => mintCert(item.title)}
              disabled={minting}
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 relative z-10 flex items-center justify-center gap-3"
            >
              {minting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Ticket size={18} />}
              Mint SBT Certificate
            </button>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-zinc-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl" />
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Ticket size={24} className="text-brand-500" />
            Your Tokenized Portfolio
          </h3>
          <span className="px-4 py-1.5 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest">
            {certs.length} Certificates
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certs.length > 0 ? certs.map((c, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative aspect-[3/4] rounded-[3rem] overflow-hidden group shadow-2xl hover:shadow-brand-500/10 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="absolute top-0 right-0 p-8">
                <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Ticket size={24} className="text-brand-500" />
                </div>
              </div>

              <div className="absolute inset-0 p-10 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em]">Soulbound Token</p>
                  </div>
                  <h4 className="text-3xl font-black text-white tracking-tighter leading-tight">{c.certType}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Official Compliance Record</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-white/10 transition-all">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Owner Address</p>
                      <p className="text-[10px] font-mono text-zinc-300 break-all">{c.ownerAddress}</p>
                    </div>
                    <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-white/10 transition-all">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Token Identity</p>
                      <p className="text-xs font-mono text-white font-bold">{c.tokenId}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Issue Date</p>
                      <p className="text-xs text-white font-medium">{new Date(c.issueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                        <ShieldCheck size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Holographic effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/0 via-brand-500/5 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          )) : (
            <div className="col-span-full py-32 text-center bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-200 shadow-sm">
                <Ticket size={40} />
              </div>
              <h4 className="text-xl font-bold text-zinc-400">No Certificates Found</h4>
              <p className="text-sm text-zinc-400 mt-2 max-w-[250px] mx-auto">Select a certificate type above to mint your first Soulbound Token.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionView() {
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank' | 'crypto'>('online');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const plans = [
    { name: 'Basic', price: 999, features: ['VAT Calculator', 'Tax History', 'Basic Reports'], color: 'bg-blue-500' },
    { name: 'Pro', price: 2499, features: ['All Basic features', 'AI Tax Advisor', 'HS Code Finder', 'Priority Support'], color: 'bg-emerald-500', popular: true },
    { name: 'Enterprise', price: 9999, features: ['All Pro features', 'Custom Compliance Audit', 'Multi-user Access', 'API Integration'], color: 'bg-purple-500' }
  ];

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      const data = await res.json();
      setCurrentSub(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if ((paymentMethod === 'online' || paymentMethod === 'crypto') && !transactionId) {
      alert(`Please enter ${paymentMethod === 'online' ? 'Transaction ID' : 'Transaction Hash'} for payment.`);
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = paymentMethod === 'online' ? '/api/subscription/subscribe' : 
                      paymentMethod === 'bank' ? '/api/subscription/bank-payment' :
                      '/api/subscription/subscribe'; // Crypto also uses subscribe for now
      
      const body = { 
        planName: selectedPlan.name, 
        paymentMethod, 
        amount: selectedPlan.price, 
        transactionId: transactionId || 'BANK_SLIP_PENDING' 
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert(paymentMethod === 'bank' ? 'Payment submitted for verification.' : 'Subscription activated!');
        setShowPaymentModal(false);
        fetchSubscription();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-12">
      <SectionGuide 
        title="সাবস্ক্রিপশন গাইড"
        steps={[
          "আপনার প্রয়োজন অনুযায়ী বেসিক, প্রো বা এন্টারপ্রাইজ প্ল্যান বেছে নিন।",
          "অনলাইন পেমেন্ট (বিকাশ/নগদ), ব্যাংক ট্রান্সফার বা ক্রিপ্টোকারেন্সি ব্যবহার করে পে করুন।",
          "পেমেন্ট কনফার্ম হওয়ার পর আপনার প্রো ফিচারগুলো আনলক হয়ে যাবে।",
          "আপনার সাবস্ক্রিপশন হিস্ট্রি এবং রিনিউয়াল ডেট এখান থেকে ম্যানেজ করুন।"
        ]}
      />
      {currentSub && currentSub.status === 'active' ? (
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-emerald-900">Active Subscription: {currentSub.planName}</h3>
            <p className="text-emerald-700 mt-1">Your plan expires on {new Date(currentSub.expiresAt).toLocaleDateString()}</p>
          </div>
          <div className="px-6 py-2 bg-emerald-500 text-white rounded-full font-bold text-sm">
            PRO STATUS
          </div>
        </div>
      ) : currentSub && currentSub.status === 'pending' ? (
        <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-amber-900">Payment Pending Verification</h3>
          <p className="text-amber-700 mt-1">We are reviewing your bank payment for the {currentSub.planName} plan. This usually takes 24 hours.</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Choose Your Plan</h2>
          <p className="text-[#6B7280]">Unlock advanced tax tools and AI insights.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className={cn(
            "bg-white p-8 rounded-3xl shadow-sm border-2 transition-all relative overflow-hidden",
            plan.popular ? "border-[#10B981] scale-105" : "border-[#F3F4F6]"
          )}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#10B981] text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
                Most Popular
              </div>
            )}
            <div className={cn("w-12 h-12 rounded-2xl mb-6 flex items-center justify-center text-white", plan.color)}>
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold">৳{plan.price}</span>
              <span className="text-[#6B7280] text-sm">/year</span>
            </div>
            <ul className="space-y-4 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-[#374151]">
                  <CheckCircle2 size={16} className="text-[#10B981]" />
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => { setSelectedPlan(plan); setShowPaymentModal(true); }}
              className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all",
                plan.popular ? "bg-[#10B981] text-white shadow-lg" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
              )}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 border-b border-[#F3F4F6] bg-[#F9FAFB]">
                <h3 className="text-xl font-bold">Complete Subscription</h3>
                <p className="text-sm text-[#6B7280] mt-1">Plan: {selectedPlan?.name} (৳{selectedPlan?.price})</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex p-1 bg-[#F3F4F6] rounded-2xl">
                  <button 
                    onClick={() => setPaymentMethod('online')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                      paymentMethod === 'online' ? "bg-white shadow-sm text-[#10B981]" : "text-[#6B7280]"
                    )}
                  >
                    Online Payment
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('bank')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                      paymentMethod === 'bank' ? "bg-white shadow-sm text-[#3B82F6]" : "text-[#6B7280]"
                    )}
                  >
                    Bank Transfer
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('crypto')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                      paymentMethod === 'crypto' ? "bg-white shadow-sm text-amber-500" : "text-[#6B7280]"
                    )}
                  >
                    Crypto
                  </button>
                </div>

                {paymentMethod === 'online' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-xs text-emerald-800 font-medium">Pay via bKash/Nagad/Rocket to: <strong>01917179881</strong></p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Transaction ID</label>
                      <input 
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter your TrxID"
                        className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10B981] outline-none font-medium"
                      />
                    </div>
                  </div>
                ) : paymentMethod === 'bank' ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                      <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Bank Details</p>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">VATX.BD</p>
                        <p className="text-sm">Bank: City Bank</p>
                        <p className="text-sm">A/C: 1234567890</p>
                        <p className="text-sm">Branch: Gulshan</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B7280] italic text-center">Please upload your payment slip or email it to billing@vatx.bd after transfer.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Crypto Payment (USDT/USDC)</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Network</span>
                          <span className="font-bold">Polygon / ERC20</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-amber-200 break-all text-[10px] font-mono">
                          0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Transaction Hash</label>
                      <input 
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      />
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubscribe}
                  disabled={submitting}
                  className="w-full py-4 bg-[#111827] text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-all disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
