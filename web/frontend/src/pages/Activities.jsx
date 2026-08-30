import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CalendarDays, Gift } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function Activities() {
  const { data } = useQuery({ queryKey: ["activities"], queryFn: () => api.get("/activities").then((r) => r.data) });
  const list = data?.activities || [];
  const [active, setActive] = useState(null);

  return (
    <div className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center"><Gift className="w-4 h-4 text-white" /></span>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">活动专区</h1>
        <span className="text-sm text-gray-400 ml-1">共 {list.length} 个活动</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((a) => (
          <button key={a.id} data-testid={`activity-${a.id}`} onClick={() => setActive(a)} className="text-left rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="h-28 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 flex items-center justify-center p-4">
              <span className="text-white font-black text-lg text-center drop-shadow">{a.title}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1 text-xs text-gray-400 font-mono mb-2">
                <CalendarDays className="w-3.5 h-3.5" /> {a.mintime} ~ {a.maxtime}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
              <span className="inline-block mt-3 text-xs font-bold text-red-600">查看活动 〉〉</span>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent data-testid="activity-dialog" className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription className="font-mono">活动时间:{active?.mintime} ~ {active?.maxtime}</DialogDescription>
          </DialogHeader>
          <div className="h-32 rounded-md bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-black text-xl text-center px-4">{active?.title}</div>
          {active?.body ? (
            <div
              data-testid="activity-rich-body"
              className="activity-rich text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: active.body }}
            />
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">{active?.content}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
