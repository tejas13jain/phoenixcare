import { Link } from 'react-router-dom';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Button } from '../components/ui/index.js';
import { PhoenixIcon } from '../assets/logo/PhoenixIcon.jsx';

export function NotFoundPage() {
  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4">
        <PhoenixIcon size={72} />
        <h1 className="font-heading font-bold text-3xl mt-6">Page not found</h1>
        <p className="text-slate-600 mt-2 mb-6">The page you're looking for has flown elsewhere.</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </PageTransition>
  );
}
