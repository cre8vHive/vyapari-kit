import React from 'react';

interface StickySidebarProps {
  price: number;
  oldPrice: number;
  includes: string[];
}

const StickySidebar: React.FC<StickySidebarProps> = ({ price, oldPrice, includes }) => {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Enroll today</p>
        <div className="mt-3 flex items-end gap-3">
          <span className="text-3xl font-semibold text-slate-900">${price}</span>
          <span className="text-lg text-slate-400 line-through">${oldPrice}</span>
        </div>
        <button className="mt-5 w-full rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Enroll Now</button>
        <div className="mt-5 space-y-3 text-sm text-slate-700">
          {includes.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default StickySidebar;
