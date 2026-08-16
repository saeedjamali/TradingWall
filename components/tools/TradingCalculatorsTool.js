'use client'

import { useMemo, useState } from 'react'

const inputClass =
  'w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white'

const TABS = [
  { id: 'pip', label: 'پیپ' },
  { id: 'pnl', label: 'سود/زیان' },
  { id: 'lot', label: 'مبدل لات' },
  { id: 'account', label: 'واحد حساب' },
]

const PAIR_TYPES = [
  { id: 'standard', label: 'استاندارد (EURUSD…)', pipSize: 0.0001, pipValue: 10 },
  { id: 'jpy', label: 'ین (USDJPY…)', pipSize: 0.01, pipValue: 10 },
  { id: 'gold', label: 'طلا (تقریبی)', pipSize: 0.1, pipValue: 10 },
]

export default function TradingCalculatorsTool({ initialTab = 'pip' }) {
  const [tab, setTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'pip',
  )

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-black/30 border border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[5.5rem] py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary-600 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pip' && <PipCalc />}
      {tab === 'pnl' && <PnlCalc />}
      {tab === 'lot' && <LotCalc />}
      {tab === 'account' && <AccountCalc />}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ResultCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="text-[11px] text-white/45 mb-1">{label}</div>
      <div className="text-lg font-bold text-white tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-white/35 mt-1">{hint}</div>}
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      {children}
    </section>
  )
}

function PipCalc() {
  const [pairType, setPairType] = useState('standard')
  const [entry, setEntry] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const pipSize = PAIR_TYPES.find((p) => p.id === pairType)?.pipSize || 0.0001

  const out = useMemo(() => {
    const e = Number(entry)
    const s = Number(sl)
    const t = tp === '' ? null : Number(tp)
    if (!e || !s) return null
    const slPips = Math.abs(e - s) / pipSize
    const tpPips = t != null && !Number.isNaN(t) ? Math.abs(t - e) / pipSize : null
    const rr = tpPips != null && slPips > 0 ? tpPips / slPips : null
    return { slPips, tpPips, rr, distSl: Math.abs(e - s), distTp: t != null ? Math.abs(t - e) : null }
  }, [entry, sl, tp, pipSize])

  return (
    <Panel title="ماشین‌حساب پیپ">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Field label="نوع جفت">
          <select value={pairType} onChange={(e) => setPairType(e.target.value)} className={inputClass}>
            {PAIR_TYPES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Entry">
          <input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} className={inputClass} />
        </Field>
        <Field label="SL">
          <input type="number" step="any" value={sl} onChange={(e) => setSl(e.target.value)} className={inputClass} />
        </Field>
        <Field label="TP (اختیاری)">
          <input type="number" step="any" value={tp} onChange={(e) => setTp(e.target.value)} className={inputClass} />
        </Field>
      </div>
      {out ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <ResultCard label="فاصله SL" value={`${out.slPips.toFixed(1)} پیپ`} />
          <ResultCard
            label="فاصله TP"
            value={out.tpPips != null ? `${out.tpPips.toFixed(1)} پیپ` : '—'}
          />
          <ResultCard
            label="RR"
            value={out.rr != null ? `1:${out.rr.toFixed(2)}` : '—'}
          />
        </div>
      ) : (
        <p className="text-sm text-white/45">Entry و SL را وارد کنید</p>
      )}
    </Panel>
  )
}

function PnlCalc() {
  const [pairType, setPairType] = useState('standard')
  const [lots, setLots] = useState('0.10')
  const [pips, setPips] = useState('20')
  const [side, setSide] = useState('profit')
  const pipValue = PAIR_TYPES.find((p) => p.id === pairType)?.pipValue || 10

  const out = useMemo(() => {
    const l = Number(lots)
    const p = Number(pips)
    if (!l || l <= 0 || Number.isNaN(p)) return null
    const raw = l * p * pipValue
    const pnl = side === 'profit' ? raw : -raw
    return { pnl, raw }
  }, [lots, pips, pairType, side, pipValue])

  return (
    <Panel title="محاسبه سود / زیان تقریبی">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Field label="نوع جفت">
          <select value={pairType} onChange={(e) => setPairType(e.target.value)} className={inputClass}>
            {PAIR_TYPES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="حجم (لات)">
          <input type="number" step="0.01" value={lots} onChange={(e) => setLots(e.target.value)} className={inputClass} />
        </Field>
        <Field label="تعداد پیپ">
          <input type="number" step="0.1" value={pips} onChange={(e) => setPips(e.target.value)} className={inputClass} />
        </Field>
        <Field label="نتیجه">
          <select value={side} onChange={(e) => setSide(e.target.value)} className={inputClass}>
            <option value="profit">سود</option>
            <option value="loss">زیان</option>
          </select>
        </Field>
      </div>
      {out ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <ResultCard
            label="PnL تقریبی"
            value={`${out.pnl >= 0 ? '+' : ''}$${out.pnl.toFixed(2)}`}
          />
          <ResultCard
            label="فرمول"
            value={`${lots} × ${pips} × $${pipValue}`}
            hint="لات × پیپ × ارزش پیپ در ۱ لات"
          />
        </div>
      ) : (
        <p className="text-sm text-white/45">حجم و پیپ را وارد کنید</p>
      )}
    </Panel>
  )
}

function LotCalc() {
  const [value, setValue] = useState('1')
  const [from, setFrom] = useState('standard')

  const out = useMemo(() => {
    const v = Number(value)
    if (!v || v < 0 || Number.isNaN(v)) return null
    // units relative to standard lot = 1.0
    const toStandard =
      from === 'standard' ? v : from === 'mini' ? v * 0.1 : v * 0.01
    return {
      standard: toStandard,
      mini: toStandard / 0.1,
      micro: toStandard / 0.01,
      units: toStandard * 100000,
    }
  }, [value, from])

  return (
    <Panel title="مبدل لات">
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Field label="مقدار">
          <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
        </Field>
        <Field label="واحد ورودی">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
            <option value="standard">لات استاندارد</option>
            <option value="mini">مینی لات (۰.۱)</option>
            <option value="micro">میکرو لات (۰.۰۱)</option>
          </select>
        </Field>
      </div>
      {out ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ResultCard label="استاندارد" value={out.standard.toFixed(2)} />
          <ResultCard label="مینی" value={out.mini.toFixed(2)} />
          <ResultCard label="میکرو" value={out.micro.toFixed(2)} />
          <ResultCard label="واحد (تقریبی)" value={Math.round(out.units).toLocaleString('en-US')} />
        </div>
      ) : (
        <p className="text-sm text-white/45">مقدار را وارد کنید</p>
      )}
    </Panel>
  )
}

function AccountCalc() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('usd')

  const out = useMemo(() => {
    const a = Number(amount)
    if (!a || Number.isNaN(a)) return null
    // Display conversion for risk labeling — not live FX rates.
    // Cent account: $1 = 100 cents (broker display)
    // Rough GBP label using fixed illustrative rate for UI only
    const GBP_PER_USD = 0.79
    let usd = a
    if (from === 'cent') usd = a / 100
    if (from === 'gbp') usd = a / GBP_PER_USD

    return {
      usd,
      cent: usd * 100,
      gbp: usd * GBP_PER_USD,
    }
  }, [amount, from])

  return (
    <Panel title="مبدل واحد حساب (نمایشی)">
      <p className="text-xs text-white/45 mb-3">
        برای مقایسه نمایش ریسک بین حساب دلار، سنت و پوند — نرخ پوند تقریبی و ثابت است.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Field label="مقدار">
          <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </Field>
        <Field label="واحد ورودی">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
            <option value="usd">دلار (USD)</option>
            <option value="cent">سنت (Cent account)</option>
            <option value="gbp">پوند (GBP)</option>
          </select>
        </Field>
      </div>
      {out ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <ResultCard label="دلار" value={`$${out.usd.toFixed(2)}`} />
          <ResultCard label="سنت" value={`${out.cent.toFixed(0)} ¢`} />
          <ResultCard label="پوند (تقریبی)" value={`£${out.gbp.toFixed(2)}`} />
        </div>
      ) : (
        <p className="text-sm text-white/45">مقدار را وارد کنید</p>
      )}
    </Panel>
  )
}
