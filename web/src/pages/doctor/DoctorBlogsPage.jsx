import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Newspaper, Plus, Trash2, Pencil, Eye, Send, EyeOff } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Button, Input, Badge, Modal, Skeleton } from '../../components/ui/index.js';
import { blogApi } from '../../api/blogApi.js';
import { extractErrorMessage } from '../../api/client.js';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'movement', label: 'Movement' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'mental_health', label: 'Mental health' },
  { value: 'preventive_care', label: 'Preventive care' },
];

const emptyForm = () => ({ title: '', excerpt: '', content: '', category: 'general', tags: '', coverImageUrl: '' });

export function DoctorBlogsPage() {
  const [posts, setPosts] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    blogApi
      .listMine()
      .then((res) => setPosts(res.data.posts))
      .catch((err) => toast.error(extractErrorMessage(err)));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditingId(post._id);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: (post.tags || []).join(', '),
      coverImageUrl: post.coverImageUrl || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 8) next.title = 'Title must be at least 8 characters';
    if (form.excerpt.trim().length < 20) next.excerpt = 'Excerpt must be at least 20 characters';
    if (form.content.trim().length < 100) next.content = 'Post content must be at least 100 characters';
    if (form.coverImageUrl && !/^https?:\/\//.test(form.coverImageUrl)) {
      next.coverImageUrl = 'Cover image must be a valid URL';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        coverImageUrl: form.coverImageUrl || undefined,
      };
      if (editingId) {
        await blogApi.update(editingId, payload);
        toast.success('Blog post updated');
      } else {
        await blogApi.create(payload);
        toast.success('Blog post saved as draft');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this blog post permanently?')) return;
    try {
      await blogApi.remove(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Blog post deleted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const toggleStatus = async (post) => {
    try {
      const publish = post.status !== 'published';
      const res = await blogApi.setStatus(post._id, publish);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? res.data.post : p)));
      toast.success(publish ? 'Blog post published' : 'Blog post moved back to draft');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-charcoal flex items-center gap-2">
              <Newspaper className="text-teal-600" /> Health blog
            </h1>
            <p className="text-slate-600 text-sm">Share tips and articles with every PhoenixCare patient.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> New post
          </Button>
        </div>

        {posts === undefined ? (
          <Skeleton className="h-40 w-full" />
        ) : posts.length === 0 ? (
          <Card className="text-center py-14 text-slate-600">
            <p className="font-heading font-semibold text-charcoal mb-1">No posts yet</p>
            <p className="text-sm">Write your first health tip or article for patients.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post._id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-heading font-semibold text-charcoal truncate">{post.title}</p>
                    <Badge variant={post.status === 'published' ? 'success' : 'neutral'}>{post.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{post.excerpt}</p>
                  {post.status === 'published' && (
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <Eye size={12} /> {post.views} views ·{' '}
                      <Link to={`/blog/${post.slug}`} className="text-teal-600 hover:underline">
                        View live
                      </Link>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(post)}>
                    {post.status === 'published' ? <EyeOff size={14} /> : <Send size={14} />}
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(post)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(post._id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit post' : 'New blog post'} className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
          />
          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Excerpt (shown in listings)</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
            />
            {errors.excerpt && <p className="mt-1 text-xs text-error">{errors.excerpt}</p>}
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Content</label>
            <textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
            />
            {errors.content && <p className="mt-1 text-xs text-error">{errors.content}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-charcoal">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          </div>
          <Input
            label="Cover image URL (optional)"
            placeholder="https://..."
            value={form.coverImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            error={errors.coverImageUrl}
          />
          <Button type="submit" loading={saving} className="w-full">
            {editingId ? 'Save changes' : 'Save as draft'}
          </Button>
        </form>
      </Modal>
    </PageTransition>
  );
}
