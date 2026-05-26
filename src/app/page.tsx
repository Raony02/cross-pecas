'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type Brand = { id: number; name: string; slug: string };
type Model = { id: number; name: string; slug: string; year_start: number; year_end: number | null };
type Part = { id: number; name: string; category: string; ref_number: string | null; avg_price: number | null };
type Compatibility = {
  id: number;
  part_name: string;
  part_category: string;
  part_ref: string | null;
  original_price: number | null;
  compatible_model: string;
  compatible_price: number | null;
  savings_percent: number | null;
  source: string | null;
  slug: string;
};

type Adaptation = {
  id: number;
  part_name: string;
  title: string;
  description: string;
  donor_model: string;
  donor_brand: string;
  difficulty: string;
  votes: number;
};

const categoryIcons: Record<string, string> = {
  Suspensão: '\u2699',
  Freio: '\u26a0',
  Motor: '\u26a1',
  Transmissão: '\u2691',
};

export default function Home() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [results, setResults] = useState<Compatibility[]>([]);
  const [adaptations, setAdaptations] = useState<Adaptation[]>([]);
  const [activeTab, setActiveTab] = useState<'compat' | 'adapt'>('compat');

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [donors, setDonors] = useState<string[]>([]);
  const [donorName, setDonorName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', donorBrand: '', donorModel: '', difficulty: 'Fácil' });

  useEffect(() => {
    fetch('/api/search?action=brands').then(r => r.json()).then(d => { setBrands(d); setBrandsLoaded(true); });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('crosspecas-donors');
    if (stored) setDonors(JSON.parse(stored));
  }, []);

  const loadModels = useCallback((brandSlug: string) => {
    setSelectedModel('');
    setSelectedPart('');
    setParts([]);
    setResults([]);
    setSearched(false);
    fetch(`/api/search?action=models&brand=${brandSlug}`).then(r => r.json()).then(setModels);
  }, []);

  const loadParts = useCallback((modelSlug: string) => {
    setSelectedPart('');
    setResults([]);
    setSearched(false);
    fetch(`/api/search?action=parts&model=${modelSlug}`).then(r => r.json()).then(setParts);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedPart) return;
    setLoading(true);
    setSearched(false);
    setActiveTab('compat');
    try {
      const [compatRes, adaptRes] = await Promise.all([
        fetch(`/api/search?action=compatibilities&partId=${selectedPart}`),
        fetch(`/api/search?action=adaptations&partId=${selectedPart}`),
      ]);
      setResults(await compatRes.json());
      setAdaptations(await adaptRes.json());
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [selectedPart]);

  const selectedPartData = parts.find(p => String(p.id) === selectedPart);
  const bestSaving = results.length > 0 ? Math.max(...results.map(r => r.savings_percent ?? 0)) : 0;

  const handleVote = useCallback(async (id: number, delta: number) => {
    setAdaptations(prev => prev.map(a => a.id === id ? { ...a, votes: a.votes + delta } : a));
    await fetch('/api/search?action=vote', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta }),
    }).catch(() => setAdaptations(prev => prev.map(a => a.id === id ? { ...a, votes: a.votes - delta } : a)));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !form.title.trim()) return;
    const res = await fetch('/api/search?action=submit-adaptation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, partId: Number(selectedPart) }),
    });
    if (res.ok) {
      setForm({ title: '', description: '', donorBrand: '', donorModel: '', difficulty: 'Fácil' });
      setShowForm(false);
      fetch(`/api/search?action=adaptations&partId=${selectedPart}`).then(r => r.json()).then(setAdaptations);
    }
  }, [selectedPart, form]);

  return (
    <div className="min-h-screen bg-[#08080e]">
      {/* NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-[#08080e]/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-[#08080e] font-bold text-lg shadow-lg shadow-emerald-500/20">
              X
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">CrossPeças</span>
          </div>
          <span className="text-xs text-[#555570] hidden sm:block">Beta</span>
        </div>
      </header>

      <main className="pt-16">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
            <div className="absolute top-[-200px] right-[-200px] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Economia real na manutenção
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white mb-5">
              A mesma peça,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400">
                muito menos
              </span>
              <br className="hidden sm:block" />
              pelo seu carro
            </h1>

            <p className="text-lg sm:text-xl text-[#8888a0] max-w-2xl mx-auto leading-relaxed mb-10">
              Descubra em segundos qual carro popular usa a mesma peça que o seu.
              Pare de pagar premium por peças idênticas.
            </p>

            {/* SEARCH CARD */}
            <div className="max-w-3xl mx-auto bg-[#0d0d1a]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 sm:p-7 shadow-[0_0_60px_rgba(52,211,153,0.06)]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="relative">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#555570] mb-1.5 ml-0.5">
                    Marca
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all hover:bg-white/[0.06]"
                      value={selectedBrand}
                      onChange={e => { setSelectedBrand(e.target.value); loadModels(e.target.value); }}
                    >
                      <option value="">Selecione</option>
                      {brands.map(b => <option key={b.id} value={b.slug}>{b.name}</option>)}
                    </select>
                    <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555570]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#555570] mb-1.5 ml-0.5">
                    Modelo
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06]"
                      value={selectedModel}
                      disabled={!selectedBrand}
                      onChange={e => { setSelectedModel(e.target.value); loadParts(e.target.value); }}
                    >
                      <option value="">Selecione</option>
                      {models.map(m => (
                        <option key={m.id} value={m.slug}>
                          {m.name} ({m.year_start}{m.year_end ? `-${m.year_end}` : '+'})
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555570]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#555570] mb-1.5 ml-0.5">
                    Peça
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06]"
                      value={selectedPart}
                      disabled={!selectedModel}
                      onChange={e => setSelectedPart(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.ref_number ? `(${p.ref_number})` : ''}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555570]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={!selectedPart || loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-semibold text-sm text-white tracking-wide transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Buscando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Ver compatibilidades
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-6xl mx-auto px-5 pb-16 md:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: '01', title: 'Selecione seu carro', desc: 'Escolha a marca, o modelo e o ano do seu veículo.' },
              { n: '02', title: 'Escolha a peça', desc: 'Selecione qual peça você precisa trocar no momento.' },
              { n: '03', title: 'Economize', desc: 'Veja qual carro popular usa a mesma peça por menos da metade do preço.' },
            ].map((s, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-6 h-full">
                  <div className="text-3xl font-bold text-white/[0.04] mb-3 leading-none">{s.n}</div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{s.title}</h3>
                  <p className="text-[#8888a0] text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SUPPORT */}
        <section className="max-w-lg mx-auto px-5 pb-16 text-center">
          <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Apoie o projeto</h3>
            <p className="text-[#8888a0] text-sm mb-5">
              Ajude a manter o CrossPeças no ar com qualquer valor via Pix
            </p>
            <img
              src="/pix.png"
              alt="QR Code Pix"
              className="w-48 h-48 mx-auto rounded-xl border border-white/[0.06] bg-white p-2 mb-5"
            />
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555570] mb-1.5">Chave Pix (copia e cola)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-[#8888a0] font-mono break-all select-all bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.04]">
                  00020126360014BR.GOV.BCB.PIX0114+55919899440125204000053039865802BR5925Raony Hermano Souza de So6009SAO PAULO62140510USJuEN6XEI6304F42C
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('00020126360014BR.GOV.BCB.PIX0114+55919899440125204000053039865802BR5925Raony Hermano Souza de So6009SAO PAULO62140510USJuEN6XEI6304F42C');
                    const btn = document.getElementById('copy-pix-btn');
                    if (btn) { btn.textContent = 'Copiado!'; setTimeout(() => { btn.textContent = 'Copiar'; }, 2000); }
                  }}
                  id="copy-pix-btn"
                  className="shrink-0 px-3 py-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* DONOR INPUT */}
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <p className="text-xs text-[#555570] mb-3">Doou? Deixe seu nome como colaborador</p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const name = donorName.trim();
                  if (!name) return;
                  const updated = [...donors, name];
                  setDonors(updated);
                  localStorage.setItem('crosspecas-donors', JSON.stringify(updated));
                  setDonorName('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  placeholder="Seu nome"
                  maxLength={40}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555570] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  Enviar
                </button>
              </form>

              {donors.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {donors.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs text-emerald-400/80 bg-emerald-500/8 border border-emerald-500/15 rounded-full px-3 py-1"
                    >
                      {name} colaborou <span className="text-red-400">❤️</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RESULTS */}
        {searched && (
          <section className="max-w-4xl mx-auto px-5 pb-20 animate-fade-in-up">
            {/* TABS */}
            <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-6 w-fit">
              <button
                onClick={() => setActiveTab('compat')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'compat'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                    : 'text-[#8888a0] hover:text-white'
                }`}
              >
                Compatíveis · {results.length}
              </button>
              <button
                onClick={() => setActiveTab('adapt')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'adapt'
                    ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                    : 'text-[#8888a0] hover:text-white'
                }`}
              >
                Adaptações · {adaptations.length}
              </button>
            </div>

            {/* COMPATIBILITIES TAB */}
            {activeTab === 'compat' && (
              results.length === 0 ? (
                <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#555570]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-[#8888a0] font-medium mb-1">Somente a peça original</p>
                  <p className="text-white text-lg font-bold mb-2">
                    {selectedPartData?.avg_price ? `R$ ${selectedPartData.avg_price.toFixed(0).replace('.', ',')}` : '—'}
                  </p>
                  <p className="text-[#555570] text-sm">Veja a aba <span className="text-purple-400 font-medium">Adaptações</span> para alternativas.</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Peças compatíveis</h2>
                      <p className="text-[#8888a0] text-sm mt-1">
                        {results.length} alternativa{results.length > 1 ? 's' : ''} · economia de até <span className="text-emerald-400 font-semibold">{bestSaving}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {results.map((r, i) => (
                      <div
                        key={r.id}
                        className="group bg-[#0d0d1a] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:bg-[#12122a] hover:border-white/[0.10] transition-all duration-200"
                        style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                {r.part_category}
                              </span>
                              {r.part_ref && (
                                <span className="text-[11px] font-mono text-[#555570]">{r.part_ref}</span>
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{r.part_name}</h3>
                            <p className="text-sm text-[#8888a0] mt-0.5">
                              Usar peça do{' '}
                              <span className="text-cyan-400 font-medium">{r.compatible_model}</span>
                              {r.source && <span className="text-[#555570]"> · {r.source}</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555570] mb-0.5">Original</p>
                              <p className="text-sm text-[#555570] line-through">
                                {r.original_price ? `R$ ${r.original_price.toFixed(0).replace('.', ',')}` : '—'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-0.5">Compatível</p>
                              <p className="text-white font-bold text-base sm:text-lg">
                                {r.compatible_price ? `R$ ${r.compatible_price.toFixed(0).replace('.', ',')}` : '—'}
                              </p>
                            </div>
                            {r.savings_percent && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-center min-w-[72px]">
                                <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400/70">Economia</p>
                                <p className="text-emerald-400 font-extrabold text-lg sm:text-xl leading-tight">{Math.round(r.savings_percent)}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ADAPTATIONS TAB */}
            {activeTab === 'adapt' && (
              adaptations.length === 0 ? (
                <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#555570]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <p className="text-[#8888a0] font-medium mb-1.5">Nenhuma adaptação cadastrada</p>
                  <p className="text-[#555570] text-sm">Se souber de alguma adaptação, contribua com a comunidade!</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-5 px-5 py-2.5 text-sm font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
                  >
                    + Contribuir
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {adaptations.map((a, i) => (
                    <div
                      key={a.id}
                      className="bg-[#0d0d1a] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:bg-[#12122a] hover:border-white/[0.10] transition-all duration-200"
                      style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          a.difficulty === 'Fácil' ? 'bg-emerald-500/15 text-emerald-400' :
                          a.difficulty === 'Média' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {a.difficulty === 'Fácil' ? 'F' : a.difficulty === 'Média' ? 'M' : 'D'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-base font-semibold text-white">{a.title}</h3>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#555570] bg-white/[0.04] px-2 py-0.5 rounded-full">
                              {a.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-[#8888a0] leading-relaxed mb-2">{a.description}</p>
                          <div className="flex items-center gap-3 text-xs text-[#555570]">
                            <span>Doador: <span className="text-cyan-400">{a.donor_brand} {a.donor_model}</span></span>
                          </div>
                        </div>
                        {/* Vote buttons */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => handleVote(a.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 text-[#555570] hover:text-emerald-400 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                          </button>
                          <span className="text-xs font-semibold text-[#8888a0] min-w-[20px] text-center">{a.votes}</span>
                          <button
                            onClick={() => handleVote(a.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-[#555570] hover:text-red-400 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-[10px] text-[#555570] pt-2">Relatos da comunidade · Sempre verifique com seu mecânico antes de adaptar</p>
                </div>
              )
            )}

            {/* SUBMIT FORM */}
            <div className="mt-6">
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full py-3 text-sm font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
              >
                {showForm ? 'Cancelar' : '+ Contribuir com adaptação'}
              </button>
              {showForm && (
                <form onSubmit={handleSubmit} className="mt-4 bg-[#0d0d1a] border border-white/[0.06] rounded-xl p-5 space-y-4 animate-fade-in-up">
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Título da adaptação"
                    maxLength={80}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555570] focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descreva como fazer a adaptação..."
                    maxLength={500}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555570] focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                  />
                  <div className="flex gap-3">
                    <input
                      value={form.donorBrand}
                      onChange={e => setForm(f => ({ ...f, donorBrand: e.target.value }))}
                      placeholder="Marca doadora"
                      maxLength={30}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555570] focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                    <input
                      value={form.donorModel}
                      onChange={e => setForm(f => ({ ...f, donorModel: e.target.value }))}
                      placeholder="Modelo doador"
                      maxLength={40}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555570] focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="Fácil" className="bg-[#0d0d1a]">Fácil</option>
                    <option value="Média" className="bg-[#0d0d1a]">Média</option>
                    <option value="Difícil" className="bg-[#0d0d1a]">Difícil</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg hover:opacity-90 transition-all"
                  >
                    Enviar adaptação
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#555570]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-[8px] text-[#08080e] font-bold">X</div>
              <span>CrossPeças</span>
            </div>
            <p>© {new Date().getFullYear()} · Dados colaborativos · Sempre verifique com seu mecânico</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
