/**
 * Extra discovery tags some Iranian messengers (Bale) look for
 * when they do not use Telegram-style Open Graph unfurl.
 * React/Next hoists these into <head>.
 */
export default function BalePreviewTags({ title, description, image, url }) {
  if (!title || !url) return null

  return (
    <>
      <link rel="image_src" href={image} />
      <link rel="alternate" type="application/json+oembed" href={oembedHref(url)} />
      <meta name="title" content={title} />
      {image ? <meta name="image" content={image} /> : null}
      {image ? <meta name="thumbnail" content={image} /> : null}
      {image ? <meta name="twitter:image:src" content={image} /> : null}
      <meta itemProp="name" content={title} />
      <meta itemProp="headline" content={title} />
      {description ? <meta itemProp="description" content={description} /> : null}
      {image ? <meta itemProp="image" content={image} /> : null}
      <meta itemProp="url" content={url} />
      {image ? <meta property="vk:image" content={image} /> : null}
      <meta property="vk:title" content={title} />
    </>
  )
}

function oembedHref(url) {
  return `/api/oembed?url=${encodeURIComponent(url)}`
}
