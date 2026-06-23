import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../lib/definitions';
import { Tags, Plus, Trash2, CreditCard as Edit2, X, Check } from 'lucide-react';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'];

const icons = ['circle', 'star', 'heart', 'home', 'car', 'shopping-cart', 'utensils', 'plane', 'gift', 'book', 'music', 'film', 'gamepad-2', 'smartphone', 'shirt', 'briefcase', 'building', 'landmark', 'wallet', 'credit-card'];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [form, setForm] = useState({ name: '', type: 'expense' as const, icon: 'circle', color: '#6366f1' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setCategories(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.name) return;

    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      name: form.name,
      type: form.type,
      icon: form.icon,
      color: form.color,
    });

    if (!error) {
      setShowAdd(false);
      setForm({ name: '', type: 'expense', icon: 'circle', color: '#6366f1' });
      fetchCategories();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .update({
        name: form.name,
        type: form.type,
        icon: form.icon,
        color: form.color,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setForm({ name: '', type: 'expense', icon: 'circle', color: '#6366f1' });
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
  };

  const filteredCategories = filter === 'all'
    ? categories
    : categories.filter(c => c.type === filter);

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
        <h2 className="text-2xl font-bold text-white">التصنيفات</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة تصنيف
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              filter === t
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t === 'all' ? 'الكل' : t === 'income' ? 'إيرادات' : 'مصروفات'}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">إضافة تصنيف جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="اسم التصنيف"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Category['type'] })}
              className="bg-slate-700/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="expense">مصروفات</option>
              <option value="income">إيرادات</option>
            </select>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">اللون</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-lg transition ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              onClick={() => { setShowAdd(false); setForm({ name: '', type: 'expense', icon: 'circle', color: '#6366f1' }); }}
              className="flex items-center gap-2 bg-slate-700 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600 transition"
            >
              <X className="w-5 h-5" />
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            {editingId === category.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white"
                  placeholder="اسم التصنيف"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(category.id)} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg">
                    حفظ
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <Tags className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{category.name}</p>
                    <p className="text-slate-400 text-sm">
                      {category.type === 'income' ? 'إيرادات' : 'مصروفات'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(category)} className="text-slate-400 hover:text-white transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="text-slate-400 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && !showAdd && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Tags className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">لا توجد تصنيفات</p>
            <p className="text-sm mt-2">أضف تصنيفات لتنظيم معاملاتك</p>
          </div>
        )}
      </div>
    </div>
  );
}
