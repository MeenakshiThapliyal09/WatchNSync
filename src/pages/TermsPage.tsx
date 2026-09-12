const sections = [
  ['Using WatchNSync', 'This page will outline the terms that apply to using WatchNSync and its shared viewing rooms.'],
  ['Third-party content', 'YouTube content and services remain subject to their own applicable terms and policies.'],
  ['Updates', 'The complete terms will be provided before the product is released.'],
]

export function TermsPage() {
  return <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24"><p className="text-sm font-semibold tracking-wide text-sky-700">WATCHNSYNC</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Terms</h1><p className="mt-4 leading-7 text-slate-600">A placeholder for WatchNSync’s terms of use.</p><div className="mt-10 space-y-8">{sections.map(([heading, content]) => <article key={heading}><h2 className="text-lg font-semibold text-slate-950">{heading}</h2><p className="mt-2 leading-7 text-slate-600">{content}</p></article>)}</div></section>
}
