const DEFAULT_SIZES = [5, 20, 40, 60, 100];

export default function Pagination({
  page, totalPages, onChange, pageSize, onPageSizeChange, pageSizeOptions = DEFAULT_SIZES,
}) {
  return (
    <div className="pagination">
      {onPageSizeChange && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
          Mostrar
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} style={{ padding: '5px 8px' }}>
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      {totalPages > 1 && (
        <>
          <button className="btn btn-outline btn-sm" disabled={page <= 1}
            onClick={() => onChange(page - 1)}>
            Anterior
          </button>
          <span className="subtitle">Pagina {page} de {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}>
            Siguiente
          </button>
        </>
      )}
    </div>
  );
}
