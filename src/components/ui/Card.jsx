export default function Card({ children, className = '', hover = false, padded = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-dark-200/70 border border-border rounded-2xl card-shadow backdrop-blur-sm
        ${padded ? 'p-4' : ''}
        ${hover ? 'hover:bg-dark-300/80 hover:border-border-light cursor-pointer transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
