'use client'

/**
 * Description of selected setup(s), shown under a setup picker.
 */
export default function SelectedSetupNote({
  setups = [],
  selectedIds,
  dark = false,
}) {
  const ids = (Array.isArray(selectedIds) ? selectedIds : [selectedIds])
    .filter(Boolean)
    .map(String)
  const items = (setups || []).filter(
    (s) => ids.includes(String(s._id)) && String(s.description || '').trim(),
  )
  if (!items.length) return null

  const box = dark
    ? 'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap'
    : 'rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap'

  return (
    <div className="mt-2 space-y-1.5">
      {items.map((s) => (
        <p key={String(s._id)} className={box}>
          {items.length > 1 && (
            <span className="font-semibold block mb-0.5">{s.title}</span>
          )}
          {s.description}
        </p>
      ))}
    </div>
  )
}
