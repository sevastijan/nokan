import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { AvatarProps } from './types';

const Avatar = ({ src, alt = 'User avatar', size = 'md', className = '', priority = false }: AvatarProps) => {
     // Map size strings to pixel values
     const getSizeClasses = (size: 'sm' | 'md' | 'lg' | 'xl' | number) => {
          if (typeof size === 'number') {
               return {
                    className: `rounded-full`,
                    style: { width: `${size}px`, height: `${size}px` },
               };
          }

          const sizeMap = {
               sm: { className: 'w-8 h-8 rounded-full' },
               md: { className: 'w-10 h-10 rounded-full' },
               lg: { className: 'w-12 h-12 rounded-full' },
               xl: { className: 'w-16 h-16 rounded-full' },
          };

          return { ...sizeMap[size], style: {} };
     };

     const { className: sizeClassName, style } = getSizeClasses(size);

     // Dynamically calculate icon size for numeric sizes
     const getIconSize = () => {
          if (typeof size === 'number') {
               const iconSize = Math.max(12, Math.floor(size * 0.6));
               return { width: iconSize, height: iconSize };
          }

          const iconSizeMap = {
               sm: 'w-4 h-4',
               md: 'w-5 h-5',
               lg: 'w-6 h-6',
               xl: 'w-8 h-8',
          };
          return iconSizeMap[size] || 'w-5 h-5';
     };

     const iconSize = getIconSize();

     const validSrc = typeof src === 'string' && src.startsWith('http') ? src : undefined;

     return (
          <div className={`${sizeClassName} ${className} flex items-center justify-center bg-slate-700 overflow-hidden relative`} style={style}>
               {validSrc ? (
                    <Image
                         src={validSrc}
                         alt={alt}
                         fill
                         sizes="64px"
                         className="rounded-full object-cover"
                         referrerPolicy="no-referrer"
                         priority={priority}
                         onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                         }}
                    />
               ) : (
                    <FaUser
                         className="text-slate-400"
                         style={typeof size === 'number' && typeof iconSize !== 'string' ? iconSize : {}}
                         size={typeof size === 'number' && typeof iconSize !== 'string' ? iconSize.width : undefined}
                    />
               )}
          </div>
     );
};

export default Avatar;
