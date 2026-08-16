'use client'

import { useMemo, useState } from 'react'

const PAIR_PRESETS = [
  { id: 'standard', label: 'جفت‌های استاندارد (مثل EURUSD)', pipSize: 0.0001, pipValuePerLot: 10 },
  { id: 'jpy', label: 'جفت‌های ین (مثل USDJPY)', pipSize: 0.01, pipValuePerLot: 10 },
  { id: 'gold', label: 'طلا (XAUUSD) — تقریبی', pipSize: 0.1, pipValuePerLot: 10 },
  { id: 'custom', label: 'سفارشی', pipSize: 0.0001, pipValuePerLot: 10 },
]

const inputClass =
  'w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white'

export default function RiskCalculatorTool() {
  const [balance, setBalance] = useState('10000')
  const [riskPercent, setRiskPercent] = useState('1')
  const [entry, setEntry] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [pairType, setPairType] = useState('standard')
  const [customPipSize, setCustomPipSize] = useState('0.0001')
  const [customPipValue, setCustomPipValue] = useState('10')
  const [direction, setDirection] = useState('buy')

  const preset = PAIR_PRESETS.find((p) => p.id === pairType) || PAIR_PRESETS[0]
  const pipSize =
    pairType === 'custom' ? Number(customPipSize) || 0.0001 : preset.pipSize
  const pipValuePerLot =
    pairType === 'custom' ? Number(customPipValue) || 10 : preset.pipValuePerLot

  const result = useMemo(() => {
    const bal = Number(balance)
    const riskPct = Number(riskPercent)
    const e = Number(entry)
    const s = Number(sl)
    const t = tp === '' ? null : Number(tp)

    if (!bal || bal <= 0 || !riskPct || riskPct <= 0) {
      return { error: 'موجودی و درصد ریسک را وارد کنید' }
    }

    const riskAmount = (bal * riskPct) / 100

    if (!e || !s || Number.isNaN(e) || Number.isNaN(s)) {
      return {
        riskAmount,
        error: null,
        partial: true,
        message: 'برای محاسبه حجم، Entry و SL را وارد کنید',
      }
    }

    const priceDist = Math.abs(e - s)
    if (priceDist === 0) {
      return { riskAmount, error: 'فاصله Entry و SL صفر است' }
    }

    if (direction === 'buy' && s >= e) {
      return {
        riskAmount,
        error: 'در معامله Buy حد ضرر باید پایین‌تر از Entry باشد',
      }
    }
    if (direction === 'sell' && s <= e) {
      return {
        riskAmount,
        error: 'در معامله Sell حد ضرر باید بالاتر از Entry باشد',
      }
    }

    const slPips = priceDist / pipSize
    const lotSize = riskAmount / (slPips * pipValuePerLot)
    const units = lotSize * 100000

    let tpPips = null
    let rr = null
    let rewardAmount = null
    if (t != null && !Number.isNaN(t)) {
      const tpDist = Math.abs(t - e)
      tpPips = tpDist / pipSize
      rr = slPips > 0 ? tpPips / slPips : null
      rewardAmount = riskAmount * (rr || 0)
    }

    return {
      riskAmount,
      slPips,
      tpPips,
      lotSize,
      units,
      rr,
      rewardAmount,
      error: null,
      partial: false,
    }
  }, [balance, riskPercent, entry, sl, tp, pipSize, pipValuePerLot, direction])

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
        <h2 className="text-xl font-bold text-white mb-1">ماشین‌حساب ریسک و حجم</h2>
        <p className="text-sm text-white/60 mb-5">
          با درصد ریسک حساب، فاصله SL و ارزش هر پیپ، حجم معامله (لات) را محاسبه کنید
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <Field label="موجودی حساب ($)">
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="ریسک (%)">
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="جهت معامله">
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className={inputClass}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </Field>
          <Field label="نوع نماد / پیپ">
            <select
              value={pairType}
              onChange={(e) => setPairType(e.target.value)}
              className={inputClass}
            >
              {PAIR_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Entry">
            <input
              type="number"
              step="any"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className={inputClass}
              placeholder="قیمت ورود"
            />
          </Field>
          <Field label="SL">
            <input
              type="number"
              step="any"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              className={inputClass}
              placeholder="حد ضرر"
            />
          </Field>
          <Field label="TP (اختیاری)">
            <input
              type="number"
              step="any"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              className={inputClass}
              placeholder="حد سود"
            />
          </Field>
        </div>

        {pairType === 'custom' && (
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <Field label="اندازه ۱ پیپ (قیمت)">
              <input
                type="number"
                step="any"
                value={customPipSize}
                onChange={(e) => setCustomPipSize(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="ارزش ۱ پیپ برای ۱ لات ($)">
              <input
                type="number"
                step="any"
                value={customPipValue}
                onChange={(e) => setCustomPipValue(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {result.error && (
          <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 text-sm px-4 py-3 mb-4">
            {result.error}
          </div>
        )}
        {result.partial && !result.error && (
          <div className="rounded-lg border border-white/15 bg-white/5 text-white/60 text-sm px-4 py-3 mb-4">
            مبلغ ریسک:{' '}
            <strong className="text-white">
              ${Number(result.riskAmount).toFixed(2)}
            </strong>
            {' — '}
            {result.message}
          </div>
        )}

        {!result.error && !result.partial && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="مبلغ ریسک" value={`$${result.riskAmount.toFixed(2)}`} />
            <Stat label="فاصله SL" value={`${result.slPips.toFixed(1)} پیپ`} />
            <Stat
              label="حجم پیشنهادی"
              value={`${result.lotSize.toFixed(2)} لات`}
              highlight
            />
            <Stat
              label="تقریبی واحد"
              value={Math.round(result.units).toLocaleString('en-US')}
            />
            {result.rr != null && (
              <>
                <Stat label="فاصله TP" value={`${result.tpPips.toFixed(1)} پیپ`} />
                <Stat label="RR" value={`1:${result.rr.toFixed(2)}`} />
                <Stat
                  label="سود بالقوه"
                  value={`$${result.rewardAmount.toFixed(2)}`}
                />
              </>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 text-sm text-white/55 leading-relaxed">
        <h3 className="font-semibold text-white mb-2">نکته</h3>
        <ul className="list-disc pr-5 space-y-1">
          <li>
            فرمول: لات = مبلغ ریسک ÷ (پیپ SL × ارزش هر پیپ در ۱ لات استاندارد)
          </li>
          <li>
            ارزش پیپ پیش‌فرض ۱۰ دلار برای ۱ لات استاندارد است؛ برای حساب‌های
            سنت/مینی یا نمادهای خاص از حالت سفارشی استفاده کنید.
          </li>
          <li>این ابزار فقط کمک محاسباتی است و جایگزین مدیریت ریسک شخصی نیست.</li>
        </ul>
      </section>
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

function Stat({ label, value, highlight }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? 'border-emerald-400/40 bg-emerald-500/15'
          : 'border-white/10 bg-black/25'
      }`}
    >
      <div className="text-[11px] text-white/50 mb-1">{label}</div>
      <div className="text-lg font-bold text-white tabular-nums">{value}</div>
    </div>
  )
}
