// A cute geometric owl-like mascot built with pure SVG
export default function Mascot({ size = 100, mood = 'happy', float = true }) {
  return (
    <div className={float ? 'float' : ''} style={{ display: 'inline-block', lineHeight: 0 }}>
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        {/* Body */}
        <ellipse cx="100" cy="120" rx="65" ry="60" fill="#A78BFA"/>
        {/* Belly */}
        <ellipse cx="100" cy="135" rx="40" ry="35" fill="#C4B5FD"/>
        {/* Head */}
        <circle cx="100" cy="75" r="55" fill="#A78BFA"/>
        {/* Eye base white */}
        <circle cx="78" cy="70" r="18" fill="#FFF"/>
        <circle cx="122" cy="70" r="18" fill="#FFF"/>
        {/* Eyes */}
        {mood === 'happy' && (
          <>
            <circle cx="78" cy="72" r="9" fill="#0F0E17"/>
            <circle cx="122" cy="72" r="9" fill="#0F0E17"/>
            <circle cx="81" cy="68" r="3" fill="#FFF"/>
            <circle cx="125" cy="68" r="3" fill="#FFF"/>
          </>
        )}
        {mood === 'sad' && (
          <>
            <circle cx="78" cy="75" r="7" fill="#0F0E17"/>
            <circle cx="122" cy="75" r="7" fill="#0F0E17"/>
          </>
        )}
        {mood === 'wink' && (
          <>
            <path d="M70 70 Q78 65 86 70" stroke="#0F0E17" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <circle cx="122" cy="72" r="9" fill="#0F0E17"/>
            <circle cx="125" cy="68" r="3" fill="#FFF"/>
          </>
        )}
        {/* Beak */}
        <path d="M95 90 L100 100 L105 90 Z" fill="#FCD34D"/>
        {/* Cheeks */}
        <circle cx="65" cy="90" r="7" fill="#FB7185" opacity="0.6"/>
        <circle cx="135" cy="90" r="7" fill="#FB7185" opacity="0.6"/>
        {/* Ears/tufts */}
        <path d="M55 40 L60 25 L70 40 Z" fill="#A78BFA"/>
        <path d="M145 40 L140 25 L130 40 Z" fill="#A78BFA"/>
        {/* Feet */}
        <ellipse cx="80" cy="178" rx="12" ry="6" fill="#FCD34D"/>
        <ellipse cx="120" cy="178" rx="12" ry="6" fill="#FCD34D"/>
      </svg>
    </div>
  )
}