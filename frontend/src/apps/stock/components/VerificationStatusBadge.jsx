import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';

export default function VerificationStatusBadge({ status }) {
  if (status === 'VERIFIED_SUCCESS') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm"><CheckCircle2 size={12}/> 적중</span>;
  }
  if (status === 'VERIFIED_FAIL') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-sm"><XCircle size={12}/> 실패</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-sm"><CircleDashed size={12}/> 검증중</span>;
}
