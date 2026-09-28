import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Clock } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Card, Badge, Skeleton, Button } from '../components/ui/index.js';
import { blogApi } from '../api/blogApi.js';
import { extractErrorMessage } from '../api/client.js';

const CATEGORIES = [
  { value: '', label: 'All topics' },
  { value: 'general', label: 'General' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'movement', label: 'Movement' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'mental_health', label: 'Mental health' },
  { value: 'preventive_care', label: 'Preventive care' },
];

export function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState(undefined);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    setPosts(undefined);
    const params = { page };
    if (category) params.category = category;
    blogApi
      .list(params)
      .then((res) => {
        setPosts(res.data.posts);
        setPagination(res.data.pagination);
      })
      .catch((err) => toast.error(extractErrorMessage(err)));
  }, [category, page]);

  const setCategory = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value);
    else next.delete('category');
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <PageTransition>
      <section className="bg-phoenix-gradient text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl flex items-center justify-center gap-3">
            <BookOpen /> PhoenixCare Health Blog
          </h1>
          <p className="mt-3 text-white/90">Doctor-written tips on nutrition, sleep, movement, and preventive care.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                category === c.value ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-600/15'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {posts === undefined ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-14 text-slate-600">No articles in this topic yet — check back soon.</Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-5">
              {posts.map((post) => (
                <Link key={post._id} to={`/blog/${post.slug}`}>
                  <Card hoverLift className="h-full flex flex-col">
                    <Badge variant="teal" className="w-fit mb-2 capitalize">
                      {post.category.replace('_', ' ')}
                    </Badge>
                    <p className="font-heading font-semibold text-charcoal mb-1">{post.title}</p>
                    <p className="text-sm text-slate-600 line-clamp-2 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
                      <span>By {post.author?.user?.name}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {post.readTimeMinutes} min read
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={pagination.page === i + 1 ? 'primary' : 'ghost'}
                    onClick={() => setSearchParams((p) => ({ ...Object.fromEntries(p), page: i + 1 }))}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
