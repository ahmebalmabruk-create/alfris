import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Account } from '../lib/definitions';
import { Wallet, Plus, Trash2, CreditCard as Edit2, X, Check } from 'lucide-react';

const accountTypes = [
  { value: 'cash', label: 'نقدى' },
  { value: 'bank', label: 'بنكي' },
  { value: 'credit', label: 'ائتمان' },
  { value: 'investment', label: 'استثمار' },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'cash' as const, balance: '' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setAccounts(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.name) return;

    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance) || 0,
    });

    if (!error) {
      setShowAdd(false);
      setForm({ name: '', type: 'cash', balance: '' });
      fetchAccounts();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('accounts')
      .update({
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance) || 0,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setForm({ name: '', type: 'cash', balance: '' });
      fetchAccounts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;

    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
    });
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">الحسابات</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة حساب
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">إضافة حساب جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="اسم الحساب"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Account['type'] })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="الرصيد الابتدائي"
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
              onClick={() => { setShowAdd(false); setForm({ name: '', type: 'cash', balance: '' }); }}
              className="flex items-center gap-2 bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition"
            >
              <X className="w-5 h-5" />
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            {editingId === account.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl py-2 px-3 text-white"
                  placeholder="اسم الحساب"
                />
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Account['type'] })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl py-2 px-3 text-white"
                >
                  {accountTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl py-2 px-3 text-white"
                  placeholder="الرصيد"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(account.id)} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg">
                    حفظ
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(account)} className="text-slate-400 hover:text-white transition">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(account.id)} className="text-slate-400 hover:text-red-400 transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{account.name}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {accountTypes.find(t => t.value === account.type)?.label}
                </p>
                <p className="text-2xl font-bold text-white">{formatCurrency(Number(account.balance))}</p>
              </>
            )}
          </div>
        ))}

        {accounts.length === 0 && !showAdd && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">لا توجد حسابات</p>
            <p className="text-sm mt-2">أضف حسابك الأول لبدء تسجيل معاملاتك</p>
          </div>
        )}
      </div>
    </div>
  );
}
