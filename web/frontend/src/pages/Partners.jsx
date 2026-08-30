import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Handshake, ExternalLink, MessageCircle } from "lucide-react";

export default function Partners() {
  const { data } = useQuery({ queryKey: ["partners"], queryFn: () => api.get("/partners").then((r) => r.data) });
  const list = data?.partners || [];

  return (
    <div className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center"><Handshake className="w-4 h-4 text-white" /></span>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">合作商家</h1>
        <span className="text-sm text-gray-400 ml-1">共 {list.length} 家</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
          <div key={p.id} data-testid={`partner-${p.id}`} className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 rounded-md bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shrink-0">{p.webname.slice(0, 1)}</span>
              <div className="min-w-0">
                <div className="font-black text-gray-900 truncate">{p.webname}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> QQ {p.qq}</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 min-h-[3.75rem]">{p.content}</p>
            <a href={p.weburl} data-testid={`partner-link-${p.id}`} className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-red-600 hover:text-red-700">
              访问网站 <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
