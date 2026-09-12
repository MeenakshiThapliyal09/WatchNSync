const sections = [
  ['Information', 'This page will describe what information WatchNSync needs to provide rooms and shared viewing.'],
  ['Use of information', 'This page will explain how any information used by the service supports its core features.'],
  ['Updates', 'The privacy notice will be updated with complete details before the product is released.'],
]

export function PrivacyPage() {
  return <LegalPage title="Privacy" intro="A placeholder for WatchNSync’s privacy notice." sections={sections} />
}

function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: string[][] }) {
  return <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24"><p className="text-sm font-semibold tracking-wide text-sky-700">WATCHNSYNC</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-4 leading-7 text-slate-600">{intro}</p><div className="mt-10 space-y-8">{sections.map(([heading, content]) => <article key={heading}><h2 className="text-lg font-semibold text-slate-950">{heading}</h2><p className="mt-2 leading-7 text-slate-600">{content}</p></article>)}</div></section>
}
