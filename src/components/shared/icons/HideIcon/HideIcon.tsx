import React from 'react';

interface CustomizableIconProps {
    width?: string;
    height?: string;
    fill?: string;
    viewBox?: string;
    onClick?: () => void;
    hidden?: boolean;
    className?: string;
}

const CustomizableIcon: React.FC<CustomizableIconProps> = ({
    width = '20',
    height = '20',
    fill = '#007bff',
    viewBox = '0 0 100 100',
    onClick,
    hidden,
    className,
}) => {
    const style = hidden ? { transform: 'rotate(180deg)' } : {};

    return (
        <svg onClick={onClick} width={width} height={height} viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
            <polygon points="50,15 85,85 15,85" fill={fill} />
        </svg>
    );
};

export default CustomizableIcon;