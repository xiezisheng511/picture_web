import { Link } from 'react-router-dom';
import type { Tool } from '@/types';

export default function ToolCard({ tool, icon }: Tool & { icon: string }) {
  return (
    <Link
      to={tool.path}
      className="group block bg-white rounded-xl border border-gray-100 p-6 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
        {tool.zhTitle}
        <span className="text-gray-400 font-normal text-base ml-2">/ {tool.enTitle}</span>
      </h3>
      <p className="text-sm text-gray-600">{tool.zhDesc}</p>
      <p className="text-xs text-gray-400 mt-1">{tool.enDesc}</p>
    </Link>
  );
}