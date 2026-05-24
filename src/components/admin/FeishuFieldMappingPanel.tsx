import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Table2 } from 'lucide-react';
import {
  FEISHU_CLI_SETUP,
  FEISHU_IMPORT_FIELD_SPECS,
  FEISHU_SYNC_USAGE_STEPS,
  GIGA_SHORT_DESCRIPTION_RULES,
} from '../../lib/feishuImportFieldMapping';

export function FeishuFieldMappingPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 bg-white px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
          <BookOpen className="h-4 w-4 text-[#409eff]" />
          飞书字段映射与使用说明
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>
      {!open ? (
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          固定映射：飞书列名 → 商品字段（name / features / detailHtml 等）。展开查看完整表与 GIGA 简短描述规则。
        </p>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-5">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              同步流程
            </h4>
            <ol className="space-y-2">
              {FEISHU_SYNC_USAGE_STEPS.map((item) => (
                <li key={item.step} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ecf5ff] text-[10px] font-bold text-[#409eff]">
                    {item.step}
                  </span>
                  <div>
                    <span className="font-medium text-slate-800">{item.title}：</span>
                    {item.body}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Table2 className="h-3.5 w-3.5" />
              字段映射表（固定）
            </h4>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100 text-left text-[11px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-2 font-semibold text-slate-600 whitespace-nowrap">系统字段</th>
                    <th className="px-2 py-2 font-semibold text-slate-600">飞书列名（别名）</th>
                    <th className="px-2 py-2 font-semibold text-slate-600 min-w-[200px]">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {FEISHU_IMPORT_FIELD_SPECS.map((spec) => (
                    <tr key={spec.targetKey} className="align-top hover:bg-slate-50/80">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-800">
                          {spec.targetKey}
                        </code>
                        {spec.required ? (
                          <span className="ml-1 text-[9px] font-bold text-red-600">必填</span>
                        ) : null}
                        <div className="mt-0.5 text-[10px] text-slate-500">{spec.targetLabel}</div>
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        <div className="flex flex-wrap gap-1">
                          {spec.aliases.map((a) => (
                            <code
                              key={a}
                              className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] text-slate-600"
                            >
                              {a}
                            </code>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-slate-600 leading-snug">{spec.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              另支持列名模式：<code className="text-[9px]">主图</code>、
              <code className="text-[9px]">原图片1</code>…<code className="text-[9px]">原图片8</code>（优先作列表主图）、
              <code className="text-[9px]">图片1</code>…<code className="text-[9px]">图片8</code> 自动并入 images。
            </p>
          </section>

          <section className="rounded border border-amber-100 bg-amber-50/60 p-3">
            <h4 className="mb-2 text-xs font-semibold text-amber-900">{GIGA_SHORT_DESCRIPTION_RULES.title}</h4>
            <ul className="space-y-1.5">
              {GIGA_SHORT_DESCRIPTION_RULES.rows.map((row) => (
                <li key={row.range} className="text-[11px] text-amber-950 leading-relaxed">
                  <span className="font-medium">{row.range}</span>
                  <span className="text-amber-800"> → </span>
                  <code className="rounded bg-white/80 px-1 text-[10px]">{row.mapsTo}</code>
                  <span className="text-amber-900/80"> — {row.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold text-slate-500">CLI / 开发环境</h4>
            <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-600">
              {FEISHU_CLI_SETUP.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
