import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';

export default function VerificationStatusBadge({ status }) {
  if (status === 'VERIFIED_SUCCESS') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={12}/> 적중</span>;
  }
  if (status === 'VERIFIED_FAIL') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle size={12}/> 실패</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700"><CircleDashed size={12}/> 검증 중</span>;
}
