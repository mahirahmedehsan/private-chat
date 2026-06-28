export default function Card({ children, className = '', hover = false, padded = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-dark-100 border border-border rounded-xl
        ${padded ? 'p-4' : ''}
        ${hover ? 'hover:bg-dark-200 hover:border-dark-400 cursor-pointer transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
