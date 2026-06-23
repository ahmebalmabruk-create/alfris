import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Wallet, ArrowDownCircle, ArrowUpCircle, Tags, LogOut, TrendingUp, TrendingDown } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'accounts', label: 'الحسابات', icon: Wallet },
  { id: 'income', label: 'الإيرادات', icon: ArrowDownCircle },
  { id: 'expenses', label: 'المصروفات', icon: ArrowUpCircle },
  { id: 'categories', label: 'التصنيفات', icon: Tags },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { signOut } = useAuth();

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-slate-800 border-l border-slate-700 flex flex-col z-50">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
            <TrendingDown className="w-5 h-5 text-white -mt-2" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">الحسابات المالية</h1>
            <p className="text-xs text-slate-400">إدارة مالية ذكية</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === item.id
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
