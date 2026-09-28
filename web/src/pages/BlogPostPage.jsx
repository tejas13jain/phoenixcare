import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Eye, ChevronLeft } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Card, Badge, Skeleton } from '../components/ui/index.js';
import { blogApi } from '../api/blogApi.js';
import { extractErrorMessage } from '../api/client.js';

export function BlogPostPage() {
  const { slug } = useParams();
  const [data, setData] = useState(undefined);

  useEffect(() => {
    setData(undefined);
    blogApi
      .getBySlug(slug)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)));
  }, [slug]);

  if (data === undefined) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const { post, related } = data;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/blog" className="flex items-center gap-1 text-sm text-teal-600 hover:underline mb-6">
          <ChevronLeft size={16} /> Back to blog
        </Link>

        <Badge variant="teal" className="mb-3 capitalize">
          {post.category.replace('_', ' ')}
        </Badge>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-charcoal mb-3">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-8">
          <span>By {post.author?.user?.name}</span>
          <span className="flex items-center gap-1">
            <Clock size={14} /> {post.readTimeMinutes} min read
          </span>
          <span className="flex items-center gap-1">
            <Eye size={14} /> {post.views} views
          </span>
        </div>

        {post.coverImageUrl && (
          <img src={post.coverImageUrl} alt={post.title} className="rounded-2xl w-full h-64 object-cover mb-8" />
        )}

        <div className="prose prose-slate max-w-none text-charcoal whitespace-pre-line leading-relaxed">{post.content}</div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {post.tags.map((t) => (
              <Badge key={t} variant="neutral">
                #{t}
              </Badge>
            ))}
          </div>
        )}

        {related?.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading font-semibold text-lg text-charcoal mb-4">More on this topic</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r._id} to={`/blog/${r.slug}`}>
                  <Card hoverLift className="h-full">
                    <p className="font-medium text-sm text-charcoal line-clamp-2">{r.title}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
