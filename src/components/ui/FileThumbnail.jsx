import { useEffect, useRef, useState } from 'react';

// First-page preview for a brochure. Images show as-is; PDFs are rendered with pdf.js
// (loaded on demand, only once the card scrolls into view). Anything that can't be
// previewed — e.g. the file host blocks cross-origin reads — falls back to `fallback`.
const cache = new Map(); // url → data URL | null (failed)

const renderPdfFirstPage = async (url, width, httpHeaders) => {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ url, httpHeaders, disableAutoFetch: true, disableStream: true }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width * 2) / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    doc.destroy();
  }
};

// type: 'pdf' | 'image' | anything else (no preview). httpHeaders: e.g. auth for an API-served PDF.
const FileThumbnail = ({ url, type, alt = '', width = 320, className = '', fallback = null, httpHeaders }) => {
  const ref = useRef(null);
  const [src, setSrc] = useState(() => (type === 'image' ? url : cache.get(url)));
  const [failed, setFailed] = useState(() => cache.get(url) === null);

  useEffect(() => {
    if (type !== 'pdf' || !url || src || failed) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      renderPdfFirstPage(url, width, httpHeaders)
        .then(dataUrl => { cache.set(url, dataUrl); if (!cancelled) setSrc(dataUrl); })
        .catch(() => { cache.set(url, null); if (!cancelled) setFailed(true); });
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => { cancelled = true; observer.disconnect(); };
  }, [url, type, width, src, failed]);

  if (src && !failed) {
    return <img ref={ref} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover object-top ${className}`} />;
  }
  return <div ref={ref} className={className}>{fallback}</div>;
};

export default FileThumbnail;
