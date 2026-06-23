import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Account, Transaction, Category } from '../lib/definitions';
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export default function Dashboard({ onTabChange }: DashboardProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [accountsRes, transactionsRes, categoriesRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*, account:accounts(*), category:categories(*)').eq('user_id', user.id).order('date', { ascending: false }).limit(10),
      supabase.from('categories').select('*').eq('user_id', user.id),
    ]);

    setAccounts(accountsRes.data || []);
    setTransactions(transactionsRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">لوحة التحكم</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">إجمالي الرصيد</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">إجمالي المصروفات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">الحسابات</h3>
            <button onClick={() => onTabChange('accounts')} className="text-emerald-400 text-sm hover:underline">
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>لا توجد حسابات</p>
                <button onClick={() => onTabChange('accounts')} className="text-emerald-400 hover:underline mt-2">
                  إضافة حساب جديد
                </button>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{account.name}</p>
                      <p className="text-slate-400 text-sm">{account.type}</p>
                    </div>
                  </div>
                  <p className="text-white font-semibold">{formatCurrency(Number(account.balance))}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">آخر المعاملات</h3>
            <button onClick={() => onTabChange('income')} className="text-emerald-400 text-sm hover:underline">
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>لا توجد معاملات</p>
                <button onClick={() => onTabChange('income')} className="text-emerald-400 hover:underline mt-2">
                  إضافة معاملة جديدة
                </button>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                    }`}>
                      {tx.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.description || 'معاملة'}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(tx.date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
