export default function InsulinPen({ type, compact = false }) {
  const rapid = type === 'novorapid'
  const name = rapid ? 'NovoRapid FlexPen' : 'Tresiba FlexTouch'
  return <figure className={`flex w-full items-center justify-center overflow-hidden ${compact ? 'h-20' : 'h-28'}`}><img src={rapid ? '/novorapid.png' : '/tresiba.png'} alt={`Stylo ${name}`} className="h-full w-[145%] max-w-none scale-125 object-contain" draggable="false" /></figure>
}
