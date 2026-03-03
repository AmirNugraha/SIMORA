import LogoKLHK from '@/Components/LogoKLHK';

export default function ApplicationLogo({ className = '', ...props }) {
    // Extract size from className (h-9 → 36, h-20 → 80, etc.)
    const sizeMatch = className.match(/(?:w|h)-(\d+)/);
    const size = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 40;

    return <LogoKLHK size={size} className={className} {...props} />;
}
