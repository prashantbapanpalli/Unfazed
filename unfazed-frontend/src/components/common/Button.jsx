export default function Button({ variant = 'primary', className = '', ...props }) {
  const cls = variant === 'ghost' ? 'btn-ghost' : variant === 'danger' ? 'btn-danger' : 'btn'
  return <button {...props} className={`${cls} ${className}`} />
}
