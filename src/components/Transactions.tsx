import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Account, Transaction, Category } from '../lib/definitions';
import { Plus, Trash2, CreditCard as Edit2, X, Check, TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionsProps {
  type: 'income' | 'expense';
}

export default function Transactions({ type }: TransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    account_id: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id).eq('type', type),
      supabase
        .from('transactions')
        .select('*, account:accounts(*), category:categories(*)')
        .eq('user_id', user.id)
        .eq('type', type)
        .order('date', { ascending: false }),
    ]);

    setAccounts(accountsRes.data || []);
    setCategories(categoriesRes.data || []);
    setTransactions(transactionsRes.data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.amount || !form.account_id) return;

    const amount = parseFloat(form.amount);
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: form.account_id,
      category_id: form.category_id || null,
      amount,
      type,
      description: form.description,
      date: form.date,
    });

    if (!error) {
      const account = accounts.find(a => a.id === form.account_id);
      if (account) {
        const newBalance = type === 'income'
          ? Number(account.balance) + amount
          : Number(account.balance) - amount;
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', form.account_id);
      }

      setShowAdd(false);
      setForm({
        amount: '',
        description: '',
        account_id: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    }
  };

  const handleUpdate = async (id: string, oldAmount: number, oldAccountId: string) => {
    if (!form.amount || !form.account_id) return;

    const newAmount = parseFloat(form.amount);
    const newAccountId = form.account_id;

    if (oldAccountId === newAccountId) {
      const diff = newAmount - oldAmount;
      const account = accounts.find(a => a.id === newAccountId);
      if (account) {
        const updatedBalance = type === 'income'
          ? Number(account.balance) + diff
          : Number(account.balance) - diff;
        await supabase.from('accounts').update({ balance: updatedBalance }).eq('id', newAccountId);
      }
    } else {
      const oldAccount = accounts.find(a => a.id === oldAccountId);
      if (oldAccount) {
        const oldAccNewBalance = type === 'income'
          ? Number(oldAccount.balance) - oldAmount
          : Number(oldAccount.balance) + oldAmount;
        await supabase.from('accounts').update({ balance: oldAccNewBalance }).eq('id', oldAccountId);
      }

      const newAccount = accounts.find(a => a.id === newAccountId);
      if (newAccount) {
        const newAccNewBalance = type === 'income'
          ? Number(newAccount.balance) + newAmount
          : Number(newAccount.balance) - newAmount;
        await supabase.from('accounts').update({ balance: newAccNewBalance }).eq('id', newAccountId);
      }
    }

    await supabase
      .from('transactions')
      .update({
        amount: newAmount,
        description: form.description,
        account_id: newAccountId,
        category_id: form.category_id || null,
        date: form.date,
      })
      .eq('id', id);

    setEditingId(null);
    setForm({
      amount: '',
      description: '',
      account_id: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
    });
    fetchData();
  };

  const handleDelete = async (tx: Transaction) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;

    const account = accounts.find(a => a.id === tx.account_id);
    if (account) {
      const newBalance = type === 'income'
        ? Number(account.balance) - Number(tx.amount)
        : Number(account.balance) + Number(tx.amount);
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', tx.account_id);
    }

    await supabase.from('transactions').delete().eq('id', tx.id);
    fetchData();
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setForm({
      amount: tx.amount.toString(),
      description: tx.description || '',
      account_id: tx.account_id,
      category_id: tx.category_id || '',
      date: tx.date,
    });
  };

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

  const isIncome = type === 'income';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const title = isIncome ? 'الإيرادات' : 'المصروفات';
  const color = isIncome ? 'emerald' : 'rose';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button
          onClick={() => setShowAdd(true)}
          className={`flex items-center gap-2 bg-${color}-500 text-white px-4 py-2 rounded-xl hover:bg-${color}-600 transition`}
          style={{ backgroundColor: isIncome ? '#10b981' : '#f43f5e' }}
        >
          <Plus className="w-5 h-5" />
          إضافة {title}
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400">
          يجب إضافة حساب أولاً قبل تسجيل المعاملات
        </div>
      )}

      {showAdd && accounts.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">إضافة {title} جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="المبلغ"
            />
            <select
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">اختر الحساب</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">بدون تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
              placeholder="الوصف (اختياري)"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition"
            >
              <Check className="w-5 h-5" />
              حفظ
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setForm({
                  amount: '',
                  description: '',
                  account_id: '',
                  category_id: '',
                  date: new Date().toISOString().split('T')[0],
                });
              }}
              className="flex items-center gap-2 bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition"
            >
              <X className="w-5 h-5" />
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-right py-4 px-6 text-slate-400 font-medium">التاريخ</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">الوصف</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">التصنيف</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">الحساب</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">المبلغ</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition">
                  {editingId === tx.id ? (
                    <>
                      <td className="py-4 px-6">
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="bg-slate-700/50 border border-slate-600 rounded-lg py-1 px-2 text-white w-full"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="text"
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className="bg-slate-700/50 border border-slate-600 rounded-lg py-1 px-2 text-white w-full"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={form.category_id}
                          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                          className="bg-slate-700/50 border border-slate-600 rounded-lg py-1 px-2 text-white w-full"
                        >
                          <option value="">بدون</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={form.account_id}
                          onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                          className="bg-slate-700/50 border border-slate-600 rounded-lg py-1 px-2 text-white w-full"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="number"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="bg-slate-700/50 border border-slate-600 rounded-lg py-1 px-2 text-white w-24"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(tx.id, Number(tx.amount), tx.account_id)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-slate-400 hover:text-slate-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 px-6 text-white">
                        {new Date(tx.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-4 px-6 text-white">
                        {tx.description || '-'}
                      </td>
                      <td className="py-4 px-6 text-white">
                        {tx.category?.name || '-'}
                      </td>
                      <td className="py-4 px-6 text-white">
                        {tx.account?.name || '-'}
                      </td>
                      <td className={`py-4 px-6 font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(tx)}
                            className="text-slate-400 hover:text-white transition"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            className="text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">لا توجد {title}</p>
                    <p className="text-sm mt-2">أضف معاملتك الأولى</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
