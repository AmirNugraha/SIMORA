/**
 * Logo Kementerian Lingkungan Hidup dan Kehutanan (KLHK)
 * Representasi stilisasi: perisai dengan elemen pohon dan air
 */
export default function LogoKLHK({ size = 40, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Perisai / Shield */}
            <path
                d="M60 8L16 28V58C16 84 36 106 60 114C84 106 104 84 104 58V28L60 8Z"
                fill="#065F46"
                stroke="#064E3B"
                strokeWidth="2"
            />

            {/* Inner border */}
            <path
                d="M60 14L22 32V58C22 80.5 39.5 100 60 107.5C80.5 100 98 80.5 98 58V32L60 14Z"
                fill="#047857"
                stroke="#065F46"
                strokeWidth="1"
            />

            {/* Sky gradient area */}
            <path
                d="M60 20L28 36V56C28 56 28 56 28 56L60 42L92 56V36L60 20Z"
                fill="#0E7490"
                opacity="0.3"
            />

            {/* Pohon tengah (besar) - Pine/Conifer */}
            <polygon points="60,28 48,58 52,58 44,72 56,72 56,80 64,80 64,72 76,72 68,58 72,58" fill="#ECFDF5" />

            {/* Pohon kiri */}
            <polygon points="38,48 32,66 35,66 30,78 42,78 42,82 46,82 46,78 50,78 45,66 48,66" fill="#D1FAE5" opacity="0.85" />

            {/* Pohon kanan */}
            <polygon points="82,48 76,66 79,66 74,78 86,78 86,82 90,82 90,78 94,78 89,66 92,66" fill="#D1FAE5" opacity="0.85" />

            {/* Air / gelombang bawah */}
            <path
                d="M32 88C38 84 44 88 50 84C56 80 58 84 60 86C62 84 64 80 70 84C76 88 82 84 88 88"
                stroke="#A7F3D0"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M35 94C41 90 47 94 53 90C59 86 61 90 63 92C65 90 67 86 73 90C79 94 85 90 91 94"
                stroke="#6EE7B7"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
            />

            {/* Aksen bintang kecil di atas pohon tengah */}
            <circle cx="60" cy="24" r="2.5" fill="#FDE68A" />
        </svg>
    );
}
