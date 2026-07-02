import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] lg:p-8">
      <h2 className="text-2xl font-semibold text-slate-900">Frequently asked questions</h2>
      <div className="mt-6 space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question} className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50">
              <button className="flex w-full items-center justify-between px-4 py-4 text-left" onClick={() => setOpenIndex(isOpen ? null : index)} type="button">
                <span className="font-semibold text-slate-900">{faq.question}</span>
                <span className="text-lg text-sky-600">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="px-4 pb-4 text-sm leading-7 text-slate-600">{faq.answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;
