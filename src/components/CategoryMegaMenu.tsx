import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NavMenuDepartment } from '../lib/categoryNavTree';

type Props = {
  departments: NavMenuDepartment[];
  className?: string;
};

function l2GridClass(count: number): string {
  if (count >= 5) return 'grid grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-6';
  if (count >= 3) return 'grid grid-cols-2 gap-x-8 gap-y-6';
  return 'space-y-4';
}

function l1ColumnClass(l2Count: number): string {
  const base = 'shrink-0 border-r border-brand-gray/60 last:border-r-0 px-5 py-5';
  if (l2Count >= 5) return `${base} w-[min(100%,480px)]`;
  if (l2Count >= 3) return `${base} w-[min(100%,360px)]`;
  return `${base} w-[min(100%,240px)]`;
}

function NavProductCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 text-[10px] font-normal tabular-nums text-brand-navy/35">({count})</span>
  );
}

function MegaMenuPanel({ dept }: { dept: NavMenuDepartment }) {
  if (dept.l1Groups.length === 0) return null;

  return (
    <div className="mx-auto w-fit max-w-[min(calc(100vw-2rem),1280px)] bg-white border border-brand-gray shadow-2xl rounded-b-xl overflow-hidden">
      <div className="flex flex-row flex-nowrap items-start">
        {dept.l1Groups.map((l1) => (
          <div key={l1.id} className={l1ColumnClass(l1.children.length)}>
            <Link
              to={l1.href}
              className="block text-[11px] font-black uppercase tracking-widest text-brand-navy hover:text-brand-beige mb-4 pb-2 border-b border-brand-beige/30 whitespace-nowrap"
            >
              {l1.name}
            </Link>
            <div className={l2GridClass(l1.children.length)}>
              {l1.children.map((l2) => (
                <div key={l2.id} className="min-w-0">
                  <Link
                    to={l2.href}
                    className="block text-[12px] font-semibold text-brand-navy/90 hover:text-brand-beige mb-2 leading-snug"
                  >
                    {l2.name}
                    <NavProductCount count={l2.productCount} />
                  </Link>
                  {l2.children.length > 0 ? (
                    <ul className="space-y-1.5">
                      {l2.children.map((l3) => (
                        <li key={l3.id}>
                          <Link
                            to={l3.href}
                            className="text-[11px] text-brand-navy/55 hover:text-brand-navy transition-colors leading-snug block"
                          >
                            {l3.name}
                            <NavProductCount count={l3.productCount} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Desktop: nav department → full-width centered mega panel (no viewport overflow) */
export function CategoryMegaMenuDesktop({ departments, className = '' }: Props) {
  const [openDeptId, setOpenDeptId] = useState<string | null>(null);
  const openDept = departments.find((d) => d.id === openDeptId) ?? null;

  return (
    <nav
      className={`hidden lg:block relative border-b border-brand-border bg-brand-bg sticky top-20 z-40 ${className}`}
      onMouseLeave={() => setOpenDeptId(null)}
    >
      <div className="max-w-7xl mx-auto w-full px-4 flex items-center gap-1 text-[13px] font-semibold tracking-wide">
        <Link to="/category/sale" className="text-brand-accent hover:opacity-80 transition-opacity py-3 px-2 shrink-0">
          Sale
        </Link>
        <Link
          to="/brand-story"
          className="border-b border-transparent py-3 px-2 text-brand-navy/80 transition-colors hover:border-brand-beige/40 hover:text-brand-beige shrink-0"
        >
          Brand Story
        </Link>
        {departments.map((dept) => {
          const isOpen = openDeptId === dept.id;
          return (
            <div
              key={dept.id}
              className="py-3 px-2"
              onMouseEnter={() => setOpenDeptId(dept.id)}
            >
              <Link
                to={dept.href}
                className={`transition-colors flex items-center gap-1 whitespace-nowrap ${
                  isOpen ? 'text-brand-beige' : 'text-brand-navy hover:text-brand-beige'
                }`}
              >
                {dept.name}
                <ChevronDown
                  className={`w-3 h-3 opacity-40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {openDept ? (
        <div
          className="absolute top-full left-0 right-0 z-50 flex justify-center px-4 pb-3 pt-1"
          onMouseEnter={() => setOpenDeptId(openDept.id)}
        >
          <MegaMenuPanel dept={openDept} />
        </div>
      ) : null}
    </nav>
  );
}

/** Mobile accordion: department → L1 → L2 → L3 */
export function CategoryMobileNavTree({
  departments,
  onNavigate,
}: {
  departments: NavMenuDepartment[];
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1 text-sm">
      {departments.map((dept) => (
        <details key={dept.id} className="group border-b border-brand-gray/80 pb-2">
          <summary className="flex cursor-pointer list-none items-center justify-between py-2 font-semibold text-brand-navy marker:content-none">
            <span>{dept.name}</span>
            <ChevronDown className="h-4 w-4 opacity-40 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="pl-3 pb-2 space-y-3">
            {dept.l1Groups.map((l1) => (
              <details key={l1.id} className="group/l1">
                <summary className="flex cursor-pointer list-none items-center gap-1 py-1.5 text-[13px] font-medium text-brand-navy/90 marker:content-none">
                  <ChevronRight className="h-3.5 w-3.5 opacity-30 group-open/l1:rotate-90 transition-transform" />
                  <Link to={l1.href} onClick={onNavigate} className="hover:text-brand-beige">
                    {l1.name}
                  </Link>
                </summary>
                <div className="pl-5 space-y-2 pb-2">
                  {l1.children.map((l2) => (
                    <div key={l2.id}>
                      <Link
                        to={l2.href}
                        onClick={onNavigate}
                        className="block py-1 text-[12px] font-medium text-brand-navy/75 hover:text-brand-beige"
                      >
                        {l2.name}
                        <NavProductCount count={l2.productCount} />
                      </Link>
                      {l2.children.length > 0 ? (
                        <ul className="pl-3 mt-0.5 space-y-1">
                          {l2.children.map((l3) => (
                            <li key={l3.id}>
                              <Link
                                to={l3.href}
                                onClick={onNavigate}
                                className="text-[11px] text-brand-navy/50 hover:text-brand-navy"
                              >
                                {l3.name}
                                <NavProductCount count={l3.productCount} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

