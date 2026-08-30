import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Windowed page numbers around current page.
function pageWindow(current, total, size = 11) {
  let start = Math.max(1, current - Math.floor(size / 2));
  let end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export const Pagination = ({ page, totalPages, totalRecords, onChange }) => {
  const pages = pageWindow(page, totalPages);

  const Cell = ({ children, active, disabled, onClick, testId }) => (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-w-8 h-8 px-2 rounded-sm border text-xs font-semibold font-mono tabular-nums transition-all active:scale-95",
        active
          ? "bg-red-600 text-white border-red-600 shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600",
        disabled && "opacity-40 cursor-not-allowed hover:border-gray-200 hover:text-gray-600"
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      data-testid="pagination"
      className="flex flex-wrap items-center justify-center gap-1.5 py-5 text-xs text-gray-500"
    >
      <span className="mr-2 whitespace-nowrap">
        共 <span className="font-bold font-mono text-red-600 tabular-nums">{totalRecords.toLocaleString("en-US")}</span> 记录
        <span className="mx-1">·</span>
        共 <span className="font-bold font-mono text-gray-900 tabular-nums">{totalPages}</span> 页
      </span>

      <Cell testId="page-prev" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="w-3.5 h-3.5 inline" />
      </Cell>

      {pages[0] > 1 && (
        <>
          <Cell testId="page-1" onClick={() => onChange(1)}>1</Cell>
          <span className="px-1 text-gray-400">…</span>
        </>
      )}

      {pages.map((p) => (
        <Cell key={p} testId={`page-${p}`} active={p === page} onClick={() => onChange(p)}>
          {p}
        </Cell>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          <span className="px-1 text-gray-400">…</span>
          <Cell testId={`page-${totalPages}`} onClick={() => onChange(totalPages)}>{totalPages}</Cell>
        </>
      )}

      <Cell testId="page-next" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        下一页 <ChevronRight className="w-3.5 h-3.5 inline" />
      </Cell>
    </div>
  );
};
