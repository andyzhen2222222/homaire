import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NavMenuDepartment } from '../lib/categoryNavTree';

type Props = {
  departments: NavMenuDepartment[];
  className?: string;
};

/** Desktop: nav department → L1 columns → L2 headers → L3 links */
export function CategoryMegaMenuDesktop({ departments, className = '' }: Props) {
  return (
    <nav className={`hidden lg:flex border-b border-brand-border bg-brand-bg sticky top-20 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto w-full px-4 flex items-center gap-1 text-[13px] font-semibold tracking-wide">
        <Link to="/category/sale" className="text-brand-accent hover:opacity-80 transition-opacity py-3 px-2 shrink-0">
          Sale
        </Link>
        <Link
          to="/brand-story"
          className="border-b border-transparent py-3 px-2 text-brand-navy/80 transition-colors hover:text-brand-beige shrink-0"
        >
          Brand Story
        </Link>
        {departments.map((dept) => (
          <div key={dept.id} className="relative group/nav py-3 px-2">
            <Link
              to={dept.href}
              className="text-brand-navy hover:text-brand-beige transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              {dept.name}
              <ChevronDown className="w-3 h-3 opacity-40 group-hover/nav:rotate-180 transition-transform" />
            </Link>

            <div className="absolute top-full left-0 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-200 z-50">
              <div className="bg-white border border-brand-gray shadow-2xl rounded-b-xl overflow-hidden min-w-[640px] max-w-[min(960px,calc(100vw-2rem))]">
                <div className="flex max-h-[min(70vh,520px)] overflow-y-auto">
                  {dept.l1Groups.map((l1) => (
                    <div
                      key={l1.id}
                      className="flex-1 min-w-[200px] border-r border-brand-gray/60 last:border-r-0 p-5"
                    >
                      <Link
                        to={l1.href}
                        className="block text-[11px] font-black uppercase tracking-widest text-brand-navy hover:text-brand-beige mb-4 pb-2 border-b border-brand-beige/30"
                      >
                        {l1.name}
                      </Link>
                      <div className="space-y-5">
                        {l1.children.map((l2) => (
                          <div key={l2.id}>
                            <Link
                              to={l2.href}
                              className="block text-[12px] font-semibold text-brand-navy/90 hover:text-brand-beige mb-2"
                            >
                              {l2.name}
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
            </div>
          </div>
        ))}
      </div>
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
