import React from 'react';

interface CourseOverviewProps {
  description: string;
  whatYoullLearn: string[];
  skills: string[];
  requirements: string[];
  audience: string[];
}

const CourseOverview: React.FC<CourseOverviewProps> = ({ description, whatYoullLearn, skills, requirements, audience }) => {
  const renderList = (items: string[]) => (
    <ul className="space-y-3 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Course overview</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">What you will learn</h3>
            <div className="mt-4">{renderList(whatYoullLearn)}</div>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Skills you will gain</h3>
            <div className="mt-4">{renderList(skills)}</div>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Requirements</h3>
            <div className="mt-4">{renderList(requirements)}</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Who this course is for</h3>
            <div className="mt-4">{renderList(audience)}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
