import React, { useState } from 'react';

interface Lecture {
  title: string;
  duration: string;
}

interface CourseContentProps {
  content: Array<{ title: string; lectures: Lecture[] }>;
}

const CourseContent: React.FC<CourseContentProps> = ({ content }) => {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Course content</h2>
          <p className="mt-2 text-sm text-slate-500">A structured roadmap from fundamentals to portfolio-ready work.</p>
        </div>
        <div className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">9 lectures</div>
      </div>
      <div className="mt-6 space-y-4">
        {content.map((section, index) => {
          const isOpen = openSections[index] ?? false;
          return (
            <div key={section.title} className="overflow-hidden rounded-[20px] border border-slate-200">
              <button className="flex w-full items-center justify-between bg-slate-50 px-4 py-4 text-left" onClick={() => toggleSection(index)} type="button">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Section {index + 1}</p>
                  <p className="text-base font-semibold text-slate-900">{section.title}</p>
                </div>
                <span className="text-lg text-slate-500">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="space-y-2 bg-white p-3">
                  {section.lectures.map((lecture) => (
                    <div key={lecture.title} className="flex items-center justify-between rounded-[14px] border border-slate-100 px-3 py-3 text-sm text-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-sky-600">▶</span>
                        <span>{lecture.title}</span>
                      </div>
                      <span className="text-slate-500">{lecture.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CourseContent;
