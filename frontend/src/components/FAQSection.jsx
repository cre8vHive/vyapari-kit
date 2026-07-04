import React, { useState } from 'react';

const FAQSection = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300">
      <h2 className="text-2xl font-semibold text-slate-900">Frequently asked questions</h2>
      <div className="mt-6 space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question} className="overflow-hidden rounded-3xl border border-slate-200">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 text-left transition-all duration-300 hover:bg-slate-100"
              >
                <span className="text-left text-base font-semibold text-slate-900">{faq.question}</span>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${isOpen ? 'rotate-45 border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                  +
                </span>
              </button>
              <div className={`max-h-0 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 py-4 opacity-100' : 'opacity-0'}`}>
                <div className="px-5 pb-4 text-slate-600">{faq.answer}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;
