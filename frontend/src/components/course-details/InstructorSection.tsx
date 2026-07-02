import React from 'react';

interface InstructorSectionProps {
  instructor: string;
  instructorTitle: string;
  instructorBio: string;
  instructorStudents: number;
  instructorRating: number;
  instructorCourses: number;
}

const InstructorSection: React.FC<InstructorSectionProps> = ({ instructor, instructorTitle, instructorBio, instructorStudents, instructorRating, instructorCourses }) => {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-sky-100">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80" alt={instructor} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">{instructor}</h2>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">{instructorTitle}</span>
          </div>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{instructorBio}</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="rounded-full bg-slate-50 px-3 py-2">{instructorStudents.toLocaleString()} students</div>
            <div className="rounded-full bg-slate-50 px-3 py-2">⭐ {instructorRating.toFixed(1)} rating</div>
            <div className="rounded-full bg-slate-50 px-3 py-2">{instructorCourses} courses</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorSection;
