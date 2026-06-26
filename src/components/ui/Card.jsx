export default function Card({ children, className = '', hover = false, padded = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-dark-200 border border-dark-500 rounded-xl
        ${padded ? 'p-4' : ''}
        ${hover ? 'hover:bg-dark-300 hover:border-dark-600 cursor-pointer transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
